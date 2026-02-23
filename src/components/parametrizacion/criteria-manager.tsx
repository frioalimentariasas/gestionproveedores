'use client';

import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Loader2, Save, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { getCriteriaForType, CategoryType } from '@/lib/evaluations';
import { criteriaWeightsSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';

interface Category {
  id: string;
  name: string;
  categoryType: CategoryType;
  evaluationCriteriaWeights?: Record<string, number>;
}

type CriteriaFormValues = z.infer<typeof criteriaWeightsSchema>;

export function CriteriaManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCriticalPreview, setShowCriticalPreview] = useState(false);

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'categories') : null),
    [firestore]
  );
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  const selectedCategoryDocRef = useMemoFirebase(
    () => (firestore && selectedCategoryId ? doc(firestore, 'categories', selectedCategoryId) : null),
    [firestore, selectedCategoryId]
  );
  const { data: selectedCategory, isLoading: isLoadingSelectedCategory } = useDoc<Category>(selectedCategoryDocRef);

  const form = useForm<CriteriaFormValues>({
    resolver: zodResolver(criteriaWeightsSchema),
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
    if (selectedCategory) {
      const criteriaForType = getCriteriaForType(selectedCategory.categoryType, showCriticalPreview);
      const formData = criteriaForType.map(crit => {
        // En parametrización global, si es para No Críticos (estándar), mostramos lo guardado o el default ISO Normal
        // Si es preview crítico, mostramos solo el default ISO Crítico para referencia
        const savedWeight = !showCriticalPreview ? selectedCategory.evaluationCriteriaWeights?.[crit.id] : undefined;
        return {
          id: crit.id,
          label: crit.label,
          weight: savedWeight !== undefined ? savedWeight * 100 : crit.defaultWeight * 100,
        };
      });
      form.reset({ criteria: formData });
    } else {
      form.reset({ criteria: [] });
    }
  }, [selectedCategory, form, showCriticalPreview]);

  const watchedCriteria = useWatch({
    control: form.control,
    name: 'criteria',
  });

  const totalWeight = watchedCriteria.reduce(
    (sum, item) => sum + (Number(item.weight) || 0),
    0
  );

  const onSubmit = async (data: CriteriaFormValues) => {
    if (!selectedCategoryDocRef || showCriticalPreview) return;

    setIsSaving(true);
    const weightsToSave: Record<string, number> = {};
    data.criteria.forEach(crit => {
      weightsToSave[crit.id] = crit.weight / 100;
    });

    try {
      await updateDoc(selectedCategoryDocRef, { evaluationCriteriaWeights: weightsToSave });
      toast({
        title: 'Pesos ISO 9001 Actualizados',
        description: `La configuración para "${selectedCategory?.name}" ha sido guardada.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error al Guardar',
        description: 'No se pudieron actualizar los pesos.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isLoadingCategories || isLoadingSelectedCategory;

  return (
    <Card className="max-w-4xl mx-auto border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          Configuración Normativa ISO 9001
        </CardTitle>
        <CardDescription>
          Ajusta los pesos de evaluación para el sector seleccionado. El sistema aplicará automáticamente el refuerzo de criticidad cuando el proveedor sea calificado como "Crítico".
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <FormLabel>Sector / Categoría</FormLabel>
                <Select onValueChange={setSelectedCategoryId} value={selectedCategoryId}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría..." />
                </SelectTrigger>
                <SelectContent>
                    {isLoadingCategories ? (
                    <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    ) : (
                    categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} ({cat.categoryType})
                        </SelectItem>
                    ))
                    )}
                </SelectContent>
                </Select>
            </div>
            
            {selectedCategoryId && (
                <div className="space-y-2">
                    <FormLabel>Vista de Configuración</FormLabel>
                    <div className="flex gap-2">
                        <Button 
                            variant={!showCriticalPreview ? "default" : "outline"} 
                            className="flex-1 text-xs"
                            onClick={() => setShowCriticalPreview(false)}
                        >
                            Pesos Estándar
                        </Button>
                        <Button 
                            variant={showCriticalPreview ? "destructive" : "outline"} 
                            className="flex-1 text-xs"
                            onClick={() => setShowCriticalPreview(true)}
                        >
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            Refuerzo Crítico
                        </Button>
                    </div>
                </div>
            )}
        </div>

        {selectedCategoryId && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : selectedCategory ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {showCriticalPreview && (
                      <Alert className="bg-destructive/5 border-destructive/20 text-destructive">
                          <ShieldAlert className="h-4 w-4" />
                          <AlertTitle className="font-bold">Modo Vista de Criticidad</AlertTitle>
                          <AlertDescription className="text-xs">
                              Estás viendo los pesos sugeridos por la norma para proveedores de alto impacto. En este modo la edición está deshabilitada ya que el refuerzo técnico se aplica dinámicamente.
                          </AlertDescription>
                      </Alert>
                  )}

                  {form.formState.errors.criteria?.root && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error en la Ponderación</AlertTitle>
                      <AlertDescription>
                        {form.formState.errors.criteria.root?.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-4 bg-background p-3 rounded-md border shadow-sm">
                        <div className="flex-1">
                            <FormLabel className="text-sm font-bold block">{field.label}</FormLabel>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Criterio ISO 9001</p>
                        </div>
                        <FormField
                          control={form.control}
                          name={`criteria.${index}.weight`}
                          render={({ field }) => (
                            <FormItem className="w-32">
                              <FormControl>
                                <div className="relative">
                                    <Input 
                                        type="number" 
                                        placeholder="%" 
                                        {...field} 
                                        disabled={showCriticalPreview}
                                        className="pr-8 text-right font-bold"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 bg-muted/50 p-6 rounded-lg border-2 border-dashed">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-black uppercase tracking-wider">Cumplimiento del 100%:</span>
                      <div className="flex-1 max-w-md">
                        <Progress value={totalWeight} className="h-3" />
                      </div>
                      <Badge 
                        variant={Math.abs(totalWeight - 100) > 0.01 ? "destructive" : "default"}
                        className="text-lg px-4"
                      >
                        {totalWeight.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>

                  {!showCriticalPreview && (
                    <div className="flex justify-end">
                        <Button type="submit" size="lg" disabled={isSaving || Math.abs(totalWeight - 100) > 0.01}>
                        {isSaving ? <Loader2 className="mr-2 animate-spin h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                        Guardar Parametrización ISO
                        </Button>
                    </div>
                  )}
                </form>
              </Form>
            ) : (
              <p className="text-center text-muted-foreground">No se encontró la categoría seleccionada.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
