import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Building, UserCog } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building className="h-8 w-8" />
            </div>
            <CardTitle>Portal de Proveedores</CardTitle>
            <CardDescription>Acceda para gestionar sus servicios y perfil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'w-full')}>
              Ingresar como Proveedor
            </Link>
          </CardContent>
        </Card>
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
                <UserCog className="h-8 w-8" />
            </div>
            <CardTitle>Portal de Administración</CardTitle>
            <CardDescription>Acceda para gestionar la plataforma y los proveedores.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login/admin" className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'w-full')}>
              Ingresar como Administrador
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
