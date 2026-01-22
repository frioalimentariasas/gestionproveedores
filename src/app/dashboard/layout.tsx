'use client';

import { useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/use-user-data';
import { Sidebar } from '@/components/layout/sidebar';
import { ReactNode, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { userData, loading, user } = useUserData();
  const router = useRouter();

  useEffect(() => {
    // Solo tomar una decisión de redirección cuando la carga haya finalizado.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // 1. Mostrar siempre el esqueleto de carga mientras el hook `useUserData` está trabajando.
  if (loading) {
    return (
        <div className="flex min-h-screen w-full">
            <div className="hidden md:flex flex-col w-64 border-r p-4 gap-4 bg-background">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                 <Skeleton className="h-8 w-full mt-auto" />
            </div>
            <div className="flex-1 p-8 bg-muted/40">
                <Skeleton className="h-48 w-full" />
            </div>
      </div>
    );
  }
  
  // 2. Si la carga terminó pero no hay datos de usuario, el useEffect se encargará de la redirección.
  //    Mientras tanto, mostramos el esqueleto para evitar un parpadeo de contenido o errores.
  if (!userData) {
     return (
        <div className="flex min-h-screen w-full">
            <div className="hidden md:flex flex-col w-64 border-r p-4 gap-4 bg-background">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                 <Skeleton className="h-8 w-full mt-auto" />
            </div>
            <div className="flex-1 p-8 bg-muted/40">
                <Skeleton className="h-48 w-full" />
            </div>
      </div>
    );
  }


  // 3. Si la carga ha finalizado y tenemos datos del usuario, mostramos el dashboard.
  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={userData.role} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
        {children}
      </main>
    </div>
  );
}
