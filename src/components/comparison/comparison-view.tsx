'use client';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  WithId,
} from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import React, { useMemo, useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, TrendingUp, Info, Mail, Send, Eye, ClipboardCheck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  EVALUATION_TYPES,
  getCriteriaForType,
  type EvaluationType,
  requiresActionPlan,
  getPerformanceStatus,
} from '@/lib/evaluations';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { notifyProviderEvaluationFailed } from '@/actions/email';
import { EvaluationDetailModal } from '../evaluations/evaluation-detail-modal';

interface Provider {
  id: string;
  businessName: string;
  categoryIds?: string[];
  documentNumber: string;
  email: string;
  criticalityLevel?: 'Crítico' | 'No Crítico';
}

interface Evaluation {
  id: string;
  providerId: string;
  evaluationType: EvaluationType;
  totalScore: number;
  scores: Record<string, number>;
  createdAt: Timestamp;
  isActionPlanRequired?: boolean;
  improvementCommitment?: string;
  commitmentSubmittedAt?: Timestamp;
  improvementCommitments?: Record<string, string>;
  comments: string;
}

interface ComparisonViewProps {
  categoryId: string;
}

function useProvidersInCatergory(categoryId: string) {
  const firestore = useFirestore();
  const providersQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'providers'),
            where('categoryIds', 'array-contains', categoryId)
          )
        : null,
    [firestore, categoryId]
  );
  return useCollection<Provider>(providersQuery);
}

function useProviderEvaluations(providerId: string) {
  const firestore = useFirestore();
  const evaluationsQuery = useMemoFirebase(
    () =>
      firestore
        ? collection(firestore, 'providers', providerId, 'evaluations')
        : null,
    [firestore, providerId]
  );
  return useCollection<Evaluation>(evaluationsQuery);
}

