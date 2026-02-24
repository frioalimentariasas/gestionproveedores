'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import CategoriesTable from '@/components/categories/categories-table';

export default function CategoriesPage() {
  const { isAdmin, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-4">
        <h1 className="my-8 text-center text-4xl font-black tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Gestión de Categorías
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Crea y administra las categorías para clasificar a los proveedores de Frioalimentaria.
        </p>
        <CategoriesTable />
      </div>
    </AuthGuard>
  );
}
