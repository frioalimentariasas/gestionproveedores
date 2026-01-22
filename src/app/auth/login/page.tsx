import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Logo className="w-48" />
        </div>
        <CardTitle className="font-headline text-2xl font-bold">Portal de Proveedores</CardTitle>
        <CardDescription>Bienvenido. Ingrese sus credenciales de proveedor.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="flex-col items-center justify-center gap-4">
        <div className="text-sm">
          <Link href="/auth/forgot-password" passHref className="text-primary hover:underline">
            ¿Olvidó su contraseña?
          </Link>
        </div>
        <div className="text-sm text-muted-foreground">
          ¿No tiene una cuenta?{' '}
          <Link href="/auth/register" passHref className="font-semibold text-primary hover:underline">
            Regístrese
          </Link>
        </div>
        <div className="mt-4 w-full text-center text-sm">
          <Link href="/auth" passHref className="font-semibold text-primary hover:underline">
            Volver a la selección de portal
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