const EvaluationScoreCard = ({ evaluations, provider }: { evaluations: WithId<Evaluation>[] | null, provider: Provider }) => {
  const latestEvaluations = useMemo(() => {
    if (!evaluations) return {};

    const latest: Partial<Record<EvaluationType, WithId<Evaluation>>> = {};
    for (const ev of evaluations) {
      if (!latest[ev.evaluationType] || ev.createdAt.toMillis() > latest[ev.evaluationType]!.createdAt.toMillis()) {
        latest[ev.evaluationType] = ev;
      }
    }
    return latest;
  }, [evaluations]);

  const hasFailingScores = useMemo(() => {
      return Object.values(latestEvaluations).some(ev => requiresActionPlan(ev!.totalScore));
  }, [latestEvaluations]);

  if (Object.keys(latestEvaluations).length === 0) {
    return <p className="text-xs text-muted-foreground py-4 text-center border-2 border-dashed rounded-md">Sin historial de desempeño.</p>;
  }

  return (
    <div className="space-y-6">
      {hasFailingScores && (
          <div className="bg-destructive/10 border border-destructive/20 p-2 rounded flex items-start gap-2 animate-pulse">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-[10px] text-destructive font-bold uppercase leading-tight">Acción Correctiva ISO 9001 Obligatoria</p>
          </div>
      )}

      {(Object.keys(latestEvaluations) as EvaluationType[]).map((type) => {
        const evaluation = latestEvaluations[type];
        if (!evaluation) return null;
        
        const isCritical = provider.criticalityLevel === 'Crítico';
        const criteria = getCriteriaForType(evaluation.evaluationType, isCritical);
        const status = getPerformanceStatus(evaluation.totalScore);
        
        const chartData = criteria.map(crit => ({
            name: crit.label,
            Puntaje: evaluation.scores[crit.id] || 0
        }));

        const isLow = requiresActionPlan(evaluation.totalScore);

        return (
          <div key={type} className="border-b last:border-0 pb-4">
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                    <h4 className="font-bold text-[10px] uppercase text-muted-foreground">{EVALUATION_TYPES[type]}</h4>
                    <Badge variant="outline" className={cn("w-fit text-[8px] h-4 py-0 mt-1 uppercase", status.color)}>
                        {status.label}
                    </Badge>
                </div>
                <Badge variant={isLow ? "destructive" : "default"} className="h-5 text-[10px]">
                    {(evaluation.totalScore * 20).toFixed(0)}%
                </Badge>
            </div>
            
            <div className="flex items-baseline gap-1 mb-3">
                 <p className={cn("text-2xl font-black", isLow ? "text-destructive" : "text-primary")}>
                    {evaluation.totalScore.toFixed(2)}
                 </p>
                 <p className="text-[10px] text-muted-foreground">/ 5.00</p>
            </div>

            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis type="category" dataKey="name" width={10} axisLine={false} tickLine={false} hide/>
                <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))'}} 
                    contentStyle={{fontSize: '10px', borderRadius: '8px'}}
                />
                <Bar dataKey="Puntaje" radius={[0, 4, 4, 0]} barSize={10}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.Puntaje < 3.5 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
};

const ProviderComparisonCard = ({ provider }: { provider: WithId<Provider> }) => {
  const { toast } = useToast();
  const [isNotifying, setIsNotifying] = useState(false);
  const [selectedEval, setSelectedEval] = useState<WithId<Evaluation> | null>(null);
  
  const {
    data: evaluations,
    isLoading,
    error,
  } = useProviderEvaluations(provider.id);

  const latestEvaluation = useMemo(() => {
      if (!evaluations || evaluations.length === 0) return null;
      return [...evaluations].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())[0];
  }, [evaluations]);

  const isAtRisk = useMemo(() => {
      if (!latestEvaluation) return false;
      return requiresActionPlan(latestEvaluation.totalScore);
  }, [latestEvaluation]);

  const hasCommitment = useMemo(() => {
      return !!latestEvaluation?.commitmentSubmittedAt;
  }, [latestEvaluation]);

  const handleNotifyFailure = async () => {
      if (!latestEvaluation) return;
      setIsNotifying(true);
      try {
          const result = await notifyProviderEvaluationFailed({
              providerEmail: provider.email,
              providerName: provider.businessName,
              score: latestEvaluation.totalScore,
              evaluationType: EVALUATION_TYPES[latestEvaluation.evaluationType] || latestEvaluation.evaluationType
          });
          if (result.success) {
              toast({ title: 'Hallazgos Notificados', description: 'Se ha enviado un correo al proveedor con los detalles técnicos para su mejora.' });
          } else {
              throw new Error(result.error);
          }
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Error al Notificar', description: e.message });
      } finally {
          setIsNotifying(false);
      }
  };

  return (
    <>
        <Card className={cn(
            "flex flex-col border-t-4 transition-all hover:shadow-md",
            isAtRisk ? "border-t-destructive bg-destructive/5" : "border-t-primary"
        )}>
        <CardHeader className="pb-2">
            <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-lg leading-tight">{provider.businessName}</CardTitle>
                <Badge variant={provider.criticalityLevel === 'Crítico' ? 'destructive' : 'outline'} className="text-[9px] shrink-0">
                    {provider.criticalityLevel || 'No asignado'}
                </Badge>
            </div>
            <CardDescription className="text-[10px] uppercase font-mono">NIT: {provider.documentNumber}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            {error && <p className="text-destructive text-xs">Error al cargar datos ISO.</p>}
            {!isLoading && !error && <EvaluationScoreCard evaluations={evaluations} provider={provider} />}
        </CardContent>
        <CardFooter className="pt-2 flex flex-col gap-2">
            {isAtRisk ? (
                <div className="space-y-2 w-full">
                    {hasCommitment ? (
                        <div className="w-full flex items-center justify-center gap-2 text-primary text-[10px] font-bold bg-primary/10 py-2 rounded border border-primary/20">
                            <ClipboardCheck className="h-3 w-3" /> COMPROMISO RADICADO
                        </div>
                    ) : (
                        <Alert variant="destructive" className="py-2 px-3 border-dashed">
                            <AlertDescription className="text-[10px] font-bold">
                                RIESGO ISO: DESEMPEÑO INSUFICIENTE.
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-[10px] h-8 font-bold border-destructive text-destructive hover:bg-destructive hover:text-white"
                            onClick={handleNotifyFailure}
                            disabled={isNotifying}
                        >
                            {isNotifying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Mail className="h-3 w-3 mr-1" />}
                            Notificar
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-[10px] h-8 font-bold"
                            onClick={() => setSelectedEval(latestEvaluation)}
                        >
                            <Eye className="h-3 w-3 mr-1" />
                            Detalle ISO
                        </Button>
                    </div>
                </div>
            ) : evaluations && evaluations.length > 0 && (
                <div className="w-full space-y-2">
                    <div className="w-full flex items-center justify-center gap-2 text-green-600 text-[10px] font-bold bg-green-50 py-1 rounded border border-green-100">
                        <CheckCircle2 className="h-3 w-3" /> CUMPLE ISO 9001
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[10px] h-8 font-bold"
                        onClick={() => setSelectedEval(latestEvaluation)}
                    >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Última Auditoría
                    </Button>
                </div>
            )}
            
            <Button asChild variant={isAtRisk && !hasCommitment ? "destructive" : "default"} className="w-full text-xs font-bold uppercase tracking-tighter mt-2">
            <Link href={`/selection/new?name=${encodeURIComponent(provider.businessName)}&nit=${provider.documentNumber}&email=${provider.email}`}>
                {isAtRisk && !hasCommitment ? "Sustituir Proveedor (Acción Correctiva)" : "Nuevo Proceso de Selección"}
            </Link>
            </Button>
        </CardFooter>
        </Card>

        {selectedEval && (
            <EvaluationDetailModal
                isOpen={!!selectedEval}
                onClose={() => setSelectedEval(null)}
                evaluation={selectedEval}
                isProviderView={false}
            />
        )}
    </>
  );
};

export function ComparisonView({ categoryId }: ComparisonViewProps) {
  const {
    data: providers,
    isLoading,
    error,
  } = useProvidersInCatergory(categoryId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error de Acceso</AlertTitle>
        <AlertDescription>
          No se pudieron consultar los registros de desempeño para esta categoría.
        </AlertDescription>
      </Alert>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/30">
        <TrendingUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Sin proveedores en esta categoría</h3>
        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
          Asigna proveedores a esta categoría operativa para comparar su desempeño histórico.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="bg-primary/5 p-4 rounded-lg border flex items-center gap-4">
            <div className="bg-white p-2 rounded shadow-sm">
                <Info className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Control ISO 9001:</strong> Esta vista permite el re-evaluación periódica. Si un proveedor tiene hallazgos, el administrador debe notificarlo para que este radique su compromiso de mejora. De no haber mejora, se procede a la sustitución.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
                <ProviderComparisonCard key={provider.id} provider={provider} />
            ))}
        </div>
    </div>
  );
}
