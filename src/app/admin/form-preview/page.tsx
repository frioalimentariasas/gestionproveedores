'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import ProviderForm from '@/components/providers/provider-form';

export default function AdminFormPreviewPage() {
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
      <div className="container mx-auto max-w-5xl p-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Modelo del Formulario de Registro
          </h1>
          <p className="text-muted-foreground mt-2">
            Vista de auditoría para validar campos, tipos de datos y lógica del formulario oficial FA-GFC-F04.
          </p>
        </div>
        <ProviderForm previewMode={true} />
      </div>
    </AuthGuard>
  );
}
