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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MultiSelect, type Option } from '../ui/multi-select';

interface Provider {
  id: string;
  businessName: string;
  categoryIds?: string[];
}

interface Category {
  id: string;
  name: string;
}

interface AssignCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider | null;
}

export function AssignCategoriesModal({
  isOpen,
  onClose,
  provider,
}: AssignCategoriesModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState<Option[]>([]);

  const categoriesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'categories') : null),
    [firestore]
  );
  const { data: categories, isLoading: isLoadingCategories } =
    useCollection<Category>(categoriesCollectionRef);

  const categoryOptions = useMemo(
    () =>
      categories?.map((cat) => ({
        value: cat.id,
        label: cat.name,
      })) || [],
    [categories]
  );

  useEffect(() => {
    if (provider) {
      const currentProviderCategories =
        categoryOptions.filter((opt) =>
          provider.categoryIds?.includes(opt.value)
        ) || [];
      setSelected(currentProviderCategories);
    } else {
      setSelected([]);
    }
  }, [provider, categoryOptions]);

  const handleSave = async () => {
    if (!firestore || !provider) return;

    setIsSubmitting(true);
    const providerRef = doc(firestore, 'providers', provider.id);

    try {
      const newCategoryIds = selected.map((opt) => opt.value);
      await updateDoc(providerRef, {
        categoryIds: newCategoryIds,
      });
      toast({
        title: 'Categorías Actualizadas',
        description: `Se han actualizado las categorías para ${provider.businessName}.`,
      });
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron actualizar las categorías.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Categorías</DialogTitle>
          <DialogDescription>
            Selecciona las categorías para{' '}
            <span className="font-bold">{provider?.businessName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <MultiSelect
            options={categoryOptions}
            selected={selected}
            onChange={setSelected}
            isLoading={isLoadingCategories}
            className="w-full"
            placeholder="Selecciona categorías..."
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
