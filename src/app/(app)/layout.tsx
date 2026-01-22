'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Este efecto se ejecutará cada vez que cambie el estado de carga o de usuario.
    if (!loading && !user) {
      // Si la carga ha finalizado y no hay usuario, redirige al login.
      router.push('/auth/login');
    }
  }, [user, loading, router]);
  
  // Mientras se carga, o si aún no hay usuario (antes de que el efecto de redirección se ejecute),
  // muestra un cargador a pantalla completa. Esto evita parpadeos de contenido.
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Si llegamos aquí, significa que la carga ha terminado y existe un usuario.
  // Podemos renderizar de forma segura el layout del dashboard.
  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={user.role} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
        {children}
      </main>
    </div>
  );
}
