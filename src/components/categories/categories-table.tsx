'use client';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, doc, deleteDoc } from 'firebase/firestore';
import { Loader2, PlusCircle, Trash2, Pencil, FileUp, FileDown, Printer } from 'lucide-react';
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
import { Badge } from '../ui/badge';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { CategoryImportModal } from './category-import-modal';

interface Category {
  id: string;
  name: string;
  description?: string;
  categoryType?: 'Bienes' | 'Servicios (Contratista)';
}

export default function CategoriesTable() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({ isOpen: false, category: null });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  const handleExportExcel = () => {
    if (!categories || categories.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No hay datos',
        description: 'No hay categorías para exportar.',
      });
      return;
    }
    const dataToExport = categories.map(({ name, description, categoryType }) => ({
      Nombre: name,
      Descripción: description || '',
      Tipo: categoryType || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Categorías");
    XLSX.writeFile(workbook, "Categorias_Proveedores.xlsx");
    toast({ title: 'Exportación Exitosa', description: 'Las categorías se han exportado a Excel.' });
  };

  const handleExportPdf = async () => {
    if (!categories || categories.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No hay datos',
        description: 'No hay categorías para exportar.',
      });
      return;
    }

    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = margin;

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Listado de Categorías', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    categories.forEach(cat => {
        if (yPos > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            yPos = margin;
        }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(cat.name, margin, yPos);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150);
        doc.text(`Tipo: ${cat.categoryType || 'N/A'}`, margin, yPos + 5);
        
        doc.setTextColor(0);
        const descLines = doc.splitTextToSize(cat.description || 'Sin descripción.', pageWidth - (margin * 2));
        doc.text(descLines, margin, yPos + 12);
        
        yPos += 12 + (descLines.length * 5) + 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
    });

    doc.save('Categorias.pdf');
    toast({ title: 'Exportación Exitosa', description: 'Las categorías se han exportado a PDF.' });
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
      <div className="flex justify-end mb-4 gap-2 flex-wrap">
        <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
          <FileUp className="mr-2 h-4 w-4" />
          Importar
        </Button>
        <Button variant="outline" onClick={handleExportExcel}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
        <Button variant="outline" onClick={handleExportPdf}>
          <Printer className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
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
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!categories || categories.length === 0) ? (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No hay categorías registradas.
                    </TableCell>
                </TableRow>
            ) : (
                categories.map((category) => (
                <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || 'N/A'}</TableCell>
                    <TableCell>
                      {category.categoryType ? (
                        <Badge variant="secondary">{category.categoryType}</Badge>
                      ) : 'N/A'}
                    </TableCell>
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

      <CategoryImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
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
