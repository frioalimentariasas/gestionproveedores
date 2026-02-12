'use client';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  WithId,
} from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
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
  EVALUATION_TYPE_NAMES,
  EVALUATION_CRITERIA,
  type EvaluationType,
} from '@/lib/evaluations';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Button } from '../ui/button';
import Link from 'next/link';

interface Provider {
  id: string;
  businessName: string;
  categoryIds?: string[];
  documentNumber: string;
  email: string;
}

interface Evaluation {
  id: string;
  evaluationType: EvaluationType;
  totalScore: number;
  scores: Record<string, number>;
  createdAt: Timestamp;
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

const EvaluationScoreCard = ({ evaluations }: { evaluations: WithId<Evaluation>[] | null }) => {
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

  if (Object.keys(latestEvaluations).length === 0) {
    return <p className="text-sm text-muted-foreground">Sin evaluaciones.</p>;
  }

  return (
    <div className="space-y-6">
      {(Object.keys(latestEvaluations) as EvaluationType[]).map((type) => {
        const evaluation = latestEvaluations[type];
        if (!evaluation) return null;
        
        const chartData = EVALUATION_CRITERIA[type].map(crit => ({
            name: crit.label,
            Puntaje: evaluation.scores[crit.id] || 0
        }));

        return (
          <div key={type}>
            <h4 className="font-semibold text-sm mb-2">{EVALUATION_TYPE_NAMES[type]}</h4>
            <div className="flex items-end gap-2 mb-2">
                 <p className="text-2xl font-bold text-primary">{evaluation.totalScore.toFixed(2)}</p>
                 <p className="text-sm text-muted-foreground -translate-y-0.5">/ 5.00</p>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 0, left: 50, bottom: 5 }}>
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))'}}/>
                <Bar dataKey="Puntaje" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={12}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
};

const ProviderComparisonCard = ({ provider }: { provider: WithId<Provider> }) => {
  const {
    data: evaluations,
    isLoading,
    error,
  } = useProviderEvaluations(provider.id);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{provider.businessName}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        {isLoading && <Loader2 className="h-6 w-6 animate-spin" />}
        {error && <p className="text-destructive text-sm">Error al cargar evaluaciones.</p>}
        {!isLoading && !error && <EvaluationScoreCard evaluations={evaluations} />}
      </CardContent>
       <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/selection/new?name=${encodeURIComponent(provider.businessName)}&nit=${provider.documentNumber}&email=${provider.email}`}>
            Iniciar Proceso de Selección
          </Link>
        </Button>
      </CardFooter>
    </Card>
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
        <AlertTitle>Error al cargar proveedores</AlertTitle>
        <AlertDescription>
          No se pudieron cargar los proveedores de esta categoría. Es posible
          que necesites configurar un índice en Firestore.
        </AlertDescription>
      </Alert>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-semibold">
          No hay proveedores en esta categoría
        </h3>
        <p className="text-muted-foreground mt-2">
          Asigna proveedores a esta categoría desde la página de Gestión de
          Proveedores.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {providers.map((provider) => (
        <ProviderComparisonCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}
