'use client';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import { collection, query, doc, deleteDoc } from 'firebase/firestore';
import { Loader2, PlusCircle, Trash2, Pencil } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { useState } from 'react';
import { CategoryModal } from './category-modal';

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function CategoriesTable() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({ isOpen: false, category: null });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'categories')) : null),
    [firestore]
  );

  const {
    data: categories,
    isLoading,
    error,
  } = useCollection<Category>(categoriesQuery);

  const handleDelete = async () => {
    if (!firestore || !deleteTarget) return;

    const categoryRef = doc(firestore, 'categories', deleteTarget.id);

    deleteDoc(categoryRef)
      .then(() => {
        toast({
          title: 'Categoría Eliminada',
          description: `La categoría "${deleteTarget.name}" ha sido eliminada.`,
        });
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          title: 'Error al eliminar',
          description: 'No se pudo eliminar la categoría.',
        });
      });
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando categorías...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error de Permiso</AlertTitle>
        <AlertDescription>
          No tienes permiso para ver las categorías.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setModalState({ isOpen: true, category: null })}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!categories || categories.length === 0) ? (
                 <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        No hay categorías registradas.
                    </TableCell>
                </TableRow>
            ) : (
                categories.map((category) => (
                <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                    <TooltipProvider>
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                setModalState({ isOpen: true, category })
                            }
                            >
                            <Pencil className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Editar Categoría</p>
                        </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(category)}
                            >
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Eliminar Categoría</p>
                        </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, category: null })}
        category={modalState.category}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              la categoría "{deleteTarget?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
