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
    // Si la carga ha finalizado y no hay usuario, redirigir al login.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Mientras se carga el estado de autenticación, o si el usuario no tiene datos (aún),
  // mostrar un esqueleto de carga. Esto previene redirecciones prematuras.
  if (loading || !userData) {
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

  // Si la carga ha finalizado y tenemos tanto el usuario como sus datos, mostrar el dashboard.
  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={userData.role} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
        {children}
      </main>
    </div>
  );
}
