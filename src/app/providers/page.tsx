'use client';

import AuthGuard from '@/components/auth/auth-guard';

export default function ProvidersPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto p-4">
        <h1 className="my-8 text-center text-4xl font-bold tracking-tight">
          Gestión de Proveedores
        </h1>
        <p className="text-muted-foreground">
          Aquí se podrá crear, ver, editar y eliminar proveedores.
        </p>
      </div>
    </AuthGuard>
  );
}
