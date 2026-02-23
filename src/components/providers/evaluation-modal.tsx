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
import { Loader2, Info, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getCriteriaForType, CategoryType, EVALUATION_TYPES, requiresActionPlan } from '@/lib/evaluations';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Provider {
  id: string;
  businessName: string;
  providerType?: string[];
  categoryIds?: string[];
  criticalityLevel?: 'Crítico' | 'No Crítico';
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
    if (selectedCategoryData && provider) {
      const isCritical = provider.criticalityLevel === 'Crítico';
      const criteria = getCriteriaForType(selectedCategoryData.categoryType, isCritical);
      
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
  }, [selectedCategoryData, provider, form]);

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
      isActionPlanRequired: requiresActionPlan(totalScore),
      comments: values.comments || '',
      createdAt: serverTimestamp(),
      ...(evidenceFileUrl && { evidenceFileUrl }),
      ...(values.fracttalOrderIds && { fracttalOrderIds: values.fracttalOrderIds }),
    };

    const evaluationsCollection = collection(firestore, 'providers', provider.id, 'evaluations');
    addDoc(evaluationsCollection, dataToSave)
      .then(() => {
        toast({ 
          title: 'Evaluación Guardada', 
          description: `Se ha registrado el desempeño ISO 9001 para ${provider?.businessName}.` 
        });
        handleClose();
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: evaluationsCollection.path, operation: 'create', requestResourceData: dataToSave }));
      })
      .finally(() => setIsSubmitting(false));
  }

  const isFormSubmitting = isSubmitting || isUploading;
  const evaluationTitle = selectedCategoryData ? EVALUATION_TYPES[selectedCategoryData.categoryType] : "Evaluación";
  const needsAction = requiresActionPlan(totalScore);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-[750px] max-h-[95vh] flex flex-col p-0 overflow-hidden border-t-8 border-t-primary" 
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {!provider ? (
          <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : !selectedCategoryId ? (
          <div className="flex flex-col h-full p-6">
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Nueva Evaluación de Desempeño ISO 9001
              </DialogTitle>
              <DialogDescription>
                Selecciona la categoría operativa para evaluar a <strong>{provider.businessName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 mt-4 pr-4">
              <div className="grid gap-4 py-1">
                {providerCategories.length > 0 ? providerCategories.map((cat) => (
                  <Button key={cat.id} variant="outline" className="justify-between h-auto py-4 text-left group hover:border-primary" onClick={() => setSelectedCategoryId(cat.id)}>
                    <div className="flex flex-col">
                      <span className="font-bold text-base group-hover:text-primary">{cat.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{cat.categoryType}</span>
                    </div>
                    <Info className="h-4 w-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </Button>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed">
                      Este proveedor no tiene categorías asignadas. Por favor, asígnale categorías en la Gestión de Proveedores.
                  </p>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="shrink-0 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={handleClose}>Cancelar</Button>
            </DialogFooter>
          </div>
        ) : isLoadingCategory ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="flex flex-col h-full p-6 overflow-hidden">
            <DialogHeader className="shrink-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <DialogTitle className="text-xl">{evaluationTitle}</DialogTitle>
                <Badge variant={provider.criticalityLevel === 'Crítico' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                    Impacto: {provider.criticalityLevel}
                </Badge>
              </div>
              <DialogDescription>
                Califica el desempeño según el cumplimiento de requisitos del periodo evaluado.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden min-h-0">
                <ScrollArea className="flex-1 mt-4 pr-4 -mr-2">
                  <div className="space-y-6 pb-4">
                    {/* Alerta de Criticidad ISO */}
                    {provider.criticalityLevel === 'Crítico' && (
                        <Alert className="bg-orange-50 border-orange-200">
                            <ShieldAlert className="h-4 w-4 text-orange-600" />
                            <AlertTitle className="text-orange-800 text-xs font-bold uppercase">Refuerzo Técnico Aplicado</AlertTitle>
                            <AlertDescription className="text-[10px] text-orange-700">
                                Bajo ISO 9001, los proveedores críticos tienen una ponderación mayor en Calidad y Competencia Técnica.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                      {criteriaForForm.map((criterion) => (
                          <FormField key={criterion.id} control={form.control} name={`scores.${criterion.id}`} render={({ field }) => (
                          <FormItem className="bg-muted/30 p-4 rounded-lg border shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                  <FormLabel className="text-sm font-bold flex-1">{criterion.label}</FormLabel>
                                  <Badge variant="outline" className="ml-2 font-mono">{(criterion.weight * 100).toFixed(0)}%</Badge>
                              </div>
                              <div className="flex items-center gap-6">
                              <FormControl>
                                  <Slider min={1} max={5} step={1} value={[field.value]} onValueChange={(value) => field.onChange(value[0])} className="flex-1" />
                              </FormControl>
                              <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center font-black text-lg bg-background shadow-inner shrink-0">
                                  {field.value}
                              </div>
                              </div>
                              <div className="flex justify-between text-[10px] text-muted-foreground px-1 uppercase tracking-tighter">
                                  <span>No Cumple</span>
                                  <span>Excelente</span>
                              </div>
                              <FormMessage />
                          </FormItem>
                          )} />
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="fracttalOrderIds" render={({ field }) => (
                          <FormItem>
                          <FormLabel className="text-xs">Evidencia Órdenes de Trabajo / Compra</FormLabel>
                          <FormControl><Textarea placeholder="IDs separados por coma..." {...field} className="text-xs min-h-[80px]" /></FormControl>
                          <FormMessage />
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="comments" render={({ field }) => (
                          <FormItem>
                          <FormLabel className="text-xs">Observaciones Generales</FormLabel>
                          <FormControl><Textarea placeholder="Detalles del desempeño..." {...field} className="text-xs min-h-[80px]" /></FormControl>
                          <FormMessage />
                          </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="evidenceFile" render={() => (
                      <FormItem>
                          <FormLabel className="text-xs">Anexo de Soporte (Opcional - PDF)</FormLabel>
                          <FormControl><Input type="file" accept="application/pdf" {...form.register('evidenceFile')} className="text-xs" /></FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </ScrollArea>

                <div className="shrink-0 pt-4 space-y-4 bg-background border-t mt-2">
                    {needsAction && totalScore > 0 && (
                        <Alert variant="destructive" className="py-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="text-xs font-bold">REQUIERE PLAN DE ACCIÓN CORRECTIVO</AlertTitle>
                            <AlertDescription className="text-[10px]">
                                ISO 9001: Desempeño inferior al 70%.
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-primary text-primary-foreground shadow-lg">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Calificación</span>
                            <span className="text-2xl font-black">{totalScore.toFixed(2)} <span className="text-xs font-normal opacity-60">/ 5.00</span></span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Equivalente</span>
                            <div className="text-2xl font-black">{(totalScore * 20).toFixed(0)}%</div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                      <Button type="submit" disabled={isFormSubmitting} className="min-w-[150px]">
                        {isFormSubmitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isUploading ? 'Subiendo...' : 'Guardando...'}</>
                        ) : 'Cerrar Evaluación'}
                      </Button>
                    </DialogFooter>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
