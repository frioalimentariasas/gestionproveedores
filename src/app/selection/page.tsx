'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ClipboardCheck } from 'lucide-react';
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
        <div className="flex flex-col items-center gap-2 my-8">
            <div className="bg-primary/10 p-3 rounded-full mb-2">
                <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-center">
                Selección de Proveedores ISO 9001
            </h1>
            <p className="text-center text-muted-foreground max-w-2xl">
                Gestión de procesos de selección bajo el marco normativo ISO 9001:2015. 
                Asegure la transparencia, competencia técnica y cumplimiento legal en la elección de nuevos suministros y servicios.
            </p>
        </div>
        <SelectionEventsList />
      </div>
    </AuthGuard>
  );
}
