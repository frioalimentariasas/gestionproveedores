'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { inviteProviderSchema } from '@/lib/schemas';
import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { sendDirectInvitation } from '@/actions/email';

interface InviteProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type InviteFormValues = z.infer<typeof inviteProviderSchema>;

export function InviteProviderModal({ isOpen, onClose }: InviteProviderModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteProviderSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  async function onSubmit(values: InviteFormValues) {
    setIsSubmitting(true);
    try {
      const result = await sendDirectInvitation({
        providerName: values.name,
        providerEmail: values.email,
      });

      if (result.success) {
        toast({
          title: 'Invitación Enviada',
          description: `Se ha enviado el correo de registro a ${values.name}.`,
        });
        form.reset();
        onClose();
      } else {
        throw new Error(result.error || 'Error al enviar el correo.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al enviar invitación',
        description: error.message || 'No se pudo enviar el correo en este momento.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invitar Nuevo Proveedor</DialogTitle>
          <DialogDescription>
            Envía una invitación directa para que el proveedor se registre en la plataforma de Frioalimentaria.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Proveedor / Razón Social</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Distribuciones ABC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="correo@proveedor.com" {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Enviar Invitación
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
