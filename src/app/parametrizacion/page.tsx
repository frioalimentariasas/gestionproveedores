
'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { CriteriaManager } from '@/components/parametrizacion/criteria-manager';

export default function ParametrizacionPage() {
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
      <div className="container mx-auto p-4 py-12">
        <h1 className="my-8 text-center text-4xl font-bold tracking-tight">
          Parametrización de Criterios de Evaluación
        </h1>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Selecciona una categoría y ajusta el peso porcentual de cada criterio para las evaluaciones de desempeño. La suma total debe ser siempre 100%.
        </p>
        <CriteriaManager />
      </div>
    </AuthGuard>
  );
}
