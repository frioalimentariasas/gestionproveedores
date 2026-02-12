'use client';

import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] items-center justify-center p-4 gap-8">
      <h1 className="text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Gestión de Proveedores
      </h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Registro de Proveedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <RegisterForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
