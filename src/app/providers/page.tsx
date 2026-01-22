'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import ProvidersTable from '@/components/providers/providers-table';

export default function ProvidersPage() {
  const { isAdmin, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    // If done loading and the user is NOT an admin, redirect them.
    if (!isLoading && !isAdmin) {
      router.replace('/providers/form'); // Or to another appropriate page
    }
  }, [isAdmin, isLoading, router]);

  // Show a loader while checking the role
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not an admin, they will be redirected, so we can return null or a loader.
  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If the user is an admin, show the providers management page.
  return (
    <AuthGuard>
      <div className="container mx-auto p-4">
        <h1 className="my-8 text-center text-4xl font-bold tracking-tight">
          Gestión de Proveedores
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Administra la información y el estado de los proveedores registrados.
        </p>
        <ProvidersTable />
      </div>
    </AuthGuard>
  );
}
