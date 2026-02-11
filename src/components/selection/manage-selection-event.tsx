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
import { useState, useEffect } from 'react';
import { CriteriaManager } from './criteria-manager';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { CompetitorsManager } from './competitors-manager';
import { ResultsManager } from './results-manager';

// Matching the schema in backend.json
export interface Competitor {
  id: string;
  name: string;
  quoteUrl?: string;
  scores?: Record<string, number>;
  totalScore?: number;
  isWinner?: boolean;
}

export interface Criterion {
  id: string;
  label: string;
  weight: number;
}

export interface SelectionEvent {
  id: string;
  name: string;
  type: 'Bienes' | 'Servicios (Contratista)';
  status: 'Abierto' | 'Cerrado';
  createdAt: Timestamp;
  winnerId?: string;
  criteria?: Criterion[];
  competitors?: Competitor[];
}

export default function ManageSelectionEvent({ eventId }: { eventId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const eventDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'selection_events', eventId) : null),
    [firestore, eventId]
  );

  const { data: initialEvent, isLoading, error } = useDoc<SelectionEvent>(eventDocRef);

  const [event, setEvent] = useState<SelectionEvent | null>(initialEvent);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialEvent) {
      setEvent(initialEvent);
    }
  }, [initialEvent]);

  const handleUpdateEvent = async (updatedData: Partial<SelectionEvent>) => {
    if (!eventDocRef) return;
    setIsSaving(true);
    try {
      await updateDoc(eventDocRef, updatedData);
      setEvent((prev) => (prev ? { ...prev, ...updatedData } : null));
      toast({
        title: 'Proceso Actualizado',
        description: 'Los cambios han sido guardados correctamente.',
      });
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
  
  const defaultAccordionValue = !event.criteria || event.criteria.length === 0 ? "step-1" :
                                !event.competitors || event.competitors.length === 0 ? "step-2" : "step-3";

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/selection">
              <ArrowLeft className="h-4 w-4" />
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
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={defaultAccordionValue}>
        <AccordionItem value="step-1" className="border-b-0">
          <AccordionTrigger
            className="text-xl font-semibold p-4 bg-muted/50 rounded-md hover:no-underline"
            disabled={isSaving}
          >
            Paso 1: Definir Criterios de Evaluación
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
            <div className="p-6 border rounded-b-md">
              <CriteriaManager
                criteria={event.criteria || []}
                onSave={(newCriteria) => handleUpdateEvent({ criteria: newCriteria })}
                isLocked={isLocked}
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
            Paso 3: Ver Resultados y Seleccionar Ganador
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
            <div className="p-6 border rounded-b-md">
                <ResultsManager
                    competitors={event.competitors || []}
                    onDeclareWinner={(winnerId) => handleUpdateEvent({ winnerId, status: 'Cerrado' })}
                    winnerId={event.winnerId}
                    isLocked={isLocked}
                />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
