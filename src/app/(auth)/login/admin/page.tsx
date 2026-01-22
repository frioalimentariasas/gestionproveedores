import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export default function AdminLoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Logo className="w-48" />
        </div>
        <CardTitle className="font-headline text-2xl font-bold">Portal de Administración</CardTitle>
        <CardDescription>Ingrese sus credenciales de administrador.</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminLoginForm />
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-sm">
          <Link href="/" passHref className="font-semibold text-primary hover:underline">
            Volver a la selección de portal
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
