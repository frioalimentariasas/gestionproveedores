
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { categorySchema } from '@/lib/schemas';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface Category {
  id: string;
  name: string;
  description?: string;
  categoryType?: 'Productos' | 'Servicios';
  sequenceId?: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  categories: Category[];
}

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoryModal({
  isOpen,
  onClose,
  category,
  categories,
}: CategoryModalProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!category;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      categoryType: 'Productos',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        form.reset({
          name: category.name,
          description: category.description || '',
          categoryType: category.categoryType || 'Productos',
        });
      } else {
        form.reset({
          name: '',
          description: '',
          categoryType: 'Productos',
        });
      }
    }
  }, [isOpen, category, isEditing, form]);

  async function onSubmit(values: CategoryFormValues) {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      if (isEditing) {
        const categoryRef = doc(firestore, 'categories', category.id);
        await setDoc(categoryRef, values, { merge: true });
        toast({
          title: 'Categoría Actualizada',
          description: `La categoría "${values.name}" se ha actualizado.`,
        });
      } else {
        // Find the highest current sequence ID
        let maxId = 0;
        if (categories && categories.length > 0) {
            for (const cat of categories) {
                if (cat.sequenceId) {
                    const idNum = parseInt(cat.sequenceId, 10);
                    if (idNum > maxId) {
                        maxId = idNum;
                    }
                }
            }
        }
        const nextId = maxId + 1;
        const newSequenceId = String(nextId).padStart(4, '0');

        const categoriesCollection = collection(firestore, 'categories');
        await addDoc(categoriesCollection, {
            ...values,
            sequenceId: newSequenceId
        });
        toast({
          title: 'Categoría Creada',
          description: `La categoría "${values.name}" se ha creado con el ID ${newSequenceId}.`,
        });
      }
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la categoría.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edita los detalles de la categoría.'
              : 'Crea una nueva categoría para organizar a tus proveedores.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Categoría</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Insumos de Oficina" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe para qué se usa esta categoría"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="categoryType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Sector</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Productos" />
                        </FormControl>
                        <FormLabel className="font-normal">Productos</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Servicios" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Servicios
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
