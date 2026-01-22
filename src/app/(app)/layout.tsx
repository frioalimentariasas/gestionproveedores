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


  useEffect(() => {
    console.log('[APP LAYOUT] useEffect: Verificando estado.', { loading, user: !!user });
    // Only check for redirection once the loading state is resolved.
    if (!loading && !user) {
      console.log("[APP LAYOUT] useEffect: CONDICIÓN CUMPLIDA (!loading && !user). Redirigiendo a /auth/login.");
      router.push('/auth/login');
    }
  }, [user, loading, router]);
  
  // Keep showing the loader while the auth state is being determined,
  // or if there's no user (because the redirection will happen shortly).
  if (loading || !user) {
    console.log('[APP LAYOUT] Render: Mostrando Loader porque loading es true o no hay usuario.', { loading, user: !!user });
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If we reach this point, it means loading is false and a user object exists.
  // We can safely render the dashboard layout.
  console.log('[APP LAYOUT] Render: Renderizando el dashboard principal.');
  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={user.role} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
        {children}
      </main>
    </div>
  );
}
