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
import { EVALUATION_TYPES, getCriteriaForType, requiresActionPlan } from '@/lib/evaluations';
import { useFirestore, useDoc, useMemoFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import { Loader2, ClipboardCheck, MessageSquareText, Send, AlertTriangle } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { notifyAdminOfCommitmentSubmitted } from '@/actions/email';

interface Evaluation {
  id: string;
  providerId: string;
  evaluationType: string;
  totalScore: number;
  scores: Record<string, number>;
  comments: string;
  improvementCommitment?: string;
  improvementCommitments?: Record<string, string>;
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

  const handleCommitmentChange = (criterionId: string, value: string) => {
    setCommitments(prev => ({
      ...prev,
      [criterionId]: value
    }));
  };

  const handleSubmitCommitment = async () => {
    if (!firestore || !providerData) return;
    
    // Validate that all low-score criteria have a commitment
    const lowScoreCriteria = criteria.filter(crit => (evaluation.scores[crit.id] || 0) < 3.5);
    const missingCommitments = lowScoreCriteria.some(crit => !commitments[crit.id]?.trim());

    if (missingCommitments) {
      toast({
        variant: 'destructive',
        title: 'Información Faltante',
        description: 'Debe radicar un compromiso de mejora para CADA criterio marcado en rojo.'
      });
      return;
    }

    setIsSubmitting(true);
    const evalRef = doc(firestore, 'providers', evaluation.providerId, 'evaluations', evaluation.id);
    
    const updateData = {
      improvementCommitments: commitments,
      improvementCommitment: Object.values(commitments).filter(Boolean).join(' | '),
      commitmentSubmittedAt: serverTimestamp(),
    };

    try {
        // Perform the update
        await updateDoc(evalRef, updateData);
        
        // Notify admins
        notifyAdminOfCommitmentSubmitted({
            businessName: providerData.businessName,
            providerEmail: providerData.email,
            evaluationType: EVALUATION_TYPES[evaluation.evaluationType as keyof typeof EVALUATION_TYPES] || evaluation.evaluationType
        }).catch(console.error);

        toast({ 
            title: 'Compromiso Radicado', 
            description: 'Su plan de mejora detallado ha sido registrado exitosamente y los administradores han sido notificados.' 
        });
        onClose();
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
          path: evalRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] h-[90vh] flex flex-col p-0 overflow-hidden border-t-8 border-t-primary">
        {/* Cabecera Fija */}
        <DialogHeader className="p-6 border-b shrink-0 bg-muted/20">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                    Detalle de Auditoría ISO 9001
                </DialogTitle>
                <DialogDescription className="font-bold text-primary">
                    {EVALUATION_TYPES[evaluation.evaluationType as keyof typeof EVALUATION_TYPES] || evaluation.evaluationType}
                </DialogDescription>
            </div>
            <div className="text-right">
                <Badge variant={needsAction ? "destructive" : "default"} className="text-xl py-1 px-4 mb-1">
                    {(evaluation.totalScore * 20).toFixed(0)}%
                </Badge>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Cumplimiento Final</p>
            </div>
          </div>
        </DialogHeader>

        {/* Área de Contenido con Scroll Independiente */}
        <div className="flex-grow overflow-y-auto p-6 space-y-8 pb-12 bg-muted/5">
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2 border-primary/10">
                    <h4 className="font-bold text-xs uppercase text-muted-foreground flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" /> Calificación por Criterio
                    </h4>
                    {needsAction && (
                        <Badge variant="outline" className="text-destructive border-destructive bg-destructive/5 animate-pulse text-[9px] uppercase font-bold">
                            Hallazgos Críticos Detectados
                        </Badge>
                    )}
                </div>
                
                <div className="grid gap-4">
                    {criteria.map((crit) => {
                        const score = evaluation.scores[crit.id] || 0;
                        const isLow = score < 3.5;
                        
                        return (
                            <div key={crit.id} className={cn(
                                "flex flex-col p-5 rounded-xl border transition-all shadow-sm",
                                isLow ? "border-destructive/40 bg-destructive/5" : "bg-card border-primary/5"
                            )}>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="space-y-1">
                                        <span className={cn(
                                            "font-bold text-sm",
                                            isLow ? "text-destructive" : "text-foreground"
                                        )}>
                                            {crit.label}
                                        </span>
                                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                                            Peso Relativo: {(crit.defaultWeight * 100).toFixed(0)}%
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-xl shrink-0 transition-transform hover:scale-105",
                                        isLow 
                                            ? "border-destructive bg-white text-destructive shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                                            : "border-primary bg-muted/30 text-primary"
                                    )}>
                                        {score.toFixed(1)}
                                    </div>
                                </div>

                                {isLow && (
                                    <div className="mt-2 space-y-3 border-t pt-4 border-destructive/20">
                                        <div className="flex items-center gap-2 text-destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <Label className="text-[11px] font-black uppercase tracking-tight">Acción Correctiva Requerida:</Label>
                                        </div>
                                        
                                        {isProviderView && !isAlreadySubmitted ? (
                                            <Textarea
                                                placeholder="Describa el compromiso de mejora para este hallazgo específico..."
                                                className="text-sm bg-white border-destructive/30 focus-visible:ring-destructive min-h-[100px]"
                                                value={commitments[crit.id] || ''}
                                                onChange={(e) => handleCommitmentChange(crit.id, e.target.value)}
                                            />
                                        ) : (
                                            <div className="p-4 rounded-lg bg-white/60 border border-destructive/10 text-sm italic text-foreground shadow-inner">
                                                {commitments[crit.id] ? (
                                                    <p>"{commitments[crit.id]}"</p>
                                                ) : (
                                                    <p className="text-muted-foreground">Pendiente de radicación de compromiso por parte del proveedor.</p>
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

            {/* Observaciones del Auditor */}
            <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase text-muted-foreground">Observaciones de la Auditoría</h4>
                <div className="p-4 rounded-lg bg-muted/50 border text-sm italic text-muted-foreground">
                    {evaluation.comments || 'Sin observaciones adicionales registradas por el auditor.'}
                </div>
            </div>

            {/* Status Info */}
            {isAlreadySubmitted && (
                <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <MessageSquareText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-primary uppercase">Compromiso Radicado</p>
                            <p className="text-[11px] text-muted-foreground">El plan de acción ha sido registrado en el sistema para trazabilidad ISO.</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-mono font-bold text-muted-foreground bg-white px-3 py-1 rounded-full border">
                            {format(evaluation.commitmentSubmittedAt?.toDate() || new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* Pie de Página Fijo */}
        <DialogFooter className="p-6 border-t shrink-0 bg-background shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)]">
          <Button variant="outline" onClick={onClose} className="font-bold">Cerrar Detalle</Button>
          {isProviderView && needsAction && !isAlreadySubmitted && (
              <Button onClick={handleSubmitCommitment} disabled={isSubmitting} className="min-w-[220px] shadow-lg">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Radicar Compromiso ISO 9001
              </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}