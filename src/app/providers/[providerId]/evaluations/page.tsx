
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
import { Loader2, ArrowLeft, Trash2, Star, Calendar } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  EVALUATION_TYPE_NAMES,
  type EvaluationType,
} from '@/lib/evaluations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

interface Evaluation {
  id: string;
  providerId: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluationType: EvaluationType;
  scores: Record<string, number>;
  totalScore: number;
  comments: string;
  createdAt: Timestamp;
}

export default function ProviderEvaluationsPage() {
  const params = useParams();
  const providerId = params.providerId as string;
  const firestore = useFirestore();
  const router = useRouter();
  const { isAdmin, isLoading: isRoleLoading } = useRole();
  const { toast } = useToast();
  const { user } = useUser();

  const evaluationsCollectionRef = useMemoFirebase(
    () =>
      firestore && providerId
        ? collection(firestore, 'providers', providerId, 'evaluations')
        : null,
    [firestore, providerId]
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
        <div className="mb-8 flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Historial de Evaluaciones
          </h1>
          <div className="w-24"></div> {/* Spacer */}
        </div>

        {sortedEvaluations && sortedEvaluations.length > 0 ? (
          <div className="space-y-4">
            {sortedEvaluations.map((evaluation) => (
              <Card key={evaluation.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <div>
                      {EVALUATION_TYPE_NAMES[evaluation.evaluationType]}
                      <div className="flex items-center text-yellow-500 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              evaluation.totalScore > i
                                ? 'fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-lg font-bold text-gray-700">
                          {evaluation.totalScore.toFixed(2)} / 5.00
                        </span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            ¿Estás seguro de eliminar esta evaluación?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará
                            permanentemente la evaluación del
                            {format(
                              evaluation.createdAt.toDate(),
                              'dd MMMM, yyyy',
                              { locale: es }
                            )}
                            .
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
                  </CardTitle>
                  <CardDescription className="flex items-center text-sm pt-2">
                    <Calendar className="mr-2 h-4 w-4" />
                    Realizada por {evaluation.evaluatorName} el{' '}
                    {format(evaluation.createdAt.toDate(), 'dd MMMM, yyyy', {
                      locale: es,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-2">Comentarios:</h4>
                  <p className="text-sm text-muted-foreground italic">
                    {evaluation.comments || 'Sin comentarios.'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold">No hay evaluaciones</h3>
            <p className="text-muted-foreground mt-2">
              Todavía no se ha realizado ninguna evaluación para este proveedor.
            </p>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
