'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useFormState, useFormStatus } from 'react-dom';
import { forgotPassword } from '@/app/actions';
import { ForgotPasswordSchema } from '@/lib/schemas';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Enviar Enlace
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(forgotPassword, { message: '', success: false });
  
  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  return (
    <Form {...form}>
      {state.success ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>¡Enlace Enviado!</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : (
        <form action={formAction} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                   <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input {...field} placeholder="nombre@ejemplo.com" type="email" className="pl-10" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {state.message && !state.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <SubmitButton />
        </form>
      )}
    </Form>
  );
}
