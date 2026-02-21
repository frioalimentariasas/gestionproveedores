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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { addDoc, collection, serverTimestamp, doc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Info } from 'lucide-react';
import { getCriteriaForType, CategoryType, EVALUATION_TYPES } from '@/lib/evaluations';
import { Badge } from '../ui/badge';

interface Provider {
  id: string;
  businessName: string;
  providerType?: string[];
  categoryIds?: string[];
}

interface Category {
  id: string;
  name: string;
  categoryType: CategoryType;
  evaluationCriteriaWeights?: Record<string, number>;
}

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

const fileSchemaOptional = z
  .any()
  .optional()
  .refine(
    (files) =>
      !files ||
      files.length === 0 ||
      (files?.[0]?.size <= MAX_FILE_SIZE && ACCEPTED_FILE_TYPES.includes(files?.[0]?.type)),
    'El archivo debe ser un PDF de menos de 5MB.'
  );

export function EvaluationModal({ isOpen, onClose, provider }: EvaluationModalProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [criteriaForForm, setCriteriaForForm] = useState<any[]>([]);
  const [totalScore, setTotalScore] = useState(0);

  const categoriesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'categories') : null),
    [firestore]
  );
  const { data: allCategories } = useCollection<Category>(categoriesCollectionRef);

  const providerCategories = useMemo(() => {
    if (!provider?.categoryIds || !allCategories) return [];
    return allCategories.filter(cat => provider.categoryIds!.includes(cat.id));
  }, [provider, allCategories]);

  const selectedCategoryDocRef = useMemoFirebase(
    () => (firestore && selectedCategoryId ? doc(firestore, 'categories', selectedCategoryId) : null),
    [firestore, selectedCategoryId]
  );
  const { data: selectedCategoryData, isLoading: isLoadingCategory } = useDoc<Category>(selectedCategoryDocRef);

  const evaluationSchema = useMemo(() => {
    const scoreFields = criteriaForForm.reduce((acc, crit) => {
      acc[crit.id] = z.number().min(1).max(5);
      return acc;
    }, {} as Record<string, z.ZodNumber>);

    return z.object({
      scores: z.object(scoreFields),
      comments: z.string().optional(),
      fracttalOrderIds: z.string().optional(),
      evidenceFile: fileSchemaOptional,
    });
  }, [criteriaForForm]);

  type EvaluationFormValues = z.infer<typeof evaluationSchema>;

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
  });

  useEffect(() => {
    if (selectedCategoryData) {
      const criteria = getCriteriaForType(selectedCategoryData.categoryType);
      const configuredCriteria = criteria.map(crit => ({
        ...crit,
        weight: selectedCategoryData.evaluationCriteriaWeights?.[crit.id] ?? crit.defaultWeight,
      }));
      setCriteriaForForm(configuredCriteria);

      const defaultScores = configuredCriteria.reduce((acc, crit) => {
        acc[crit.id] = 3;
        return acc;
      }, {} as Record<string, number>);

      form.reset({ scores: defaultScores, comments: '', fracttalOrderIds: '' });
    }
  }, [selectedCategoryData, form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      const currentScores = value.scores as Record<string, number> | undefined;
      if (!currentScores || !criteriaForForm || criteriaForForm.length === 0) {
        setTotalScore(0);
        return;
      }

      const weightedScoreSum = criteriaForForm.reduce((total, criterion) => {
        const score = currentScores[criterion.id] || 0;
        return total + score * criterion.weight;
      }, 0);

      setTotalScore(weightedScoreSum);
    });
    return () => subscription.unsubscribe();
  }, [form, criteriaForForm]);

  const handleClose = () => {
    setTimeout(() => {
      setSelectedCategoryId(null);
      setCriteriaForForm([]);
      form.reset();
    }, 300);
    onClose();
  };

  async function onSubmit(values: EvaluationFormValues) {
    if (!user || !firestore || !provider || !selectedCategoryData) return;

    setIsSubmitting(true);
    let evidenceFileUrl = '';
    const fileList = values.evidenceFile as FileList | undefined;

    if (fileList && fileList.length > 0) {
      setIsUploading(true);
      try {
        const file = fileList[0];
        const fileName = `evaluation_evidence_${provider.id}_${Date.now()}.pdf`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', provider.id);
        formData.append('fileName', fileName);

        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error((await response.json()).error || 'Failed to upload file.');
        const { url } = await response.json();
        evidenceFileUrl = url;
      } catch (uploadError: any) {
        toast({ title: 'Error al subir archivo', description: uploadError.message, variant: 'destructive' });
        setIsUploading(false);
        setIsSubmitting(false);
        return;
      }
      setIsUploading(false);
    }

    const dataToSave = {
      providerId: provider.id,
      evaluatorId: user.uid,
      evaluatorName: user.displayName || user.email,
      evaluationType: selectedCategoryData.categoryType,
      categoryId: selectedCategoryData.id,
      scores: values.scores,
      totalScore: totalScore,
      comments: values.comments || '',
      createdAt: serverTimestamp(),
      ...(evidenceFileUrl && { evidenceFileUrl }),
      ...(values.fracttalOrderIds && { fracttalOrderIds: values.fracttalOrderIds }),
    };

    const evaluationsCollection = collection(firestore, 'providers', provider.id, 'evaluations');
    addDoc(evaluationsCollection, dataToSave)
      .then(() => {
        toast({ title: 'Evaluación Guardada', description: `Se ha guardado la evaluación para ${provider?.businessName}.` });
        handleClose();
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: evaluationsCollection.path, operation: 'create', requestResourceData: dataToSave }));
      })
      .finally(() => setIsSubmitting(false));
  }

  const isFormSubmitting = isSubmitting || isUploading;
  const evaluationTitle = selectedCategoryData ? EVALUATION_TYPES[selectedCategoryData.categoryType] : "Evaluación";
  const showFracttalField = selectedCategoryData?.categoryType === 'Productos';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[650px]" onCloseAutoFocus={(e) => e.preventDefault()}>
        {!provider ? (
          <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : !selectedCategoryId ? (
          <>
            <DialogHeader>
              <DialogTitle>Seleccionar Categoría para la Evaluación</DialogTitle>
              <DialogDescription>
                Elige la categoría en la que deseas evaluar a <strong>{provider.businessName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {providerCategories.length > 0 ? providerCategories.map((cat) => (
                <Button key={cat.id} variant="outline" className="justify-start h-auto py-3 text-left" onClick={() => setSelectedCategoryId(cat.id)}>
                  <span className="font-semibold">{cat.name}</span>
                </Button>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">Este proveedor no tiene categorías asignadas. Por favor, asígnale una desde la tabla de proveedores para poder evaluarlo.</p>
              )}
            </div>
            <DialogFooter><Button type="button" variant="secondary" onClick={handleClose}>Cancelar</Button></DialogFooter>
          </>
        ) : isLoadingCategory ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{evaluationTitle}</DialogTitle>
              <DialogDescription>
                Evalúa a <strong>{provider.businessName}</strong> para la categoría <strong>{selectedCategoryData?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-4">
                  <div className="bg-muted/50 p-3 rounded-md border text-[10px] sm:text-xs">
                    <h4 className="font-bold flex items-center gap-1 mb-2">
                      <Info className="h-3 w-3 text-primary" />
                      Escala:
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="bg-background px-1 h-4 text-[9px]">5</Badge> <span className="truncate">Cumple totalmente</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="bg-background px-1 h-4 text-[9px]">4</Badge> <span className="truncate">Con observaciones</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="bg-background px-1 h-4 text-[9px]">3</Badge> <span className="truncate">Parcialmente</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="bg-background px-1 h-4 text-[9px]">2</Badge> <span className="truncate">Deficiente</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="bg-background px-1 h-4 text-[9px]">1</Badge> <span className="truncate">No cumple</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-md border bg-muted/50 p-4">
                    <h4 className="font-semibold text-sm mb-2">Soportes de la Evaluación</h4>
                    {showFracttalField ? (
                      <>
                        <FormField control={form.control} name="fracttalOrderIds" render={({ field }) => (
                          <FormItem>
                            <FormLabel>IDs Órdenes de Compra (Fracttal)</FormLabel>
                            <FormControl><Textarea placeholder="Listar IDs separados por coma, ej: FA-123, FA-124" {...field} /></FormControl>
                            <FormDescription>Registre los identificadores de las órdenes de compra evaluadas.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="evidenceFile" render={() => (
                          <FormItem>
                            <FormLabel>Adjuntar Soporte Adicional (Opcional)</FormLabel>
                            <FormControl><Input type="file" accept="application/pdf" {...form.register('evidenceFile')} /></FormControl>
                            <FormDescription>Puede adjuntar un informe de resumen u otro soporte.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </>
                    ) : (
                       <FormField control={form.control} name="evidenceFile" render={() => (
                          <FormItem>
                            <FormLabel>Adjuntar Soporte (Opcional)</FormLabel>
                            <FormControl><Input type="file" accept="application/pdf" {...form.register('evidenceFile')} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                    )}
                  </div>
                  {criteriaForForm.map((criterion) => (
                    criterion.weight > 0 &&
                    <FormField key={criterion.id} control={form.control} name={`scores.${criterion.id}`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>{criterion.label} <span className="text-muted-foreground">({(criterion.weight * 100).toFixed(0)}%)</span></FormLabel>
                        <div className="flex items-center gap-4">
                          <FormControl>
                            <Slider min={1} max={5} step={1} value={[field.value]} onValueChange={(value) => field.onChange(value[0])} className="flex-1" />
                          </FormControl>
                          <span className="w-8 text-center font-bold">{field.value}</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ))}
                  <FormField control={form.control} name="comments" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentarios Adicionales</FormLabel>
                      <FormControl><Textarea placeholder="Añade tus observaciones aquí..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex items-center justify-end gap-4 rounded-lg bg-muted/50 p-4">
                  <span className="text-lg font-semibold">Puntaje Total:</span>
                  <span className="text-2xl font-bold text-primary">{totalScore.toFixed(2)} / 5.00</span>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                  <Button type="submit" disabled={isFormSubmitting}>
                    {(isUploading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUploading ? 'Subiendo archivo...' : 'Guardar Evaluación'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
