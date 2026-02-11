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
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { Progress } from '../ui/progress';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import type { Criterion } from './manage-selection-event';
import { criteriaListSchema } from '@/lib/schemas';
import type { z } from 'zod';

interface CriteriaManagerProps {
  criteria: Criterion[];
  onSave: (criteria: Criterion[]) => void;
  isLocked: boolean;
}

type CriteriaFormValues = z.infer<typeof criteriaListSchema>;

const PREDEFINED_CRITERIA: Omit<Criterion, 'weight'>[] = [
    { id: 'calidad', label: 'Calidad del producto' },
    { id: 'precio', label: 'Precio' },
    { id: 'tiempo_entrega', label: 'Tiempo de entrega' },
    { id: 'condiciones_pago', label: 'Condiciones de pago' },
    { id: 'reputacion', label: 'Reputación/referencias' },
    { id: 'soporte', label: 'Soporte y servicio Post venta' },
];


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
    mode: 'onChange',
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'criteria',
  });

  useEffect(() => {
    const hasSavedCriteria = criteria && criteria.length > 0;
    
    let formData;

    if (hasSavedCriteria) {
        formData = PREDEFINED_CRITERIA.map(predef => {
            const saved = criteria.find(c => c.id === predef.id);
            return {
                ...predef,
                weight: saved ? saved.weight : 0,
            };
        });
    } else {
        formData = [
            { id: 'calidad', label: 'Calidad del producto', weight: 20 },
            { id: 'precio', label: 'Precio', weight: 20 },
            { id: 'tiempo_entrega', label: 'Tiempo de entrega', weight: 15 },
            { id: 'condiciones_pago', label: 'Condiciones de pago', weight: 15 },
            { id: 'reputacion', label: 'Reputación/referencias', weight: 15 },
            { id: 'soporte', label: 'Soporte y servicio Post venta', weight: 15 },
        ];
    }
    
    const total = formData.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
    if (total !== 100) {
        const diff = 100 - total;
        const lastItem = formData[formData.length - 1];
        if (lastItem) {
          lastItem.weight = (lastItem.weight || 0) + diff;
        }
    }

    form.reset({ criteria: formData });

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
    onSave(data.criteria);
  };

  if (isLocked) {
     return (
        <div className="space-y-4">
            <h3 className="font-semibold">Criterios Utilizados</h3>
            {(!criteria || criteria.length === 0) ? (
                <p className="text-center text-sm text-muted-foreground">No se definieron criterios para este proceso cerrado.</p>
            ) : (
                <>
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
                    <Progress value={criteria.reduce((s, c) => s + c.weight, 0)} className="flex-1" />
                    <span className="text-sm font-bold">{criteria.reduce((s, c) => s + c.weight, 0)}%</span>
                </div>
                </>
            )}
        </div>
    );
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {form.formState.errors.criteria?.root && (
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
              className="flex items-center gap-4"
            >
              <FormLabel className="flex-1 pt-2">{field.label}</FormLabel>
              <FormField
                control={form.control}
                name={`criteria.${index}.weight`}
                render={({ field }) => (
                  <FormItem className="w-32">
                     <FormLabel className="sr-only">Peso % para {field.name}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Peso %" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
            <FormDescription>La suma de los pesos de todos los criterios debe ser 100%.</FormDescription>
            <div className="flex items-center gap-4">
                <span className="text-sm font-bold">Total:</span>
                <Progress value={totalWeight} className="flex-1" />
                <span className={`text-sm font-bold ${totalWeight !== 100 ? 'text-destructive' : ''}`}>{totalWeight}%</span>
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
