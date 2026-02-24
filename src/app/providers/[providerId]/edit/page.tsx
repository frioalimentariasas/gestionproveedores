
'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import ProviderForm from '@/components/providers/provider-form';
import { Button } from '@/components/ui/button';

export default function AdminProviderEditPage() {
  const { isAdmin, isLoading } = useRole();
  const router = useRouter();
  const params = useParams();
  const providerId = params.providerId as string;

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
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Corrección Administrativa
            </h1>
            <p className="text-muted-foreground mt-1">
              Modificando información oficial del proveedor para corrección de errores de digitación.
            </p>
          </div>
        </div>
        <ProviderForm providerId={providerId} adminMode={true} />
      </div>
    </AuthGuard>
  );
}
