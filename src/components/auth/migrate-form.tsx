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
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { migrateUserToNitLogin } from '@/actions/user-management';

const migrateSchema = z.object({
  email: z.string().email('Por favor, ingresa un email válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

export function MigrateForm() {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof migrateSchema>>({
    resolver: zodResolver(migrateSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof migrateSchema>) {
    if (!auth) return;
    setIsSubmitting(true);
    try {
      // 1. Sign in with the old credentials
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      toast({
        title: 'Cuenta verificada',
        description: 'Actualizando tu método de inicio de sesión...',
      });

      // 2. Call the migration server action
      const migrationResult = await migrateUserToNitLogin(user.uid);

      if (!migrationResult.success) {
        throw new Error(migrationResult.error || 'No se pudo actualizar la cuenta.');
      }
      
      // 3. Sign out the user
      await signOut(auth);

      // 4. Show success and redirect
      toast({
        title: '¡Cuenta actualizada con éxito!',
        description: 'Ahora serás redirigido para iniciar sesión con tu NIT.',
        duration: 5000,
      });

      router.push('/auth/login');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error en la migración',
        description:
          error.code === 'auth/invalid-credential'
            ? 'Las credenciales son incorrectas.'
            : error.message || 'Ha ocurrido un error inesperado.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (actual)</FormLabel>
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
              <FormLabel>Contraseña (actual)</FormLabel>
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
            'Actualizar mi Cuenta'
          )}
        </Button>
      </form>
    </Form>
  );
}
