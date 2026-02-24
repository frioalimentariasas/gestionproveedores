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
import { EVALUATION_TYPES, getCriteriaForType, requiresActionPlan, getPerformanceStatus } from '@/lib/evaluations';
import { useFirestore, useDoc, useMemoFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import { Loader2, ClipboardCheck, MessageSquareText, Send, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { notifyAdminOfCommitmentSubmitted } from '@/actions/email';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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
  const status = getPerformanceStatus(evaluation.totalScore);

  const handleCommitmentChange = (criterionId: string, value: string) => {
    setCommitments(prev => ({
      ...prev,
      [criterionId]: value
    }));
  };

  const handleSubmitCommitment = async () => {
    if (!firestore || !providerData) return;
    
    const lowScoreCriteria = criteria.filter(crit => (evaluation.scores[crit.id] || 0) < 3.5);
    const missingCommitments = lowScoreCriteria.some(crit => !commitments[crit.id]?.trim());

    if (missingCommitments) {
      toast({
        variant: 'destructive',
        title: 'Información Faltante',
        description: 'Debe radicar un compromiso de mejora para CADA criterio con hallazgos (en rojo).'
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
        await updateDoc(evalRef, updateData);
        
        notifyAdminOfCommitmentSubmitted({
            businessName: providerData.businessName,
            providerEmail: providerData.email,
            evaluationType: EVALUATION_TYPES[evaluation.evaluationType as keyof typeof EVALUATION_TYPES] || evaluation.evaluationType
        }).catch(console.error);

        toast({ 
            title: 'Compromiso Radicado', 
            description: 'Su plan de mejora detallado ha sido registrado bajo los estándares ISO 9001.' 
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
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0 overflow-hidden border-t-8 border-t-primary">
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
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <Badge variant={needsAction ? "destructive" : "default"} className="text-xl py-1 px-4 mb-1">
                        {(evaluation.totalScore * 20).toFixed(0)}%
                    </Badge>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Cumplimiento Final</p>
                </div>
                <div className="text-right border-l pl-4">
                    <Badge variant="outline" className={cn("text-xs font-black uppercase py-1", status.color)}>
                        {status.label}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono mt-1">Estatus Normativo</p>
                </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-6 bg-muted/5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2 border-primary/10">
                            <h4 className="font-bold text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <ClipboardCheck className="h-4 w-4" /> Calificación por Criterio
                            </h4>
                            {needsAction && (
                                <Badge variant="outline" className="text-destructive border-destructive bg-destructive/5 animate-pulse text-[9px] uppercase font-bold">
                                    Acción Correctiva Requerida (ISO 10.2)
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
                                                    Ponderación: {(crit.defaultWeight * 100).toFixed(0)}%
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
                                                    <Label className="text-[11px] font-black uppercase tracking-tight">Tratamiento del Hallazgo:</Label>
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
                                                            <p className="text-muted-foreground">Pendiente de radicación por el proveedor.</p>
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

                    <div className="space-y-3">
                        <h4 className="font-bold text-xs uppercase text-muted-foreground">Notas de Auditoría Interna</h4>
                        <div className="p-4 rounded-lg bg-muted/50 border text-sm italic text-muted-foreground">
                            {evaluation.comments || 'Sin observaciones adicionales registradas.'}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="border-t-4 border-t-accent shadow-md sticky top-0">
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-accent" />
                                Guía de Decisión ISO 9001
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-[10px] space-y-3">
                            <div className="flex justify-between items-center border-b pb-1 font-bold">
                                <span>Puntaje (%)</span>
                                <span>Decisión Calidad</span>
                            </div>
                            <div className="flex justify-between items-center text-green-700 font-medium">
                                <span>&ge; 85% (4.25)</span>
                                <span>Sobresaliente</span>
                            </div>
                            <div className="flex justify-between items-center text-blue-700 font-medium">
                                <span>70 - 84% (3.5)</span>
                                <span>Satisfactorio</span>
                            </div>
                            <div className="flex justify-between items-center text-yellow-700 font-medium">
                                <span>60 - 69% (3.0)</span>
                                <span>En Observación *</span>
                            </div>
                            <div className="flex justify-between items-center text-red-700 font-medium">
                                <span>&lt; 60%</span>
                                <span>Crítico *</span>
                            </div>
                            <div className="mt-4 p-2 bg-muted/50 rounded border text-muted-foreground italic leading-tight">
                                * Nota: Según ISO 9001 (8.4), todo puntaje &lt; 70% requiere un plan de mejora obligatorio para asegurar la continuidad del suministro.
                            </div>
                        </CardContent>
                    </Card>

                    {isAlreadySubmitted && (
                        <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 space-y-3 shadow-sm">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <p className="text-xs font-black text-primary uppercase">Trazabilidad de Calidad</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                El plan de acción ha sido registrado satisfactoriamente. Fecha de radicación oficial:
                            </p>
                            <p className="text-[10px] font-mono font-bold text-center bg-white px-3 py-1 rounded-full border">
                                {format(evaluation.commitmentSubmittedAt?.toDate() || new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>

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
