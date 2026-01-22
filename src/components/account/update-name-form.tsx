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
import { updateNameSchema } from '@/lib/schemas';
import { useAuth, useUser } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function UpdateNameForm() {
  const { toast } = useToast();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof updateNameSchema>>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
    values: {
      displayName: user?.displayName || '',
    },
  });

  async function onSubmit(values: z.infer<typeof updateNameSchema>) {
    if (!auth?.currentUser) return;
    setIsSubmitting(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: values.displayName,
      });
      toast({
        title: '¡Éxito!',
        description: 'Tu nombre ha sido actualizado.',
      });
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar el nombre',
        description: 'Ha ocurrido un error inesperado.',
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
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de Usuario</FormLabel>
              <FormControl>
                <Input placeholder="Tu nombre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Guardar Cambios'
          )}
        </Button>
      </form>
    </Form>
  );
}
