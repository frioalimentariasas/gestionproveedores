'use client';

import AuthGuard from '@/components/auth/auth-guard';
import ProviderForm from '@/components/providers/provider-form';

export default function ProviderFormPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto max-w-5xl p-4 py-12">
        <div className="flex justify-between items-start mb-8 gap-4">
          <div className="flex-grow text-center mt-2">
            <h1 className="text-xl font-bold tracking-tight uppercase">
              REGISTRO O ACTUALIZACION DE PROVEEDORES Y/O
              <br />
              CONTRATISTAS
            </h1>
          </div>
          <div className="border border-foreground text-xs w-48 flex-shrink-0">
            <div className="border-b border-foreground p-1 px-2">
              <p>
                <span className="font-bold">Codigo:</span> FA-GFC-F04
              </p>
            </div>
            <div className="border-b border-foreground p-1 px-2">
              <p>
                <span className="font-bold">Version:</span> 3
              </p>
            </div>
            <div className="p-1 px-2">
              <p>
                <span className="font-bold">Vigencia:</span> 12/06/2025
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4 mb-12">
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
