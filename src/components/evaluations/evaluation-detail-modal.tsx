
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EVALUATION_TYPES, getCriteriaForType, requiresActionPlan } from '@/lib/evaluations';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import { Loader2, ClipboardCheck, MessageSquareText, ShieldAlert, Send } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Evaluation {
  id: string;
  providerId: string;
  evaluationType: string;
  totalScore: number;
  scores: Record<string, number>;
  comments: string;
  improvementCommitment?: string;
  commitmentSubmittedAt?: Timestamp;
  createdAt: Timestamp;
}

interface EvaluationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: Evaluation;
  isProviderView?: boolean;
}

export function EvaluationDetailModal({
  isOpen,
  onClose,
  evaluation,
  isProviderView = false,
}: EvaluationDetailModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [commitment, setCommitment] = useState(evaluation.improvementCommitment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const providerDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'providers', evaluation.providerId) : null),
    [firestore, evaluation.providerId]
  );
  const { data: providerData } = useDoc<any>(providerDocRef);

  const criteria = useMemo(() => {
    const isCritical = providerData?.criticalityLevel === 'Crítico';
    return getCriteriaForType(evaluation.evaluationType as any, isCritical);
  }, [evaluation.evaluationType, providerData]);

  const needsAction = requiresActionPlan(evaluation.totalScore);

  const handleSubmitCommitment = async () => {
    if (!firestore || !commitment.trim()) return;
    setIsSubmitting(true);
    const evalRef = doc(firestore, 'providers', evaluation.providerId, 'evaluations', evaluation.id);
    
    try {
      await updateDoc(evalRef, {
        improvementCommitment: commitment,
        commitmentSubmittedAt: serverTimestamp(),
      });
      toast({ title: 'Compromiso Radicado', description: 'Su compromiso de mejora ha sido registrado en el sistema ISO 9001.' });
      onClose();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo registrar el compromiso.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b shrink-0 bg-muted/20">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
                <DialogTitle className="text-xl">
                    Detalle de Evaluación ISO 9001
                </DialogTitle>
                <DialogDescription>
                    {EVALUATION_TYPES[evaluation.evaluationType as any]}
                </DialogDescription>
            </div>
            <Badge variant={needsAction ? "destructive" : "default"} className="text-lg py-1 px-4">
                {(evaluation.totalScore * 20).toFixed(0)}%
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-grow p-6">
          <div className="space-y-8 pb-4">
            {/* Scores Table */}
            <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase text-muted-foreground flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" /> Desglose de Criterios
                </h4>
                <div className="grid gap-2">
                    {criteria.map((crit) => (
                        <div key={crit.id} className="flex justify-between items-center p-3 rounded-lg border bg-card shadow-sm text-sm">
                            <span className="font-medium text-foreground">{crit.label}</span>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="font-mono bg-muted/50">{(crit.defaultWeight * 100).toFixed(0)}%</Badge>
                                <span className={cn(
                                    "font-black text-lg w-8 text-center",
                                    (evaluation.scores[crit.id] || 0) < 3.5 ? "text-destructive" : "text-primary"
                                )}>
                                    {evaluation.scores[crit.id] || 0}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Evaluator Comments */}
            <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-muted-foreground">Observaciones del Evaluador</h4>
                <div className="p-4 rounded-lg bg-muted border text-sm italic">
                    {evaluation.comments || 'Sin observaciones registradas.'}
                </div>
            </div>

            {/* Improvement Commitment Section */}
            {needsAction && (
                <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center gap-2 text-destructive">
                        <ShieldAlert className="h-5 w-5" />
                        <h4 className="font-black text-sm uppercase tracking-tight">Acción Correctiva Requerida</h4>
                    </div>
                    
                    {isProviderView && !evaluation.improvementCommitment ? (
                        <div className="space-y-3">
                            <Label htmlFor="commitment" className="font-bold">Compromiso de Mejora del Proveedor</Label>
                            <Textarea
                                id="commitment"
                                placeholder="Escriba aquí sus compromisos y planes de acción para mejorar los criterios evaluados con bajo puntaje..."
                                className="min-h-[120px]"
                                value={commitment}
                                onChange={(e) => setCommitment(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                * Este texto será revisado por el departamento de calidad en la próxima re-evaluación periódica.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Label className="font-bold text-primary">Estado del Compromiso de Mejora</Label>
                            {evaluation.improvementCommitment ? (
                                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                                    <p className="text-sm whitespace-pre-wrap">{evaluation.improvementCommitment}</p>
                                    <p className="text-[10px] text-muted-foreground text-right italic">
                                        Registrado el {format(evaluation.commitmentSubmittedAt?.toDate() || new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm italic">
                                    Aún no se ha radicado un plan de mejora por parte del proveedor.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t shrink-0 bg-muted/10">
          <Button variant="outline" onClick={onClose}>Cerrar Detalle</Button>
          {isProviderView && needsAction && !evaluation.improvementCommitment && (
              <Button onClick={handleSubmitCommitment} disabled={isSubmitting || !commitment.trim()}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Radicar Compromiso ISO 9001
              </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
