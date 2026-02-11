'use client';

import {
  useDoc,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
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

// Matching the schema in backend.json
interface Competitor {
  id: string;
  name: string;
  quoteUrl?: string;
  scores?: Record<string, number>;
  totalScore?: number;
  isWinner?: boolean;
}

interface Criterion {
  id: string;
  label: string;
  weight: number;
}

interface SelectionEvent {
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
  const eventDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'selection_events', eventId) : null),
    [firestore, eventId]
  );

  const { data: event, isLoading, error } = useDoc<SelectionEvent>(eventDocRef);

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
            </div>
          </div>
        </div>
        {/* Actions can go here */}
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="step-1">
        <AccordionItem value="step-1" className="border-b-0">
          <AccordionTrigger className="text-xl font-semibold p-4 bg-muted/50 rounded-md hover:no-underline">
            Paso 1: Definir Criterios de Evaluación
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
             <div className="p-6 border rounded-b-md">
                <p>Aquí irá el gestor de criterios.</p>
             </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step-2" className="border-b-0">
          <AccordionTrigger className="text-xl font-semibold p-4 bg-muted/50 rounded-md hover:no-underline">
            Paso 2: Añadir Competidores y Puntajes
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
             <div className="p-6 border rounded-b-md">
                <p>Aquí irá el gestor de competidores y la tabla de puntuación.</p>
             </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step-3" className="border-b-0">
          <AccordionTrigger className="text-xl font-semibold p-4 bg-muted/50 rounded-md hover:no-underline">
            Paso 3: Ver Resultados y Seleccionar Ganador
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
             <div className="p-6 border rounded-b-md">
                <p>Aquí se mostrarán los resultados finales y se podrá declarar un ganador.</p>
             </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
