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

export function LoginForm() {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showDisabledDialog, setShowDisabledDialog] = useState(false);
  const [attemptedEmail, setAttemptedEmail] = useState('');

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    if (!auth) return;
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión correctamente.',
      });
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/user-disabled') {
        setAttemptedEmail(values.email);
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
    if (!attemptedEmail) return;

    setIsReactivating(true);
    const result = await notifyAdminOfReactivationRequest({ providerEmail: attemptedEmail });
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="tu@email.com"
                    {...field}
                    type="email"
                    autoComplete="email"
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