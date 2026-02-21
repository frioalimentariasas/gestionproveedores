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
import { Save, Scale } from 'lucide-react';
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
    // 1. CAPACIDAD LEGAL (20%)
    { id: 'legal_camara', label: 'Cámara de Comercio vigente (Verificación: Documento actualizado)' },
    { id: 'legal_rut', label: 'RUT actualizado (Verificación: Documento)' },
    { id: 'legal_seguridad_social', label: 'Pago seguridad social (si aplica) (Verificación: Planilla PILA)' },
    { id: 'legal_sgsst', label: 'Certificación SG-SST (Verificación: Soporte vigente)' },
    // Resto pendiente
    { id: 'otros_pendientes', label: 'Otros Criterios (Pendientes por definir)' },
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
        // Map saved criteria but ensure predefined ones are there if they don't exist yet
        formData = PREDEFINED_CRITERIA.map(predef => {
            const saved = criteria.find(c => c.id === predef.id);
            return {
                ...predef,
                weight: saved ? saved.weight : 0,
            };
        });
        
        // Add any extra criteria that might have been added manually before
        criteria.forEach(c => {
            if (!PREDEFINED_CRITERIA.find(p => p.id === c.id)) {
                formData.push(c);
            }
        });
    } else {
        // Initial setup based on request
        formData = [
            { id: 'legal_camara', label: 'Cámara de Comercio vigente (Verificación: Documento actualizado)', weight: 5 },
            { id: 'legal_rut', label: 'RUT actualizado (Verificación: Documento)', weight: 3 },
            { id: 'legal_seguridad_social', label: 'Pago seguridad social (si aplica) (Verificación: Planilla PILA)', weight: 5 },
            { id: 'legal_sgsst', label: 'Certificación SG-SST (Verificación: Soporte vigente)', weight: 7 },
            { id: 'otros_pendientes', label: 'Otros Criterios (Pendientes por definir)', weight: 80 },
        ];
    }
    
    // Ensure total is 100 for default state
    const total = formData.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
    if (total !== 100 && !hasSavedCriteria) {
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
        <div className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
                <Scale className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Criterios de Selección Aplicados</h3>
            </div>
            {(!criteria || criteria.length === 0) ? (
                <p className="text-center text-sm text-muted-foreground">No se definieron criterios para este proceso cerrado.</p>
            ) : (
                <>
                <div className="grid gap-2">
                    {criteria.map(c => (
                        <div key={c.id} className="flex justify-between items-center text-sm p-3 rounded-md bg-muted/50 border">
                            <span className="font-medium">{c.label}</span>
                            <Badge variant="secondary" className="font-bold text-sm">{c.weight}%</Badge>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-4 pt-4 border-t">
                    <span className="text-sm font-bold">Total Peso:</span>
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {form.formState.errors.criteria?.root && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Error en los Pesos</AlertTitle>
                <AlertDescription>{form.formState.errors.criteria.root?.message}</AlertDescription>
            </Alert>
        )}

        <div className="space-y-8">
            {/* CATEGORY 1 */}
            <section className="space-y-4">
                <div className="bg-primary/5 p-3 rounded-t-lg border-b-2 border-primary">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        🧩 1. CAPACIDAD LEGAL (Obligatorio para todos)
                    </h3>
                </div>
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    {fields.map((field, index) => {
                        const critId = watchedCriteria[index]?.id;
                        if (!critId?.startsWith('legal_')) return null;
                        
                        return (
                            <div key={field.id} className="flex items-center gap-4">
                                <FormLabel className="flex-1 pt-2 text-sm md:text-base">{watchedCriteria[index]?.label}</FormLabel>
                                <FormField
                                    control={form.control}
                                    name={`criteria.${index}.weight`}
                                    render={({ field }) => (
                                        <FormItem className="w-28 shrink-0">
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="number" placeholder="Peso" {...field} className="pr-8 text-center font-bold" />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* OTHER CRITERIA SECTION */}
            <section className="space-y-4 opacity-60">
                <div className="bg-muted p-3 rounded-t-lg border-b-2 border-muted-foreground/30">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        ⏳ CRITERIOS PENDIENTES POR DEFINIR
                    </h3>
                </div>
                <div className="space-y-4 pl-4 border-l-2 border-dashed border-muted-foreground/20">
                    {fields.map((field, index) => {
                        const critId = watchedCriteria[index]?.id;
                        if (critId?.startsWith('legal_')) return null;
                        
                        return (
                            <div key={field.id} className="flex items-center gap-4">
                                <FormLabel className="flex-1 pt-2 text-sm italic">{watchedCriteria[index]?.label}</FormLabel>
                                <FormField
                                    control={form.control}
                                    name={`criteria.${index}.weight`}
                                    render={({ field }) => (
                                        <FormItem className="w-28 shrink-0">
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="number" placeholder="Peso" {...field} className="pr-8 text-center" />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
        
        <div className="space-y-2 bg-muted/30 p-4 rounded-lg border">
            <FormDescription className="text-center mb-2">La suma de los pesos de todos los criterios debe ser exactamente 100%.</FormDescription>
            <div className="flex items-center gap-4 max-w-md mx-auto">
                <span className="text-sm font-bold min-w-[80px]">Suma Total:</span>
                <Progress value={totalWeight} className="flex-1" />
                <span className={`text-lg font-bold min-w-[60px] text-right ${totalWeight !== 100 ? 'text-destructive' : 'text-primary'}`}>{totalWeight}%</span>
            </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={totalWeight !== 100}>
            <Save className="mr-2 h-5 w-5" />
            Guardar Criterios
          </Button>
        </div>
      </form>
    </Form>
  );
}
