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
import { updatePasswordSchema } from '@/lib/schemas';
import { useAuth } from '@/firebase';
import { updatePassword } from 'firebase/auth';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function UpdatePasswordForm() {
  const { toast } = useToast();
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof updatePasswordSchema>) {
    if (!auth?.currentUser) return;
    setIsSubmitting(true);
    try {
      await updatePassword(auth.currentUser, values.newPassword);
      toast({
        title: '¡Contraseña actualizada!',
        description: 'Tu contraseña ha sido cambiada exitosamente.',
      });
      form.reset();
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast({
          variant: 'destructive',
          title: 'Error de seguridad',
          description:
            'Esta operación es sensible. Por favor, cierra sesión y vuelve a iniciarla para cambiar tu contraseña.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error al cambiar la contraseña',
          description: 'Ha ocurrido un error inesperado.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva Contraseña</FormLabel>
              <FormControl>
                <Input placeholder="********" {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Nueva Contraseña</FormLabel>
              <FormControl>
                <Input placeholder="********" {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Cambiar Contraseña'
          )}
        </Button>
      </form>
    </Form>
  );
}
