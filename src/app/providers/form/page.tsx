'use client';

import AuthGuard from '@/components/auth/auth-guard';
import ProviderForm from '@/components/providers/provider-form';

export default function ProviderFormPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto max-w-5xl p-4 py-12">
        <div className="flex justify-between items-start mb-8 gap-4">
          <div className="flex-grow text-center mt-2">
            <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase">
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
          <p className="text-muted-foreground text-lg text-center">
            Complete o actualice su información para mantener sus datos al día bajo los estándares ISO 9001.
          </p>
        </div>
        <ProviderForm />
      </div>
    </AuthGuard>
  );
}
