'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
    const { user } = useAuth();

    // The layout component now fully handles the loading and redirection logic.
    // If this component renders, we can safely assume `user` is available.
    // We add a fallback just in case to prevent rendering errors, but it should not be reached.
    if (!user) {
        return null; 
    }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">¡Bienvenido, {user.name || user.email}!</CardTitle>
          <CardDescription>Ha accedido a la plataforma de gestión de proveedores.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Esta es su página principal. Desde aquí podrá gestionar su información y servicios.</p>
        </CardContent>
      </Card>
    </div>
  );
}
