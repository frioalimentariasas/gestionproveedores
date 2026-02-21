
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
import { Save, Scale, Gavel, AlertCircle, Wrench, Truck, CircleDollarSign, ShieldCheck, Info } from 'lucide-react';
import { useEffect } from 'react';
import { Progress } from '../ui/progress';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import type { Criterion } from './manage-selection-event';
import { criteriaListSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { Badge } from '../ui/badge';

interface CriteriaManagerProps {
  criteria: Criterion[];
  onSave: (criteria: Criterion[]) => void;
  isLocked: boolean;
  criticalityLevel?: string;
}

type CriteriaFormValues = z.infer<typeof criteriaListSchema>;

const PREDEFINED_CRITERIA: Omit<Criterion, 'weight'>[] = [
    // 1. CAPACIDAD LEGAL (20%)
    { id: 'legal_camara', label: 'Cámara de Comercio vigente (Verificación: Documento actualizado)' },
    { id: 'legal_rut', label: 'RUT actualizado (Verificación: Documento)' },
    { id: 'legal_seguridad_social', label: 'Pago seguridad social (si aplica) (Verificación: Planilla PILA)' },
    { id: 'legal_sgsst', label: 'Certificación SG-SST (Verificación: Soporte vigente)' },
    
    // 2. CAPACIDAD TÉCNICA (Variable: 35% o 40%)
    { id: 'tech_exp', label: 'Experiencia mínima comprobada (2-5 años)' },
    { id: 'tech_staff', label: 'Personal calificado / certificado' },
    { id: 'tech_specs', label: 'Fichas técnicas / especificaciones' },
    { id: 'tech_certs', label: 'Certificaciones técnicas (RETIE, ONAC, INVIMA, etc.)' },
    { id: 'tech_visit', label: 'Visita técnica previa (Solo Críticos)' },

    // 3. CAPACIDAD OPERATIVA (Variable: 20% o 15%)
    { id: 'operative_infra', label: 'Infraestructura y recursos disponibles' },
    { id: 'operative_resp', label: 'Capacidad de respuesta' },
    { id: 'operative_delivery', label: 'Disponibilidad para entregas' },

    // 4. CAPACIDAD FINANCIERA Y COMERCIAL (Variable: 15% o 10%)
    { id: 'financial_stability', label: 'Estabilidad financiera' },
    { id: 'financial_conditions', label: 'Condiciones comerciales' },
    { id: 'financial_price', label: 'Competitividad del precio' },

    // 5. GESTIÓN DEL RIESGO Y CONTINUIDAD (Variable: 10% o 15%)
    { id: 'risk_plan', label: 'Plan de contingencia' },
    { id: 'risk_policy', label: 'Póliza de responsabilidad civil' },
];


export function CriteriaManager({
  criteria,
  onSave,
  isLocked,
  criticalityLevel,
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
    
    if (hasSavedCriteria) {
        // Map saved criteria but ensure predefined ones are there if they don't exist yet
        const formData = PREDEFINED_CRITERIA.map(predef => {
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
        form.reset({ criteria: formData });
    } else {
        // Initialization based on CRITICALITY logic
        const isCritical = criticalityLevel === 'Crítico';
        
        const formData = [
            // Section 1: CAPACIDAD LEGAL (20%) - Stable
            { id: 'legal_camara', label: 'Cámara de Comercio vigente (Verificación: Documento actualizado)', weight: 5 },
            { id: 'legal_rut', label: 'RUT actualizado (Verificación: Documento)', weight: 3 },
            { id: 'legal_seguridad_social', label: 'Pago seguridad social (si aplica) (Verificación: Planilla PILA)', weight: 5 },
            { id: 'legal_sgsst', label: 'Certificación SG-SST (Verificación: Soporte vigente)', weight: 7 },
            
            // Section 2: CAPACIDAD TÉCNICA (35% standard -> 40% critical)
            { id: 'tech_exp', label: 'Experiencia mínima comprobada (2-5 años)', weight: 10 },
            { id: 'tech_staff', label: 'Personal calificado / certificado', weight: 10 },
            { id: 'tech_specs', label: 'Fichas técnicas / especificaciones', weight: 5 },
            { id: 'tech_certs', label: 'Certificaciones técnicas (RETIE, ONAC, INVIMA, etc.)', weight: isCritical ? 10 : 10 },
            { id: 'tech_visit', label: 'Visita técnica previa (Solo Críticos)', weight: isCritical ? 5 : 0 },

            // Section 3: CAPACIDAD OPERATIVA (20% standard -> 15% critical)
            { id: 'operative_infra', label: 'Infraestructura y recursos disponibles', weight: isCritical ? 5 : 10 },
            { id: 'operative_resp', label: 'Capacidad de respuesta', weight: 5 },
            { id: 'operative_delivery', label: 'Disponibilidad para entregas', weight: 5 },

            // Section 4: CAPACIDAD FINANCIERA Y COMERCIAL (15% standard -> 10% critical)
            { id: 'financial_stability', label: 'Estabilidad financiera', weight: isCritical ? 4 : 5 },
            { id: 'financial_conditions', label: 'Condiciones comerciales', weight: isCritical ? 3 : 5 },
            { id: 'financial_price', label: 'Competitividad del precio', weight: isCritical ? 3 : 5 },

            // Section 5: GESTIÓN DEL RIESGO Y CONTINUIDAD (10% standard -> 15% critical)
            { id: 'risk_plan', label: 'Plan de contingencia', weight: isCritical ? 10 : 5 },
            { id: 'risk_policy', label: 'Póliza de responsabilidad civil', weight: 5 },
        ];

        // Ensure total is 100
        const total = formData.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
        if (total !== 100) {
            const diff = 100 - total;
            const lastItem = formData[formData.length - 1];
            if (lastItem) { lastItem.weight = (lastItem.weight || 0) + diff; }
        }

        form.reset({ criteria: formData });
    }
  }, [criteria, form, criticalityLevel]);


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
                    {criteria.filter(c => c.weight > 0).map(c => (
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
        <div className="bg-primary/5 p-4 rounded-lg border flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
                <p className="font-bold">Ajuste por Criticidad: {criticalityLevel}</p>
                <p className="text-muted-foreground">
                    Los pesos se han inicializado según el nivel de criticidad seleccionado. 
                    {criticalityLevel === 'Crítico' ? 
                        ' Se ha incrementado la Capacidad Técnica (40%) y Gestión de Riesgo (15%).' : 
                        ' Se mantiene la ponderación estándar.'}
                </p>
            </div>
        </div>

        {form.formState.errors.criteria?.root && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Error en los Pesos</AlertTitle>
                <AlertDescription>{form.formState.errors.criteria.root?.message}</AlertDescription>
            </Alert>
        )}

        <div className="space-y-8">
            {/* CATEGORY 1: LEGAL */}
            <section className="space-y-4">
                <div className="bg-primary/5 p-3 rounded-t-lg border-b-2 border-primary">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Gavel className="h-5 w-5 text-primary" /> 1. CAPACIDAD LEGAL (20%)
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

            {/* CATEGORY 2: TECHNICAL */}
            <section className="space-y-4">
                <div className="bg-blue-500/5 p-3 rounded-t-lg border-b-2 border-blue-500">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-blue-700">
                        <Wrench className="h-5 w-5 text-blue-600" /> 2. CAPACIDAD TÉCNICA ({criticalityLevel === 'Crítico' ? '40%' : '35%'})
                    </h3>
                </div>
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                    {fields.map((field, index) => {
                        const critId = watchedCriteria[index]?.id;
                        if (!critId?.startsWith('tech_')) return null;
                        
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

            {/* CATEGORY 3: OPERATIVE */}
            <section className="space-y-4">
                <div className="bg-orange-500/5 p-3 rounded-t-lg border-b-2 border-orange-500">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-orange-700">
                        <Truck className="h-5 w-5 text-orange-600" /> 3. CAPACIDAD OPERATIVA ({criticalityLevel === 'Crítico' ? '15%' : '20%'})
                    </h3>
                </div>
                <div className="space-y-4 pl-4 border-l-2 border-orange-200">
                    {fields.map((field, index) => {
                        const critId = watchedCriteria[index]?.id;
                        if (!critId?.startsWith('operative_')) return null;
                        
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

            {/* CATEGORY 4: FINANCIAL */}
            <section className="space-y-4">
                <div className="bg-green-500/5 p-3 rounded-t-lg border-b-2 border-green-500">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-green-700">
                        <CircleDollarSign className="h-5 w-5 text-green-600" /> 4. CAPACIDAD FINANCIERA Y COMERCIAL ({criticalityLevel === 'Crítico' ? '10%' : '15%'})
                    </h3>
                </div>
                <div className="space-y-4 pl-4 border-l-2 border-green-200">
                    {fields.map((field, index) => {
                        const critId = watchedCriteria[index]?.id;
                        if (!critId?.startsWith('financial_')) return null;
                        
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

            {/* CATEGORY 5: RISK MANAGEMENT */}
            <section className="space-y-4">
                <div className="bg-emerald-500/5 p-3 rounded-t-lg border-b-2 border-emerald-500">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-700">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" /> 5. GESTIÓN DEL RIESGO Y CONTINUIDAD ({criticalityLevel === 'Crítico' ? '15%' : '10%'})
                    </h3>
                </div>
                <div className="space-y-4 pl-4 border-l-2 border-emerald-200">
                    {fields.map((field, index) => {
                        const critId = watchedCriteria[index]?.id;
                        if (!critId?.startsWith('risk_')) return null;
                        
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
