'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { UpdateNameForm } from '@/components/account/update-name-form';
import { UpdatePasswordForm } from '@/components/account/update-password-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccountPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto max-w-2xl p-4 py-12">
        <h1 className="mb-8 text-center text-4xl font-black tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Configuración de mi Cuenta
        </h1>
        <div className="space-y-12">
          <Card>
            <CardHeader>
              <CardTitle>Nombre de Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <UpdateNameForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
            </CardHeader>
            <CardContent>
              <UpdatePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
