
'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Loader2, ClipboardCheck, AlertTriangle, CheckCircle2, MessageSquareText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EVALUATION_TYPES, type EvaluationType, requiresActionPlan } from '@/lib/evaluations';
import { EvaluationDetailModal } from '@/components/evaluations/evaluation-detail-modal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Evaluation {
  id: string;
  providerId: string;
  evaluationType: EvaluationType;
  totalScore: number;
  scores: Record<string, number>;
  comments: string;
  improvementCommitment?: string;
  improvementCommitments?: Record<string, string>;
  commitmentSubmittedAt?: Timestamp;
  createdAt: Timestamp;
}

export default function ProviderEvaluationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  const evaluationsQuery = useMemoFirebase(
    () => (firestore && user ? query(
      collection(firestore, 'providers', user.uid, 'evaluations'),
      orderBy('createdAt', 'desc')
    ) : null),
    [firestore, user]
  );

  const { data: evaluations, isLoading: evaluationsLoading } = useCollection<Evaluation>(evaluationsQuery);

  const isLoading = isUserLoading || evaluationsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-4 py-12">
        <div className="flex flex-col items-center gap-2 mb-12">
            <div className="bg-primary/10 p-3 rounded-full mb-2">
                <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-center">
                Mis Evaluaciones de Desempeño
            </h1>
            <p className="text-center text-muted-foreground max-w-2xl">
                Consulte sus resultados históricos de cumplimiento bajo la norma ISO 9001. 
                Si tiene evaluaciones con puntajes bajos, deberá radicar sus compromisos de mejora aquí.
            </p>
        </div>

        {evaluations && evaluations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evaluations.map((ev) => {
              const needsAction = requiresActionPlan(ev.totalScore);
              const hasCommitment = !!ev.commitmentSubmittedAt;

              return (
                <Card key={ev.id} className={cn(
                    "flex flex-col border-t-4",
                    needsAction ? "border-t-destructive" : "border-t-primary"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base leading-tight">
                            {EVALUATION_TYPES[ev.evaluationType]}
                        </CardTitle>
                        <Badge variant={needsAction ? "destructive" : "default"}>
                            {(ev.totalScore * 20).toFixed(0)}%
                        </Badge>
                    </div>
                    <CardDescription className="text-[10px] uppercase font-mono">
                        Realizada el {format(ev.createdAt.toDate(), 'dd MMM, yyyy', { locale: es })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-primary">{ev.totalScore.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">/ 5.00</span>
                    </div>
                    
                    {needsAction ? (
                        <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-2">
                            <p className="text-[10px] font-bold text-destructive flex items-center gap-1 uppercase">
                                <AlertTriangle className="h-3 w-3" /> Requiere Compromiso ISO
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                Su puntaje es inferior al 70%. Debe radicar un plan de acción detallado por cada criterio afectado.
                            </p>
                        </div>
                    ) : (
                        <div className="p-3 rounded-lg bg-green-50 border border-green-100 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-[10px] font-bold text-green-700 uppercase">Cumplimiento Satisfactorio</span>
                        </div>
                    )}

                    {hasCommitment && (
                        <div className="p-3 rounded-lg bg-muted border flex flex-col gap-1">
                            <p className="text-[10px] font-bold flex items-center gap-1 uppercase">
                                <MessageSquareText className="h-3 w-3" /> Plan de Mejora Radicado
                            </p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 italic">
                                Plan de acción registrado en el sistema para auditoría.
                            </p>
                        </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                        className="w-full" 
                        variant={needsAction && !hasCommitment ? "destructive" : "outline"}
                        onClick={() => setSelectedEvaluation(ev)}
                    >
                        {needsAction && !hasCommitment ? "Radicar Planes de Acción" : "Ver Detalle Completo"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 border-2 border-dashed rounded-xl bg-muted/20">
            <ClipboardCheck className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Sin evaluaciones aún</h3>
            <p className="text-muted-foreground mt-2">Su historial de desempeño se mostrará aquí una vez el departamento de calidad realice una revisión.</p>
          </div>
        )}

        {selectedEvaluation && (
            <EvaluationDetailModal
                isOpen={!!selectedEvaluation}
                onClose={() => setSelectedEvaluation(null)}
                evaluation={selectedEvaluation}
                isProviderView={true}
            />
        )}
      </div>
    </AuthGuard>
  );
}
