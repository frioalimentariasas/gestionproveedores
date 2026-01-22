'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const { isAdmin, isLoading: isRoleLoading } = useRole();
  const router = useRouter();

  // Combine loading states for clarity. We are loading if the user state is loading,
  // or if the user is loaded but we are still checking their role.
  const isLoading = isUserLoading || (user && isRoleLoading);

  useEffect(() => {
    // Only perform actions once all loading is complete.
    if (!isLoading) {
      // If we have a user and they are confirmed NOT to be an admin, redirect.
      if (user && !isAdmin) {
        router.replace('/providers/form');
      }
      // If the user is an admin, the component will render the admin dashboard below.
      // If there is no user, the AuthGuard inside the admin view will handle it,
      // but typically they'd be on the login page anyway.
    }
  }, [user, isAdmin, isLoading, router]);

  // Show a loader while user and role are being determined.
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is done and the user is an admin, render the dashboard.
  if (user && isAdmin) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4">
          <h1 className="my-8 text-center text-4xl font-bold tracking-tight">
            Dashboard Administrativo
          </h1>
          <p className="text-center text-muted-foreground">
            Bienvenido al panel de administración. Desde aquí podrás ver
            resúmenes de actividad y gestionar los proveedores.
          </p>
        </div>
      </AuthGuard>
    );
  }

  // If loading is done but the conditions above aren't met (e.g., non-admin user),
  // a redirect is likely in progress via the useEffect. Show a loader to prevent
  // a blank screen or flash of incorrect content.
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
