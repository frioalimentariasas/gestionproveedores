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
    // Cuando la verificación de rol termine y el usuario NO sea admin...
    if (!isLoading && !isAdmin) {
      // ...redirigir al formulario de proveedor.
      router.replace('/providers/form');
    }
    // Este efecto se ejecuta cada vez que 'isLoading' o 'isAdmin' cambian.
  }, [isAdmin, isLoading, router]);

  // 1. Mientras se verifica el rol del usuario, muestra un indicador de carga.
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Si la verificación terminó y el usuario es un administrador, muestra el Dashboard.
  if (isAdmin) {
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

  // 3. Si la verificación terminó y el usuario NO es admin, muestra un loader
  // mientras el `useEffect` de arriba realiza la redirección.
  // Esto previene que un no-admin vea el dashboard por un instante.
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
