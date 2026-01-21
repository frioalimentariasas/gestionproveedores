import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Logo className="w-48" />
        </div>
        <CardTitle className="font-headline text-2xl font-bold">Recuperar Contraseña</CardTitle>
        <CardDescription>Ingrese su correo para enviarle un enlace de recuperación.</CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-sm">
          <Link href="/login" passHref className="font-semibold text-primary hover:underline">
            Volver a Iniciar Sesión
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
