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
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

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
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const categoriesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'categories') : null),
    [firestore]
  );
  const { data: categories, isLoading: isLoadingCategories } =
    useCollection<Category>(categoriesCollectionRef);

  useEffect(() => {
    if (provider?.categoryIds) {
      setSelectedCategoryIds(new Set(provider.categoryIds));
    } else {
      setSelectedCategoryIds(new Set());
    }
    setSearchTerm(''); // Reset search on open
  }, [provider, isOpen]);

  const handleSave = async () => {
    if (!firestore || !provider) return;

    setIsSubmitting(true);
    const providerRef = doc(firestore, 'providers', provider.id);

    try {
      const newCategoryIds = Array.from(selectedCategoryIds);
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

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleCheckboxChange = (categoryId: string, checked: boolean) => {
    setSelectedCategoryIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(categoryId);
      } else {
        newSet.delete(categoryId);
      }
      return newSet;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Categorías</DialogTitle>
          <DialogDescription>
            Selecciona las categorías para{' '}
            <span className="font-bold">{provider?.businessName}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            <ScrollArea className="h-64 rounded-md border">
                <div className="p-4 space-y-4">
                {isLoadingCategories ? (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                    <div key={category.id} className="flex items-center gap-3">
                        <Checkbox
                            id={`cat-${category.id}`}
                            checked={selectedCategoryIds.has(category.id)}
                            onCheckedChange={(checked) => handleCheckboxChange(category.id, !!checked)}
                        />
                        <Label htmlFor={`cat-${category.id}`} className="font-normal cursor-pointer">
                            {category.name}
                        </Label>
                    </div>
                    ))
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">
                        No se encontraron categorías.
                    </p>
                )}
                </div>
            </ScrollArea>
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
