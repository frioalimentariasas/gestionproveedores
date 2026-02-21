
'use client';

import {
  useDoc,
  useFirestore,
  useMemoFirebase,
  errorEmitter,
} from '@/firebase';
import {
  doc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useState, useEffect, useCallback } from 'react';
import { CriteriaManager } from './criteria-manager';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { CompetitorsManager } from './competitors-manager';
import { ResultsManager } from './results-manager';
import { notifyWinnerOfSelection } from '@/actions/email';
import { useSearchParams } from 'next/navigation';

// Matching the schema in backend.json
export interface Competitor {
  id: string;
  name: string;
  nit: string;
  email: string;
  quoteUrl?: string;
  scores?: Record<string, number>;
  totalScore?: number;
  isSelected?: boolean;
  auditNotes?: string;
}

export interface Criterion {
  id: string;
  label: string;
  weight: number;
}

export interface SelectionEvent {
  id: string;
  name: string;
  type: 'Productos' | 'Servicios';
  criticalityLevel?: 'Crítico' | 'No Crítico';
  status: 'Abierto' | 'Cerrado';
  createdAt: Timestamp;
  selectedCompetitorId?: string;
  justification?: string;
  criteria?: Criterion[];
  competitors?: Competitor[];
}

export default function ManageSelectionEvent({ eventId }: { eventId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const eventDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'selection_events', eventId) : null),
    [firestore, eventId]
  );

  const { data: initialEvent, isLoading, error } = useDoc<SelectionEvent>(eventDocRef);

  const [event, setEvent] = useState<SelectionEvent | null>(initialEvent);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStep, setActiveStep] = useState('step-1');

  const handleUpdateEvent = useCallback(async (updatedData: Partial<SelectionEvent>, nextStep?: string) => {
    if (!eventDocRef) return;
    setIsSaving(true);
    try {
      await updateDoc(eventDocRef, updatedData);
      setEvent((prev) => (prev ? { ...prev, ...updatedData } : null));
      toast({
        title: 'Proceso Actualizado',
        description: 'Los cambios han sido guardados correctamente.',
      });
      // Automatically navigate to the next step
      if (nextStep) {
        setActiveStep(nextStep);
      } else if (updatedData.criteria) {
        setActiveStep('step-2');
      } else if (updatedData.competitors) {
        setActiveStep('step-3');
      }
    } catch (e) {
      console.error('Error updating event:', e);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: eventDocRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        })
      );
    } finally {
      setIsSaving(false);
    }
  }, [eventDocRef, toast]);

  useEffect(() => {
    if (initialEvent) {
      setEvent(initialEvent);

      const competitorName = searchParams.get('name');
      const competitorNit = searchParams.get('nit');
      const competitorEmail = searchParams.get('email');

      // Prefill competitor if coming from comparison page and no competitors exist yet
      if (
        competitorName &&
        competitorNit &&
        competitorEmail &&
        (!initialEvent.competitors || initialEvent.competitors.length === 0)
      ) {
          const newCompetitor: Competitor = {
            id: crypto.randomUUID(),
            name: competitorName,
            nit: competitorNit,
            email: competitorEmail,
            scores: {},
            totalScore: 0,
            auditNotes: '',
          };
          // Call update and specify the next step explicitly
          handleUpdateEvent({ competitors: [newCompetitor] }, 'step-2');
      } else {
        // Logic to set the initial open accordion item if not prefilling
        if (!initialEvent.criteria || initialEvent.criteria.length === 0) {
          setActiveStep('step-1');
        } else if (!initialEvent.competitors || initialEvent.competitors.length === 0) {
          setActiveStep('step-2');
        } else {
          setActiveStep('step-3');
        }
      }
    }
  }, [initialEvent, searchParams, handleUpdateEvent]);


  const handleSelectCompetitor = async (competitor: Competitor, justification: string) => {
    if (!eventDocRef || !event) return;

    setIsSaving(true);
    
    const updatedCompetitors = event.competitors?.map(c => ({
        ...c,
        isSelected: c.id === competitor.id
    })) || [];

    const updatedData: Partial<SelectionEvent> = {
        selectedCompetitorId: competitor.id,
        status: 'Cerrado',
        justification,
        competitors: updatedCompetitors,
    };

    try {
        await updateDoc(eventDocRef, updatedData);

        // Notify the winner via email
        notifyWinnerOfSelection({
            competitorEmail: competitor.email,
            competitorName: competitor.name,
            selectionProcessName: event.name,
            eventId: event.id,
        }).catch(err => {
            console.error("Failed to send winner notification email:", err);
            // Optionally, show a toast to the admin that email failed
            toast({
                variant: "destructive",
                title: "Error de Notificación",
                description: "No se pudo enviar el correo de notificación al proveedor seleccionado.",
            });
        });

        setEvent((prev) => (prev ? { ...prev, ...updatedData } : null));
        toast({
            title: '¡Proveedor Seleccionado!',
            description: `${competitor.name} ha sido notificado. El proveedor debe usar el enlace en el correo para registrarse y asegurar la trazabilidad.`,
            duration: 9000,
        });
    } catch (e) {
        console.error('Error declaring winner:', e);
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: eventDocRef.path,
                operation: 'update',
                requestResourceData: updatedData,
            })
        );
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo seleccionar el proveedor.',
        });
    } finally {
        setIsSaving(false);
    }
  };


  const isLocked = event?.status === 'Cerrado';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center">
        <p className="text-destructive font-semibold">Error</p>
        <p className="text-muted-foreground">
          No se pudo encontrar el proceso de selección o no tienes permiso para
          verlo.
        </p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/selection">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/selection">
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{event.type}</Badge>
              <Badge
                variant={event.status === 'Abierto' ? 'default' : 'outline'}
              >
                {event.status}
              </Badge>
              <Badge variant="outline" className={event.criticalityLevel === 'Crítico' ? 'border-destructive text-destructive' : ''}>
                Criticidad: {event.criticalityLevel}
              </Badge>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
        </div>
      </div>

      <Accordion 
        type="single" 
        collapsible 
        className="w-full space-y-4" 
        value={activeStep} 
        onValueChange={setActiveStep}
      >
        <AccordionItem value="step-1" className="border-b-0">
          <AccordionTrigger
            className="text-xl font-semibold p-4 bg-muted/50 rounded-md hover:no-underline"
            disabled={isSaving}
          >
            Paso 1: Definir Criterios de Selección
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
            <div className="p-6 border rounded-b-md">
              <CriteriaManager
                criteria={event.criteria || []}
                onSave={(newCriteria) => handleUpdateEvent({ criteria: newCriteria })}
                isLocked={isLocked}
                criticalityLevel={event.criticalityLevel}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step-2" className="border-b-0">
          <AccordionTrigger
            className="text-xl font-semibold p-4 bg-muted/50 rounded-md hover:no-underline"
            disabled={isSaving}
          >
            Paso 2: Añadir Competidores y Puntajes
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
            <div className="p-6 border rounded-b-md">
                <CompetitorsManager
                    eventId={event.id}
                    criteria={event.criteria || []}
                    competitors={event.competitors || []}
                    onSave={(newCompetitors) => handleUpdateEvent({competitors: newCompetitors})}
                    isLocked={isLocked}
                />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step-3" className="border-b-0">
          <AccordionTrigger
            className="text-xl font-semibold p-4 bg-muted/50 rounded-md hover:no-underline"
            disabled={isSaving}
          >
            Paso 3: Ver Resultados y Seleccionar Proveedor
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
            <div className="p-6 border rounded-b-md">
                <ResultsManager
                    eventId={event.id}
                    eventName={event.name}
                    competitors={event.competitors || []}
                    onSelectCompetitor={handleSelectCompetitor}
                    selectedCompetitorId={event.selectedCompetitorId}
                    justification={event.justification}
                    isLocked={isLocked}
                />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
