import { AdminRegisterForm } from '@/components/auth/admin-register-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export default function AdminRegisterPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Logo className="w-48" />
        </div>
        <CardTitle className="font-headline text-2xl font-bold">Registro de Administrador</CardTitle>
        <CardDescription>Cree una cuenta de administrador.</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminRegisterForm />
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-sm text-muted-foreground">
          ¿Ya tiene una cuenta?{' '}
          <Link href="/login/admin" passHref className="font-semibold text-primary hover:underline">
            Inicie Sesión
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
