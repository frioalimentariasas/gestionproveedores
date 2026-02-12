'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { selectionEventSchema } from '@/lib/schemas';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2, ChevronsUpDown, Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface ProcessName {
  id: string;
  name: string;
}

export default function CreateSelectionForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const form = useForm<z.infer<typeof selectionEventSchema>>({
    resolver: zodResolver(selectionEventSchema),
    defaultValues: {
      name: '',
      type: 'Bienes',
    },
  });

  const processNamesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'selection_process_names') : null),
    [firestore]
  );
  const { data: processNames, isLoading: isLoadingNames } =
    useCollection<ProcessName>(processNamesQuery);

  async function onSubmit(values: z.infer<typeof selectionEventSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      // Check if the name exists and save it if it's new
      const isNewName =
        values.name &&
        !processNames?.some(
          (pn) => pn.name.toLowerCase() === values.name.toLowerCase()
        );
      if (isNewName) {
        await addDoc(collection(firestore, 'selection_process_names'), {
          name: values.name,
        });
      }

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
                <FormItem className="flex flex-col">
                  <FormLabel>Nombre del Proceso de Selección</FormLabel>
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? field.value
                            : 'Selecciona o crea un nombre'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full p-0"
                      style={{ width: 'var(--radix-popover-trigger-width)' }}
                    >
                      <Command>
                        <CommandInput
                          placeholder="Busca o crea un nombre..."
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        />
                        <CommandList>
                          <CommandEmpty>
                            No se encontraron nombres. Pulsa "Enter" para crear uno nuevo.
                          </CommandEmpty>
                          <CommandGroup>
                            {processNames?.map((proc) => (
                              <CommandItem
                                value={proc.name}
                                key={proc.id}
                                onSelect={() => {
                                  form.setValue('name', proc.name);
                                  setIsPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === proc.name
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {proc.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Selecciona un nombre existente o escribe uno nuevo para
                    guardarlo para el futuro.
                  </FormDescription>
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
