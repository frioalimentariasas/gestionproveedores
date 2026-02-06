'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  WithId,
} from '@/firebase';
import { collection } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComparisonView } from '@/components/comparison/comparison-view';

interface Category {
  id: string;
  name: string;
}

export default function ComparisonPage() {
  const { isAdmin, isLoading: isRoleLoading } = useRole();
  const router = useRouter();
  const firestore = useFirestore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const categoriesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'categories') : null),
    [firestore]
  );
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useCollection<Category>(categoriesCollectionRef);

  useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isRoleLoading, router]);

  const isLoading = isRoleLoading || isCategoriesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-4">
        <div className="my-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Comparador de Proveedores
          </h1>
          <p className="text-muted-foreground mt-2">
            Selecciona una categoría para comparar proveedores y sus
            evaluaciones.
          </p>
        </div>

        <div className="mx-auto max-w-md mb-8">
          <Select
            onValueChange={(value) => setSelectedCategoryId(value)}
            disabled={isCategoriesLoading || !categories}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría..." />
            </SelectTrigger>
            <SelectContent>
              {isCategoriesLoading ? (
                <div className="p-4 text-center">Cargando categorías...</div>
              ) : categoriesError ? (
                <div className="p-4 text-center text-destructive">
                  Error al cargar categorías.
                </div>
              ) : (
                categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedCategoryId && <ComparisonView categoryId={selectedCategoryId} />}
      </div>
    </AuthGuard>
  );
}
