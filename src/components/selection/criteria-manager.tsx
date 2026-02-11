'use client';

import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { useEffect } from 'react';
import { Progress } from '../ui/progress';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import type { Criterion } from './manage-selection-event';
import { criteriaListSchema, criterionSchema } from '@/lib/schemas';
import type { z } from 'zod';

interface CriteriaManagerProps {
  criteria: Criterion[];
  onSave: (criteria: Criterion[]) => void;
  isLocked: boolean;
}

type CriteriaFormValues = z.infer<typeof criteriaListSchema>;

export function CriteriaManager({
  criteria,
  onSave,
  isLocked,
}: CriteriaManagerProps) {
  const form = useForm<CriteriaFormValues>({
    resolver: zodResolver(criteriaListSchema),
    defaultValues: {
      criteria: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'criteria',
  });

  useEffect(() => {
    form.reset({ criteria: criteria.length > 0 ? criteria : [] });
  }, [criteria, form]);

  const watchedCriteria = useWatch({
    control: form.control,
    name: 'criteria',
  });

  const totalWeight = watchedCriteria.reduce(
    (sum, item) => sum + (Number(item.weight) || 0),
    0
  );

  const onSubmit = (data: CriteriaFormValues) => {
    const criteriaWithIds = data.criteria.map((c) => ({
      ...c,
      id: c.id || crypto.randomUUID(),
    }));
    onSave(criteriaWithIds);
  };

  if (isLocked && criteria.length === 0) {
     return <p className="text-center text-sm text-muted-foreground">No se definieron criterios para este proceso cerrado.</p>;
  }

  if (isLocked) {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold">Criterios Utilizados</h3>
            <ul className="space-y-2">
                {criteria.map(c => (
                    <li key={c.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                        <span>{c.label}</span>
                        <span className="font-bold">{c.weight}%</span>
                    </li>
                ))}
            </ul>
             <div className="flex items-center gap-4 pt-2">
                <span className="text-sm font-bold">Total:</span>
                <Progress value={totalWeight} className="flex-1" />
                <span className="text-sm font-bold">{totalWeight}%</span>
            </div>
        </div>
    );
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {form.formState.errors.criteria && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Error en los Pesos</AlertTitle>
                <AlertDescription>{form.formState.errors.criteria.root?.message}</AlertDescription>
            </Alert>
        )}
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start gap-2"
            >
              <FormField
                control={form.control}
                name={`criteria.${index}.label`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">Criterio</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del criterio" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`criteria.${index}.weight`}
                render={({ field }) => (
                  <FormItem className="w-24">
                     <FormLabel className="sr-only">Peso</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Peso %" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="mt-1"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => append({ id: crypto.randomUUID(), label: '', weight: 10 })}
          className="w-full"
        >
          <PlusCircle className="mr-2" />
          Añadir Criterio
        </Button>
        
        <div className="space-y-2">
            <FormDescription>La suma de los pesos de todos los criterios debe ser 100%.</FormDescription>
            <div className="flex items-center gap-4">
                <span className="text-sm font-bold">Total:</span>
                <Progress value={totalWeight} className="flex-1" />
                <span className="text-sm font-bold">{totalWeight}%</span>
            </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            <Save className="mr-2" />
            Guardar Criterios
          </Button>
        </div>
      </form>
    </Form>
  );
}
