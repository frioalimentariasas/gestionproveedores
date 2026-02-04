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
import { useFirestore, useUser } from '@/firebase';
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
  evaluationType: EvaluationType | null;
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
  evaluationType,
}: EvaluationModalProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Moved hooks to be unconditional
  const criteria = useMemo(
    () => (evaluationType ? EVALUATION_CRITERIA[evaluationType] : []),
    [evaluationType]
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

  const watchedScores = form.watch('scores');

  const totalScore = useMemo(() => {
    if (!watchedScores || criteria.length === 0) return 0;
    return criteria.reduce((total, criterion) => {
      const score = watchedScores[criterion.id] || 0;
      return total + score * criterion.weight;
    }, 0);
  }, [watchedScores, criteria]);

  useEffect(() => {
    // Reset form when the modal is opened with new data
    if (isOpen) {
      form.reset({
        scores: defaultScores,
        comments: '',
      });
    }
  }, [isOpen, defaultScores, form]);

  async function onSubmit(values: EvaluationFormValues) {
    if (!user || !firestore || !provider || !evaluationType) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la evaluación. Faltan datos.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const evaluationsCollection = collection(
        firestore,
        'providers',
        provider.id,
        'evaluations'
      );
      await addDoc(evaluationsCollection, {
        providerId: provider.id,
        evaluatorId: user.uid,
        evaluatorName: user.displayName || user.email,
        evaluationType: evaluationType,
        scores: values.scores,
        totalScore: totalScore,
        comments: values.comments || '',
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Evaluación Guardada',
        description: `Se ha guardado la evaluación para ${provider.businessName}.`,
      });
      onClose();
    } catch (error) {
      console.error('Error saving evaluation: ', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description:
          'No se pudo guardar la evaluación. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Conditional rendering is now inside the component's return statement
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        {provider && evaluationType ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {EVALUATION_TYPE_NAMES[evaluationType]}
              </DialogTitle>
              <DialogDescription>
                Evalúa a <strong>{provider.businessName}</strong> en una escala
                de 1 a 5.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4">
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
                                defaultValue={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="font-bold w-8 text-center">
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

                <div className="flex justify-end items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <span className="text-lg font-semibold">Puntaje Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {totalScore.toFixed(2)} / 5.00
                  </span>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
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
        ) : (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
