'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
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
  const { isAdmin, isLoading } = useRole();
  const router = useRouter();
  const firestore = useFirestore();
  const [selectedCategory, setSelectedCategory] = useState('');

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'categories') : null),
    [firestore]
  );
  const { data: categories, isLoading: isLoadingCategories } =
    useCollection<Category>(categoriesQuery);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || isLoadingCategories) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAdmin) {
    // Should be handled by the useEffect redirect, but as a fallback.
    return (
       <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-center mb-2">
          Comparador de Desempeño
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Selecciona una categoría para comparar el desempeño de los proveedores.
        </p>

        <div className="max-w-md mx-auto mb-12">
          <Select onValueChange={setSelectedCategory} value={selectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría..." />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategory ? (
          <ComparisonView categoryId={selectedCategory} />
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold">
              Selecciona una categoría para comenzar
            </h3>
            <p className="text-muted-foreground mt-2">
              Los resultados de la comparación se mostrarán aquí.
            </p>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
