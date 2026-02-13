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
import { useToast } from '@/hooks/use-toast';
import { selectionEventSchema } from '@/lib/schemas';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Input } from '../ui/input';

export default function CreateSelectionForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof selectionEventSchema>>({
    resolver: zodResolver(selectionEventSchema),
    defaultValues: {
      name: '',
      type: 'Bienes',
    },
  });

  async function onSubmit(values: z.infer<typeof selectionEventSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const newEventRef = await addDoc(
        collection(firestore, 'selection_events'),
        {
          ...values,
          status: 'Abierto',
          createdAt: serverTimestamp(),
        }
      );

      const competitorName = searchParams.get('name');
      const competitorNit = searchParams.get('nit');
      const competitorEmail = searchParams.get('email');

      let redirectUrl = `/selection/${newEventRef.id}`;
      if (competitorName && competitorNit && competitorEmail) {
        const query = new URLSearchParams({
          name: competitorName,
          nit: competitorNit,
          email: competitorEmail,
        }).toString();
        redirectUrl += `?${query}`;
      }

      toast({
        title: 'Proceso Creado',
        description: 'Ahora puedes añadir criterios y competidores.',
      });

      router.push(redirectUrl);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error al crear el proceso',
        description: 'No se pudo guardar el nuevo proceso de selección.',
      });
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Definir el Proceso</CardTitle>
        <CardDescription>
          Dale un nombre a este proceso de selección y define qué tipo de
          adquisición es.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Proceso de Selección</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Compra de papelería para oficina"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Adquisición</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Bienes" />
                        </FormControl>
                        <FormLabel className="font-normal">Bienes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Servicios (Contratista)" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Servicios (Contratista)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Siguiente: Definir Criterios'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}