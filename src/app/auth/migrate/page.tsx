'use client';

import { MigrateForm } from '@/components/auth/migrate-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MigratePage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Actualizar Cuenta a Login con NIT
          </CardTitle>
          <CardDescription className="text-center pt-2">
            Para mejorar la seguridad, estamos actualizando el inicio de sesión. Por favor, ingresa con tu email y contraseña actuales para migrar tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MigrateForm />
        </CardContent>
      </Card>
    </div>
  );
}
