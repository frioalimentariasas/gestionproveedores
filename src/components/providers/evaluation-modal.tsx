
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  EVALUATION_CRITERIA,
  EVALUATION_TYPE_NAMES,
  type EvaluationType,
} from '@/lib/evaluations';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: { id: string; businessName: string } | null;
}

const evaluationSchema = z.object({
  scores: z.record(z.number().min(1).max(5)),
  comments: z.string().optional(),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

export function EvaluationModal({
  isOpen,
  onClose,
  provider,
}: EvaluationModalProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<EvaluationType | null>(null);
  const [totalScore, setTotalScore] = useState(0);

  const criteria = useMemo(
    () => (selectedType ? EVALUATION_CRITERIA[selectedType] : []),
    [selectedType]
  );

  const defaultScores = useMemo(
    () => criteria.reduce((acc, crit) => ({ ...acc, [crit.id]: 3 }), {}),
    [criteria]
  );

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      scores: defaultScores,
      comments: '',
    },
  });

  useEffect(() => {
    if (isOpen && !selectedType) {
      // If modal opens without a type, we might want to reset things
      // or ensure it prompts for a type. Current logic handles this.
    }
    if (!isOpen) {
      // Reset state when modal is closed
      setTimeout(() => {
        setSelectedType(null);
        form.reset({ scores: {}, comments: '' });
      }, 300); // Delay to allow animation
    }
  }, [isOpen, selectedType, form]);


  useEffect(() => {
    // Reset form and recalculate initial score when the evaluation type changes
    const newScores = criteria.reduce((acc, crit) => ({ ...acc, [crit.id]: 3 }), {});
    form.reset({
      scores: newScores,
      comments: '',
    });
    
    const initialWeightedSum = criteria.reduce((total, criterion) => {
        return total + 3 * criterion.weight;
    }, 0);
    setTotalScore(initialWeightedSum);

  }, [selectedType, criteria, form]);


  useEffect(() => {
    const subscription = form.watch((value) => {
      const currentScores = value.scores;
      if (!currentScores || !criteria || criteria.length === 0) {
        setTotalScore(0);
        return;
      }
  
      const weightedScoreSum = criteria.reduce((total, criterion) => {
        const score = currentScores[criterion.id] || 0;
        return total + score * criterion.weight;
      }, 0);

      setTotalScore(weightedScoreSum);
    });
    return () => subscription.unsubscribe();
  }, [form, criteria]);


  async function onSubmit(values: EvaluationFormValues) {
    if (!user || !firestore || !provider || !selectedType) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la evaluación. Faltan datos.',
      });
      return;
    }

    setIsSubmitting(true);

    const dataToSave = {
      providerId: provider.id,
      evaluatorId: user.uid,
      evaluatorName: user.displayName || user.email,
      evaluationType: selectedType,
      scores: values.scores,
      totalScore: totalScore,
      comments: values.comments || '',
      createdAt: serverTimestamp(),
    };

    const evaluationsCollection = collection(
      firestore,
      'providers',
      provider.id,
      'evaluations'
    );

    addDoc(evaluationsCollection, dataToSave)
      .then(() => {
        toast({
          title: 'Evaluación Guardada',
          description: `Se ha guardado la evaluación para ${provider?.businessName}.`,
        });
        onClose();
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: evaluationsCollection.path,
          operation: 'create',
          requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  const handleClose = () => {
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-[600px]"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {!provider ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !selectedType ? (
          <>
            <DialogHeader>
              <DialogTitle>Seleccionar Tipo de Evaluación</DialogTitle>
              <DialogDescription>
                Elige qué tipo de evaluación deseas realizar para <strong>{provider.businessName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {(Object.keys(EVALUATION_TYPE_NAMES) as EvaluationType[]).map((key) => (
                <Button 
                  key={key} 
                  variant="outline" 
                  className="justify-start h-auto py-3 text-left"
                  onClick={() => setSelectedType(key)}
                >
                    <span className="font-semibold">{EVALUATION_TYPE_NAMES[key]}</span>
                </Button>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{EVALUATION_TYPE_NAMES[selectedType]}</DialogTitle>
              <DialogDescription>
                Evalúa a <strong>{provider.businessName}</strong> en una escala de 1 a 5.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-4">
                  {criteria.map((criterion) => (
                    <FormField
                      key={criterion.id}
                      control={form.control}
                      name={`scores.${criterion.id}` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {criterion.label}{' '}
                            <span className="text-muted-foreground">
                              ({(criterion.weight * 100).toFixed(0)}%)
                            </span>
                          </FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-8 text-center font-bold">
                              {field.value}
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comentarios Adicionales</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Añade tus observaciones aquí..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center justify-end gap-4 rounded-lg bg-muted/50 p-4">
                  <span className="text-lg font-semibold">Puntaje Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {totalScore.toFixed(2)} / 5.00
                  </span>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar Evaluación
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
