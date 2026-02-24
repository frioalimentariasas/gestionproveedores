'use client';

import {
  collection,
  Timestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { Button } from '@/components/ui/button';
import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Star,
  Calendar,
  FileText,
  FileBadge,
  Eye,
  MessageSquareQuote,
  CheckCircle2,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  EVALUATION_TYPES,
  type EvaluationType,
  requiresActionPlan,
} from '@/lib/evaluations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EvaluationDetailModal } from '@/components/evaluations/evaluation-detail-modal';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Evaluation {
  id: string;
  providerId: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluationType: EvaluationType;
  scores: Record<string, number>;
  totalScore: number;
  comments: string;
  improvementCommitment?: string;
  commitmentSubmittedAt?: Timestamp;
  createdAt: Timestamp;
  evidenceFileUrl?: string;
  fracttalOrderIds?: string;
}

export default function ProviderEvaluationsPage() {
  const params = useParams();
  const providerId = params.providerId as string;
  const firestore = useFirestore();
  const router = useRouter();
  const { isAdmin, isLoading: isRoleLoading } = useRole();
  const { toast } = useToast();
  const { user } = useUser();
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  const evaluationsCollectionRef = useMemoFirebase(
    () =>
      firestore && providerId && isAdmin
        ? collection(firestore, 'providers', providerId, 'evaluations')
        : null,
    [firestore, providerId, isAdmin]
  );

  const {
    data: evaluations,
    isLoading: isEvaluationsLoading,
    error,
  } = useCollection<Evaluation>(evaluationsCollectionRef);

  const sortedEvaluations = useMemo(() => {
    if (!evaluations) return [];
    return [...evaluations].sort((a, b) => {
      const dateA = a.createdAt?.toDate() ?? new Date(0);
      const dateB = b.createdAt?.toDate() ?? new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [evaluations]);

  useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isRoleLoading, router]);

  const handleDelete = async (evaluationId: string) => {
    if (!firestore || !providerId) return;

    try {
      await deleteDoc(
        doc(firestore, 'providers', providerId, 'evaluations', evaluationId)
      );
      toast({
        title: 'Evaluación eliminada',
        description: 'La evaluación ha sido eliminada correctamente.',
      });
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description:
          'No se pudo eliminar la evaluación. Por favor, inténtalo de nuevo.',
      });
    }
  };

  const isLoading = isRoleLoading || isEvaluationsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <p>No tienes permiso para ver esta página.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-destructive">
          Error al cargar las evaluaciones
        </h1>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={() => router.push('/providers')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto max-w-5xl p-4 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-center flex-grow">
            Historial de Desempeño ISO 9001
          </h1>
          <div className="w-24 hidden md:block"></div>
        </div>

        {sortedEvaluations && sortedEvaluations.length > 0 ? (
          <div className="space-y-6">
            {sortedEvaluations.map((evaluation) => {
              const needsAction = requiresActionPlan(evaluation.totalScore);
              
              return (
                <Card key={evaluation.id} className={cn(
                    "border-l-8",
                    needsAction ? "border-l-destructive" : "border-l-green-500"
                )}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex justify-between items-start flex-wrap gap-2">
                      <div className="space-y-1">
                        <span className="text-lg">{EVALUATION_TYPES[evaluation.evaluationType]}</span>
                        <div className="flex items-center text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                evaluation.totalScore > i
                                  ? 'fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-xl font-black text-foreground">
                            {evaluation.totalScore.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">/ 5.00</span>
                          </span>
                          <Badge variant={needsAction ? "destructive" : "default"} className="ml-4 h-6">
                             {(evaluation.totalScore * 20).toFixed(0)}% Cumplimiento
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="default" size="sm" onClick={() => setSelectedEvaluation(evaluation)} className="font-bold">
                            <Search className="h-4 w-4 mr-2" /> Detalle scores
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar esta evaluación?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará permanentemente los registros de desempeño del{' '}
                                {format(evaluation.createdAt.toDate(), 'dd/MM/yyyy')}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(evaluation.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardTitle>
                    <CardDescription className="flex items-center text-xs pt-1">
                      <Calendar className="mr-2 h-3 w-3" />
                      Auditoría por {evaluation.evaluatorName} el{' '}
                      {format(evaluation.createdAt.toDate(), 'dd MMMM, yyyy', {
                        locale: es,
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <h4 className="font-bold text-xs uppercase text-muted-foreground mb-1">Observaciones del Evaluador:</h4>
                        <p className="text-sm italic">
                        {evaluation.comments || 'Sin comentarios.'}
                        </p>
                    </div>

                    {evaluation.improvementCommitment ? (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px]">
                                <CheckCircle2 className="h-4 w-4" /> Compromiso ISO Radicado
                            </div>
                            <p className="text-[10px] text-muted-foreground italic text-right">
                                Consulte el plan de acción por cada criterio en el botón "Detalle scores".
                            </p>
                        </div>
                    ) : needsAction && (
                        <div className="flex items-center gap-2 text-destructive font-bold text-xs bg-destructive/5 p-3 rounded-lg animate-pulse border border-destructive/20">
                            <AlertTriangle className="h-4 w-4" />
                            PENDIENTE: EL PROVEEDOR DEBE RADICAR COMPROMISO DE MEJORA
                        </div>
                    )}
                  </CardContent>
                  {(evaluation.evidenceFileUrl ||
                    evaluation.fracttalOrderIds) && (
                    <CardFooter className="flex-col items-start gap-3 bg-muted/50 py-4 rounded-b-lg border-t">
                      <div className="flex items-center justify-between w-full">
                        <h4 className="font-bold text-xs uppercase text-muted-foreground">Soportes de Verificación:</h4>
                        <div className="flex gap-4">
                            {evaluation.evidenceFileUrl && (
                                <Button asChild variant="link" className="p-0 h-auto text-xs">
                                    <a href={evaluation.evidenceFileUrl} target="_blank" rel="noopener noreferrer">
                                        <FileText className="mr-1 h-3 w-3" /> Ver Documento PDF
                                    </a>
                                </Button>
                            )}
                        </div>
                      </div>
                      {evaluation.fracttalOrderIds && (
                        <div className="w-full">
                          <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase">
                             <FileBadge className="h-3 w-3" /> Órdenes de Compra/Servicio (Bitácora):
                          </p>
                          <p className="text-[10px] text-muted-foreground bg-background p-2 rounded border mt-1 font-mono">
                            {evaluation.fracttalOrderIds}
                          </p>
                        </div>
                      )}
                    </CardFooter>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/20">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Sin historial de desempeño</h3>
            <p className="text-muted-foreground mt-2">
              No se han registrado evaluaciones de calidad para este proveedor.
            </p>
          </div>
        )}

        {selectedEvaluation && (
            <EvaluationDetailModal
                isOpen={!!selectedEvaluation}
                onClose={() => setSelectedEvaluation(null)}
                evaluation={selectedEvaluation}
            />
        )}
      </div>
    </AuthGuard>
  );
}