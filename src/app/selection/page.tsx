'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import SelectionEventsList from '@/components/selection/selection-events-list';

export default function SelectionPage() {
  const { isAdmin, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-4">
        <h1 className="my-8 text-center text-4xl font-bold tracking-tight">
          Selección de Proveedores
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Crea y gestiona procesos de selección para comparar y elegir al mejor proveedor para cada necesidad.
        </p>
        <SelectionEventsList />
      </div>
    </AuthGuard>
  );
}

    