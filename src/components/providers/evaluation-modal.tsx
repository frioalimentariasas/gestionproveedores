
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
import { Loader2, Info, ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, NotebookPen } from 'lucide-react';
import { getCriteriaForType, CategoryType, EVALUATION_TYPES, requiresActionPlan, getPerformanceStatus } from '@/lib/evaluations';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notifyProviderEvaluationFailed, notifyProviderEvaluationSuccess } from '@/actions/email';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';

interface Provider {
  id: string;
  businessName: string;
  email: string;
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

    const justificationFields = criteriaForForm.reduce((acc, crit) => {
      acc[crit.id] = z.string().min(5, 'Debe justificar brevemente la puntuación.');
      return acc;
    }, {} as Record<string, z.ZodString>);

    return z.object({
      scores: z.object(scoreFields),
      scoreJustifications: z.object(justificationFields),
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

      const defaultJustifications = configuredCriteria.reduce((acc, crit) => {
        acc[crit.id] = '';
        return acc;
      }, {} as Record<string, string>);

      form.reset({ 
        scores: defaultScores, 
        scoreJustifications: defaultJustifications,
        comments: '', 
        fracttalOrderIds: '' 
      });
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

    const needsAction = requiresActionPlan(totalScore);
    const status = getPerformanceStatus(totalScore);
    const evaluationTitle = selectedCategoryData ? EVALUATION_TYPES[selectedCategoryData.categoryType as keyof typeof EVALUATION_TYPES] : "Evaluación";

    const dataToSave = {
      providerId: provider.id,
      evaluatorId: user.uid,
      evaluatorName: user.displayName || user.email,
      evaluationType: selectedCategoryData.categoryType,
      categoryId: selectedCategoryData.id,
      scores: values.scores,
      scoreJustifications: values.scoreJustifications,
      totalScore: totalScore,
      isActionPlanRequired: needsAction,
      comments: values.comments || '',
      createdAt: serverTimestamp(),
      ...(evidenceFileUrl && { evidenceFileUrl }),
      ...(values.fracttalOrderIds && { fracttalOrderIds: values.fracttalOrderIds }),
    };

    const evaluationsCollection = collection(firestore, 'providers', provider.id, 'evaluations');
    addDoc(evaluationsCollection, dataToSave)
      .then(() => {
        if (provider.email) {
            if (needsAction) {
                notifyProviderEvaluationFailed({
                    providerEmail: provider.email,
                    providerName: provider.businessName,
                    score: totalScore,
                    evaluationType: evaluationTitle
                }).catch(console.error);
            } else if (status.isSuccess) {
                notifyProviderEvaluationSuccess({
                    providerEmail: provider.email,
                    providerName: provider.businessName,
                    score: totalScore,
                    evaluationType: evaluationTitle
                }).catch(console.error);
            }
        }

        toast({ 
          title: 'Evaluación Guardada', 
          description: `Se ha registrado el desempeño ISO 9001 para ${provider?.businessName}.${needsAction ? ' Se notificaron los hallazgos.' : status.isSuccess ? ' Se envió correo de felicitación.' : ''}` 
        });
        handleClose();
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: evaluationsCollection.path, operation: 'create', requestResourceData: dataToSave }));
      })
      .finally(() => setIsSubmitting(false));
  }

  const isFormSubmitting = isSubmitting || isUploading;
  const evaluationTitle = selectedCategoryData ? EVALUATION_TYPES[selectedCategoryData.categoryType as keyof typeof EVALUATION_TYPES] : "Evaluación";
  const needsAction = requiresActionPlan(totalScore);
  const status = getPerformanceStatus(totalScore);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-[850px] h-[95vh] flex flex-col p-0 overflow-hidden border-t-8 border-t-primary" 
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {!provider ? (
          <div className="flex items-center justify-center flex-1"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : !selectedCategoryId ? (
          <div className="flex flex-col flex-1 p-6 overflow-hidden">
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Nueva Evaluación de Desempeño ISO 9001
              </DialogTitle>
              <DialogDescription>
                Selecciona la categoría operativa para evaluar a <strong>{provider.businessName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow mt-4 pr-4">
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
                  <div className="text-sm text-muted-foreground text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 opacity-20" />
                      <p>Este proveedor no tiene categorías asignadas.</p>
                      <p className="text-xs">Por favor, asígnale categorías en la Gestión de Proveedores.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="shrink-0 pt-4 border-t mt-4">
              <Button type="button" variant="secondary" onClick={handleClose}>Cancelar</Button>
            </DialogFooter>
          </div>
        ) : isLoadingCategory ? (
            <div className="flex items-center justify-center flex-1"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 pb-2 shrink-0 border-b">
              <DialogHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <DialogTitle className="text-xl uppercase font-black tracking-tight">{evaluationTitle}</DialogTitle>
                  <Badge variant={provider.criticalityLevel === 'Crítico' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                      Impacto: {provider.criticalityLevel}
                  </Badge>
                </div>
                <DialogDescription className="font-bold text-primary">
                  Justificación Técnica Obligatoria: Cada puntaje debe estar respaldado por una evidencia u observación.
                </DialogDescription>
              </DialogHeader>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                <ScrollArea className="flex-grow px-6 bg-muted/5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6">
                    <div className="lg:col-span-8 space-y-6">
                        {provider.criticalityLevel === 'Crítico' && (
                            <Alert className="bg-orange-50 border-orange-200">
                                <ShieldAlert className="h-4 w-4 text-orange-600" />
                                <AlertTitle className="text-orange-800 text-xs font-bold uppercase">Refuerzo Técnico ISO 9001</AlertTitle>
                                <AlertDescription className="text-[10px] text-orange-700">
                                    Proveedores críticos tienen una ponderación mayor. Requiere mayor rigor en la justificación.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-6">
                        {criteriaForForm.map((criterion) => (
                            <div key={criterion.id} className="bg-white p-5 rounded-xl border border-primary/5 shadow-sm space-y-4">
                                <FormField control={form.control} name={`scores.${criterion.id}`} render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <FormLabel className="text-sm font-bold flex-1 leading-tight">{criterion.label}</FormLabel>
                                        <Badge variant="outline" className="ml-2 font-mono shrink-0">{(criterion.weight * 100).toFixed(0)}%</Badge>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <FormControl>
                                            <Slider min={1} max={5} step={1} value={[field.value]} onValueChange={(value) => field.onChange(value[0])} className="flex-1" />
                                        </FormControl>
                                        <div className={cn(
                                            "w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-lg bg-background shadow-inner shrink-0",
                                            field.value < 3.5 ? "border-destructive text-destructive" : "border-primary text-primary"
                                        )}>
                                            {field.value}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[9px] text-muted-foreground px-1 uppercase font-bold">
                                        <span className="text-destructive">Hallazgo Crítico (1)</span>
                                        <span className="text-primary">Excelente (5)</span>
                                    </div>
                                </FormItem>
                                )} />

                                <FormField control={form.control} name={`scoreJustifications.${criterion.id}`} render={({ field }) => (
                                <FormItem className="space-y-1 pt-2 border-t border-dashed">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <NotebookPen className="h-3.5 w-3.5" />
                                        <Label className="text-[10px] font-black uppercase tracking-tight">Justificación Técnica / Evidencia:</Label>
                                    </div>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Indique por qué asignó esta nota (Ej: Cumplimiento total de cronogramas, 0 retrasos)..." 
                                            {...field} 
                                            className="text-xs min-h-[60px] bg-muted/20 focus-visible:ring-primary" 
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                                )} />
                            </div>
                        ))}
                        </div>

                        <Card className="bg-white">
                            <CardHeader className="py-4 border-b">
                                <CardTitle className="text-sm font-bold uppercase text-primary">Información Logística Final</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="fracttalOrderIds" render={({ field }) => (
                                        <FormItem>
                                        <FormLabel className="text-[11px] font-bold uppercase">Órdenes de Trabajo / Compra (Soporte)</FormLabel>
                                        <FormControl><Input placeholder="IDs separados por coma..." {...field} className="text-xs" /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="evidenceFile" render={() => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] font-bold uppercase">Anexo PDF de Auditoría</FormLabel>
                                            <FormControl><Input type="file" accept="application/pdf" {...form.register('evidenceFile')} className="text-xs" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="comments" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-[11px] font-bold uppercase">Observaciones Generales de la Auditoría</FormLabel>
                                    <FormControl><Textarea placeholder="Conclusiones finales del evaluador..." {...field} className="text-xs min-h-[80px]" /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-t-4 border-t-accent shadow-md sticky top-0">
                            <CardHeader className="p-4 bg-accent/5">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-accent" />
                                    Guía de Decisión Técnica
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-4 text-[10px] space-y-3">
                                <div className="flex justify-between items-center border-b pb-1 font-bold">
                                    <span>Puntaje (%)</span>
                                    <span>Decisión Auditoría</span>
                                </div>
                                <div className="flex justify-between items-center text-green-700 font-bold p-1 rounded">
                                    <span>&ge; 85% (4.25)</span>
                                    <span className="flex items-center gap-1">Sobresaliente <CheckCircle2 className="h-2 w-2" /></span>
                                </div>
                                <div className="flex justify-between items-center text-blue-700 font-medium p-1 rounded">
                                    <span>70 - 84% (3.5)</span>
                                    <span>Satisfactorio</span>
                                </div>
                                <div className="flex justify-between items-center text-yellow-700 font-bold p-1 rounded bg-yellow-50 border border-yellow-100">
                                    <span>60 - 69% (3.0)</span>
                                    <span>En Observación *</span>
                                </div>
                                <div className="flex justify-between items-center text-red-700 font-black p-1 rounded bg-red-50 border border-red-100">
                                    <span>&lt; 60%</span>
                                    <span>Crítico *</span>
                                </div>
                                
                                <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-primary/10 text-muted-foreground italic leading-tight">
                                    <p>
                                        * Los estados con asterisco exigen la radicación obligatoria de un <strong>Plan de Mejora ISO 9001</strong> para asegurar la continuidad comercial.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                            <h4 className="text-[10px] font-bold uppercase text-primary flex items-center gap-2">
                                <Info className="h-3 w-3" /> Transparencia Normativa
                            </h4>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Sus justificaciones serán visibles para el proveedor. Esto fomenta la retroalimentación constructiva y la mejora continua del suministro.
                            </p>
                        </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="p-6 pt-2 shrink-0 border-t bg-background space-y-4 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-primary text-primary-foreground shadow-lg">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Calificación Final ISO</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black">{totalScore.toFixed(2)}</span>
                                <Badge variant="outline" className={cn("text-xs border-white text-white font-bold", status.color)}>
                                    {status.label}
                                </Badge>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Cumplimiento</span>
                            <div className="text-3xl font-black">{(totalScore * 20).toFixed(0)}%</div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button type="button" variant="outline" onClick={handleClose} className="font-bold">Cancelar Auditoría</Button>
                      <Button type="submit" disabled={isFormSubmitting} className="min-w-[200px] shadow-md font-bold">
                        {isFormSubmitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isUploading ? 'Subiendo...' : 'Guardando...'}</>
                        ) : 'Emitir Dictamen Final'}
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
