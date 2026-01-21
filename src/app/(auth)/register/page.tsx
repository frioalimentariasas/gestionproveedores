import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-2xl my-8">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Logo className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="font-headline text-2xl font-bold">Registro de Proveedor</CardTitle>
        <CardDescription>Cree su cuenta para empezar a gestionar sus servicios.</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-sm text-muted-foreground">
          ¿Ya tiene una cuenta?{' '}
          <Link href="/login" passHref className="font-semibold text-primary hover:underline">
            Inicie Sesión
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
