'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserData } from '@/hooks/use-user-data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const { userData, loading } = useUserData();

    if (loading || !userData) {
        return (
             <div className="flex flex-col gap-4">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    const isPending = userData.role === 'provider' && userData.status === 'pending';
    const isRejected = userData.role === 'provider' && userData.status === 'rejected';

  return (
    <div className="flex flex-col gap-4">
        {(isPending || isRejected) && (
            <Alert variant={isRejected ? 'destructive' : 'default'}>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>
                    {isPending ? '¡Cuenta pendiente de aprobación!' : '¡Cuenta Rechazada!'}
                </AlertTitle>
                <AlertDescription>
                    {isPending
                        ? 'Su registro ha sido recibido. Un administrador lo revisará pronto. Recibirá una notificación por correo electrónico una vez que su cuenta sea aprobada.'
                        : 'Su cuenta ha sido rechazada. Por favor, póngase en contacto con el soporte para más información.'
                    }
                </AlertDescription>
            </Alert>
        )}

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">¡Bienvenido, {userData.companyName || userData.name}!</CardTitle>
          <CardDescription>Ha accedido a la plataforma de gestión de proveedores.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Esta es su página principal. Desde aquí podrá gestionar su información y servicios.</p>
        </CardContent>
      </Card>
    </div>
  );
}
