'use client';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Loader2, PlusCircle, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SelectionEvent {
  name: string;
  type: 'Bienes' | 'Servicios (Contratista)';
  status: 'Abierto' | 'Cerrado';
  createdAt: Timestamp;
}

export default function SelectionEventsList() {
  const firestore = useFirestore();

  const eventsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'selection_events'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: events, isLoading, error } = useCollection<SelectionEvent>(eventsQuery);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando procesos de selección...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error de Permiso</AlertTitle>
        <AlertDescription>
          No tienes permiso para ver los procesos de selección o falta un índice en Firestore.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button asChild>
            <Link href="/selection/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Proceso de Selección
            </Link>
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Proceso</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!events || events.length === 0) ? (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No hay procesos de selección creados.
                    </TableCell>
                </TableRow>
            ) : (
                events.map((event) => (
                <TableRow key={event.id} className="hover:bg-muted/50 cursor-pointer">
                    <TableCell className="font-medium">
                        <Link href={`/selection/${event.id}`} className="block w-full h-full">
                            {event.name}
                        </Link>
                    </TableCell>
                    <TableCell>
                        <Link href={`/selection/${event.id}`} className="block w-full h-full">
                            <Badge variant="secondary">{event.type}</Badge>
                        </Link>
                    </TableCell>
                    <TableCell>
                         <Link href={`/selection/${event.id}`} className="block w-full h-full">
                            <Badge variant={event.status === 'Abierto' ? 'default' : 'outline'}>{event.status}</Badge>
                        </Link>
                    </TableCell>
                    <TableCell>
                        <Link href={`/selection/${event.id}`} className="block w-full h-full">
                            {event.createdAt ? format(event.createdAt.toDate(), 'dd MMMM, yyyy', { locale: es }) : 'N/A'}
                        </Link>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" asChild>
                           <Link href={`/selection/${event.id}`}>
                               <ChevronRight className="h-4 w-4" />
                           </Link>
                       </Button>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
