import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoutButton } from '@/components/auth/logout-button';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">¡Bienvenido!</CardTitle>
          <CardDescription>Ha accedido a la plataforma de gestión de proveedores.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Esta es su página principal. Desde aquí podrá gestionar su información y servicios.</p>
          <div className="mt-4 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            <p><strong>Nota:</strong> Esta es una página de demostración. Las funcionalidades completas del dashboard se implementarán en futuras versiones.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <LogoutButton />
        </CardFooter>
      </Card>
    </div>
  );
}
