'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log('[APP LAYOUT] Render: Estado recibido de useAuth ->', { loading, user: user ? { uid: user.uid, email: user.email } : null });

  // The redirection logic MUST be in a `useEffect` to prevent rendering errors.
  useEffect(() => {
    // This effect runs when `loading` or `user` change.
    if (!loading && !user) {
      console.log("[APP LAYOUT] useEffect: CONDICIÓN CUMPLIDA (!loading && !user). Redirigiendo a /auth/login.");
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  // While loading, or if there is no user (and we are about to redirect),
  // we must show a loader. This prevents a flash of protected content and
  // ensures we don't try to render content that depends on a non-existent user.
  if (loading || !user) {
    console.log('[APP LAYOUT] Render: Mostrando Loader porque `loading` es true o no hay usuario.');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If we reach this point, `loading` is false and `user` exists. It's safe to render.
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
