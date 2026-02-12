
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Loader2, Save, AlertCircle } from 'lucide-react';
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
import { getCriteriaForType, CategoryType, Criterion } from '@/lib/evaluations';
import { criteriaWeightsSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

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
      const criteriaForType = getCriteriaForType(selectedCategory.categoryType);
      const formData = criteriaForType.map(crit => {
        const savedWeight = selectedCategory.evaluationCriteriaWeights?.[crit.id];
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
  }, [selectedCategory, form]);

  const watchedCriteria = useWatch({
    control: form.control,
    name: 'criteria',
  });

  const totalWeight = watchedCriteria.reduce(
    (sum, item) => sum + (Number(item.weight) || 0),
    0
  );

  const onSubmit = async (data: CriteriaFormValues) => {
    if (!selectedCategoryDocRef) return;

    setIsSaving(true);
    const weightsToSave: Record<string, number> = {};
    data.criteria.forEach(crit => {
      weightsToSave[crit.id] = crit.weight / 100;
    });

    try {
      await updateDoc(selectedCategoryDocRef, { evaluationCriteriaWeights: weightsToSave });
      toast({
        title: 'Pesos Guardados',
        description: `Los pesos de los criterios para la categoría "${selectedCategory?.name}" han sido actualizados.`,
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
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Selecciona una Categoría</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <Select onValueChange={setSelectedCategoryId} value={selectedCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría para configurar..." />
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

        {selectedCategoryId && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : selectedCategory ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {form.formState.errors.criteria?.root && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error en los Pesos</AlertTitle>
                      <AlertDescription>
                        {form.formState.errors.criteria.root?.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-4">
                        <FormLabel className="flex-1 pt-2 text-sm">{field.label}</FormLabel>
                        <FormField
                          control={form.control}
                          name={`criteria.${index}.weight`}
                          render={({ field }) => (
                            <FormItem className="w-40 flex items-center gap-2">
                              <FormControl>
                                <Input type="number" placeholder="Peso" {...field} />
                              </FormControl>
                              <span className="text-muted-foreground">%</span>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold">Total:</span>
                      <Progress value={totalWeight} className="flex-1" />
                      <span
                        className={`text-sm font-bold w-16 text-right ${
                          Math.abs(totalWeight - 100) > 0.01 ? 'text-destructive' : ''
                        }`}
                      >
                        {totalWeight.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                      Guardar Pesos
                    </Button>
                  </div>
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
