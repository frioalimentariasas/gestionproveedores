
'use client';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  useUser,
  WithId,
} from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Loader2, PlusCircle, ChevronRight, Trash2 } from 'lucide-react';
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
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteSelectionEvent } from '@/actions/user-management';

interface SelectionEvent {
  name: string;
  type: 'Productos' | 'Servicios';
  status: 'Abierto' | 'Cerrado';
  createdAt: Timestamp;
}

export default function SelectionEventsList() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WithId<SelectionEvent> | null>(null);

  const eventsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'selection_events'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: events, isLoading, error } = useCollection<SelectionEvent>(eventsQuery);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    const result = await deleteSelectionEvent(deleteTarget.id);

    if (result.success) {
        toast({
            title: 'Proceso Eliminado',
            description: `El proceso "${deleteTarget.name}" ha sido eliminado.`,
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Error al eliminar',
            description: result.error || 'No se pudo eliminar el proceso.',
        });
    }

    setIsDeleting(false);
    setDeleteTarget(null);
  };

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
              <TableHead>Sector</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
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
                <TableRow key={event.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                        <Link href={`/selection/${event.id}`} className="hover:underline">
                            {event.name}
                        </Link>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary">{event.type}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={event.status === 'Abierto' ? 'default' : 'outline'}>{event.status}</Badge>
                    </TableCell>
                    <TableCell>
                        {event.createdAt ? format(event.createdAt.toDate(), 'dd MMMM, yyyy', { locale: es }) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                       {user?.email === 'sistemas@frioalimentaria.com.co' && (
                         <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(event)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                         </Button>
                       )}
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
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente el proceso de selección "{deleteTarget?.name}" y todas sus cotizaciones adjuntas.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sí, eliminar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
