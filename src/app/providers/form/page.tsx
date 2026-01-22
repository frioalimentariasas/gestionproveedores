'use client';

import AuthGuard from '@/components/auth/auth-guard';
import ProviderForm from '@/components/providers/provider-form';

export default function ProviderFormPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto max-w-5xl p-4 py-12">
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            Portal de Proveedores
          </h1>
          <p className="text-muted-foreground text-lg">
            Completa o actualiza tu información para mantener tus datos al día.
            Todos los campos son importantes para nuestra gestión.
          </p>
        </div>
        <ProviderForm />
      </div>
    </AuthGuard>
  );
}
