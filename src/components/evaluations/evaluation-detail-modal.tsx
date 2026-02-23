
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
import { useState, useMemo, useEffect } from 'react';
import { Loader2, ClipboardCheck, MessageSquareText, ShieldAlert, Send, AlertTriangle } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Evaluation {
  id: string;
  providerId: string;
  evaluationType: string;
  totalScore: number;
  scores: Record<string, number>;
  comments: string;
  improvementCommitment?: string; // Legacy field for summary
  improvementCommitments?: Record<string, string>; // New granular field
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
  
  // State for granular commitments: Map of criterionId -> commitment text
  const [commitments, setCommitments] = useState<Record<string, string>>(
    evaluation.improvementCommitments || {}
  );
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
  const isAlreadySubmitted = !!evaluation.commitmentSubmittedAt;

  // Function to handle change in specific commitment
  const handleCommitmentChange = (criterionId: string, value: string) => {
    setCommitments(prev => ({
      ...prev,
      [criterionId]: value
    }));
  };

  const handleSubmitCommitment = async () => {
    if (!firestore) return;
    
    // Validate that all low-score criteria have a commitment
    const lowScoreCriteria = criteria.filter(crit => (evaluation.scores[crit.id] || 0) < 3.5);
    const missingCommitments = lowScoreCriteria.some(crit => !commitments[crit.id]?.trim());

    if (missingCommitments) {
      toast({
        variant: 'destructive',
        title: 'Información Faltante',
        description: 'Debe radicar un compromiso para cada uno de los criterios con puntaje bajo.'
      });
      return;
    }

    setIsSubmitting(true);
    const evalRef = doc(firestore, 'providers', evaluation.providerId, 'evaluations', evaluation.id);
    
    try {
      await updateDoc(evalRef, {
        improvementCommitments: commitments,
        // Also save a concatenated summary for compatibility with the card view
        improvementCommitment: Object.values(commitments).filter(Boolean).join(' | '),
        commitmentSubmittedAt: serverTimestamp(),
      });
      toast({ 
        title: 'Compromiso Radicado', 
        description: 'Su plan de mejora detallado ha sido registrado exitosamente.' 
      });
      onClose();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo registrar el compromiso.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] flex flex-col p-0 overflow-hidden border-t-8 border-t-primary">
        <DialogHeader className="p-6 border-b shrink-0 bg-muted/20">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                    Detalle de Auditoría ISO 9001
                </DialogTitle>
                <DialogDescription className="font-bold text-primary">
                    {EVALUATION_TYPES[evaluation.evaluationType as any]}
                </DialogDescription>
            </div>
            <div className="text-right">
                <Badge variant={needsAction ? "destructive" : "default"} className="text-xl py-1 px-4 mb-1">
                    {(evaluation.totalScore * 20).toFixed(0)}%
                </Badge>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Resultado Final</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-grow">
          <div className="p-6 space-y-8 pb-12">
            {/* Scores Table with commitments integration */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-bold text-xs uppercase text-muted-foreground flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" /> Calificación por Criterio
                    </h4>
                    {needsAction && (
                        <Badge variant="outline" className="text-destructive border-destructive bg-destructive/5 animate-pulse text-[9px] uppercase">
                            Hallazgos Detectados
                        </Badge>
                    )}
                </div>
                
                <div className="grid gap-4">
                    {criteria.map((crit) => {
                        const score = evaluation.scores[crit.id] || 0;
                        const isLow = score < 3.5;
                        
                        return (
                            <div key={crit.id} className={cn(
                                "flex flex-col p-4 rounded-xl border transition-all shadow-sm",
                                isLow ? "border-destructive/30 bg-destructive/5" : "bg-card"
                            )}>
                                <div className="flex justify-between items-center mb-3">
                                    <div className="space-y-0.5">
                                        <span className="font-bold text-sm text-foreground">{crit.label}</span>
                                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Peso Relativo: {(crit.defaultWeight * 100).toFixed(0)}%</p>
                                    </div>
                                    <div className={cn(
                                        "w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-lg shrink-0",
                                        isLow ? "border-destructive bg-white text-destructive shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-primary bg-muted/30 text-primary"
                                    )}>
                                        {score}
                                    </div>
                                </div>

                                {isLow && (
                                    <div className="mt-3 space-y-2 border-t pt-3 border-destructive/10">
                                        <div className="flex items-center gap-2 text-destructive">
                                            <AlertTriangle className="h-3 w-3" />
                                            <Label className="text-[10px] font-black uppercase tracking-tight">Acción Correctiva Requerida:</Label>
                                        </div>
                                        
                                        {isProviderView && !isAlreadySubmitted ? (
                                            <Textarea
                                                placeholder="Especifique las medidas que tomará su empresa para mejorar este indicador..."
                                                className="text-xs bg-white border-destructive/20 focus-visible:ring-destructive"
                                                value={commitments[crit.id] || ''}
                                                onChange={(e) => handleCommitmentChange(crit.id, e.target.value)}
                                            />
                                        ) : (
                                            <div className="p-3 rounded-lg bg-white/50 border border-destructive/10 text-xs italic text-foreground">
                                                {commitments[crit.id] ? (
                                                    <p>"{commitments[crit.id]}"</p>
                                                ) : (
                                                    <p className="text-muted-foreground">No se ha radicado compromiso para este punto.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Evaluator Comments */}
            <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase text-muted-foreground">Observaciones del Auditor</h4>
                <div className="p-4 rounded-lg bg-muted border text-sm italic text-muted-foreground shadow-inner">
                    {evaluation.comments || 'Sin observaciones adicionales registradas.'}
                </div>
            </div>

            {/* Status Info */}
            {isAlreadySubmitted && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <MessageSquareText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-primary uppercase">Compromiso de Mejora Radicado</p>
                            <p className="text-[10px] text-muted-foreground">Este documento forma parte integral del historial de cumplimiento del proveedor.</p>
                        </div>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground bg-white px-2 py-1 rounded border">
                        {format(evaluation.commitmentSubmittedAt?.toDate() || new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t shrink-0 bg-muted/10">
          <Button variant="outline" onClick={onClose} className="font-bold">Cerrar Ventana</Button>
          {isProviderView && needsAction && !isAlreadySubmitted && (
              <Button onClick={handleSubmitCommitment} disabled={isSubmitting} className="min-w-[200px] shadow-lg">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Radicar Compromiso ISO 9001
              </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
