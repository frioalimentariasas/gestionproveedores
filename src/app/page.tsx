'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { isAdmin, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/providers/form');
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
          Dashboard Administrativo
        </h1>
        <p className="text-center text-muted-foreground">
          Bienvenido al panel de administración. Desde aquí podrás ver
          resúmenes de actividad y gestionar los proveedores.
        </p>
      </div>
    </AuthGuard>
  );
}
