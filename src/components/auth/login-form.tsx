'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { loginSchema } from '@/lib/schemas';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { notifyAdminOfReactivationRequest } from '@/actions/email';
import { getProviderDataByNit } from '@/actions/user-management';

export function LoginForm() {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showDisabledDialog, setShowDisabledDialog] = useState(false);
  const [attemptedNit, setAttemptedNit] = useState('');

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    if (!auth) return;
    setIsSubmitting(true);
    try {
      let loginEmail: string;
      const isEmail = values.identifier.includes('@');

      if (isEmail) {
        // User is logging in with an email (likely an admin)
        loginEmail = values.identifier;
      } else {
        // User is logging in with a NIT, create the synthetic email
        loginEmail = `${values.identifier}@proveedores.frioalimentaria.com.co`;
      }
      
      await signInWithEmailAndPassword(auth, loginEmail, values.password);

      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión correctamente.',
      });
      router.push('/');
    } catch (error: any) {
      const isEmail = values.identifier.includes('@');
      if (error.code === 'auth/user-disabled' && !isEmail) {
        setAttemptedNit(values.identifier);
        setShowDisabledDialog(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error al iniciar sesión',
          description:
            error.code === 'auth/invalid-credential'
              ? 'Las credenciales son incorrectas.'
              : 'Ha ocurrido un error inesperado.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReactivationRequest = async () => {
    if (!attemptedNit) return;

    setIsReactivating(true);

    const providerDataResult = await getProviderDataByNit(attemptedNit);

    if (!providerDataResult.success || !providerDataResult.data?.businessName || !providerDataResult.data?.email) {
      toast({
        variant: 'destructive',
        title: 'Error al obtener datos',
        description: 'No se pudo encontrar la información de su empresa para la solicitud.',
      });
      setIsReactivating(false);
      setShowDisabledDialog(false);
      return;
    }

    const { businessName, email } = providerDataResult.data;
    
    const result = await notifyAdminOfReactivationRequest({ providerEmail: email, businessName });
    
    setShowDisabledDialog(false);
    setIsReactivating(false);

    if (result.success) {
      toast({
        title: 'Solicitud Enviada',
        description: 'Se ha notificado al administrador para que revise tu cuenta.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al enviar la solicitud',
        description: result.error || 'No se pudo enviar la solicitud. Por favor, intenta de nuevo más tarde o contacta a soporte.',
      });
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIT o Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Tu NIT o tu Email"
                    {...field}
                    type="text"
                    autoComplete="username"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input
                    placeholder="********"
                    {...field}
                    type="password"
                    autoComplete="current-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Ingresar'
            )}
          </Button>

          <div className="text-center text-sm">
            ¿No tienes una cuenta?{' '}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/auth/register">Regístrate como proveedor</Link>
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
             <Button variant="link" asChild className="p-0 h-auto text-muted-foreground">
              <Link href="/auth/migrate">¿Usuario antiguo? Actualiza tu cuenta aquí</Link>
            </Button>
          </div>
        </form>
      </Form>
      
      <AlertDialog open={showDisabledDialog} onOpenChange={setShowDisabledDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cuenta Deshabilitada</AlertDialogTitle>
            <AlertDialogDescription>
              Tu cuenta ha sido deshabilitada por un administrador. Si crees que esto es un error, puedes solicitar que se reactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReactivationRequest} disabled={isReactivating}>
              {isReactivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Solicitar Activación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
