'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { writeBatch, collection, doc } from 'firebase/firestore';
import { useState } from 'react';
import { Loader2, Inbox, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

// Schema for validation
const categoryImportSchema = z.object({
  Nombre: z.string().min(1, 'El nombre es requerido.'),
  Descripción: z.string().optional(),
  Tipo: z.enum(['Bienes', 'Servicios (Contratista)'], {
    errorMap: () => ({ message: 'El tipo debe ser "Bienes" o "Servicios (Contratista)".' }),
  }),
});

const importSchema = z.array(categoryImportSchema);

type ParsedCategory = z.infer<typeof categoryImportSchema>;

interface CategoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryImportModal({ isOpen, onClose }: CategoryImportModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsedData([]);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const validationResult = importSchema.safeParse(json);
        if (!validationResult.success) {
          const firstError = validationResult.error.errors[0];
          setError(`Error en la fila ${Number(firstError.path[0]) + 2}: ${firstError.message} en la columna '${firstError.path[1]}'.`);
          return;
        }
        setParsedData(validationResult.data);
      } catch (err) {
        setError('Error al procesar el archivo. Asegúrate de que sea un archivo Excel válido con las columnas correctas.');
        console.error(err);
      }
    };
    reader.onerror = () => {
      setError('No se pudo leer el archivo.');
    };
    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Reset file input
  };

  const handleConfirmImport = async () => {
    if (!firestore || parsedData.length === 0) return;

    setIsSubmitting(true);
    const batch = writeBatch(firestore);
    const categoriesCollection = collection(firestore, 'categories');

    parsedData.forEach(categoryData => {
      const newDocRef = doc(categoriesCollection);
      batch.set(newDocRef, {
        name: categoryData.Nombre,
        description: categoryData.Descripción || '',
        categoryType: categoryData.Tipo,
      });
    });

    try {
      await batch.commit();
      toast({
        title: 'Importación Exitosa',
        description: `${parsedData.length} categorías han sido importadas.`,
      });
      handleClose();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error en la Importación',
        description: 'No se pudieron guardar las categorías en la base de datos.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setParsedData([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar Categorías desde Excel</DialogTitle>
          <DialogDescription>
            Sube un archivo .xlsx con las columnas: "Nombre", "Descripción" (opcional), y "Tipo" ("Bienes" o "Servicios (Contratista)").
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            disabled={isSubmitting}
          />

          {error && <Alert variant="destructive"><AlertTitle>Error de Validación</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

          {parsedData.length > 0 ? (
            <>
                <p className="text-sm font-medium">Vista Previa de la Importación ({parsedData.length} registros encontrados):</p>
                <ScrollArea className="h-64 rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Tipo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{row.Nombre}</TableCell>
                                    <TableCell>{row.Descripción || 'N/A'}</TableCell>
                                    <TableCell>{row.Tipo}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-md text-center">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Esperando archivo para la importación...</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmImport} disabled={isSubmitting || parsedData.length === 0 || !!error}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <>
                    <Inbox className="mr-2 h-4 w-4" />
                    Confirmar Importación
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
