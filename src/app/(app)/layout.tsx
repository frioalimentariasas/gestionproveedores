'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log('[APP LAYOUT] Render: Estado recibido de useAuth ->', { loading, user: user ? { uid: user.uid, email: user.email } : null });

  // 1. Si estamos en proceso de verificación, SIEMPRE mostramos el loader.
  //    Esto es crucial para esperar a que Firebase inicialice.
  if (loading) {
    console.log('[APP LAYOUT] Render: Mostrando Loader porque `loading` es true.');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Si la carga ha terminado y NO hay usuario, redirigimos.
  if (!user) {
    console.log("[APP LAYOUT] Render: CONDICIÓN CUMPLIDA (!user). Redirigiendo a /auth/login.");
    router.push('/auth/login');
    // Es importante mostrar un loader o null para evitar que el contenido anterior
    // se muestre brevemente durante la redirección.
    return (
        <div className="flex h-screen w-full items-center justify-center bg-muted/40">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  // 3. Si llegamos aquí, `loading` es false y `user` existe. Es seguro renderizar.
  console.log('[APP LAYOUT] Render: Renderizando el dashboard principal porque hay un usuario.');
  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={user.role} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
        {children}
      </main>
    </div>
  );
}
