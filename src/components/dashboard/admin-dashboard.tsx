'use client';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  collectionGroup,
  query,
  limit,
  Timestamp,
} from 'firebase/firestore';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { EVALUATION_TYPES, EvaluationType } from '@/lib/evaluations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface Provider {
  id: string;
  businessName: string;
  disabled?: boolean;
  categoryIds?: string[];
}

interface Category {
  id: string;
  name: string;
}

interface Evaluation {
  id: string;
  providerId: string;
  evaluationType: EvaluationType;
  totalScore: number;
  createdAt: Timestamp;
}


export default function AdminDashboard() {
  const firestore = useFirestore();

  // Fetch all providers
  const providersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'providers') : null),
    [firestore]
  );
  const { data: providers, isLoading: providersLoading } =
    useCollection<Provider>(providersQuery);

  // Fetch all categories
  const categoriesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'categories') : null),
    [firestore]
  );
  const { data: categories, isLoading: categoriesLoading } =
    useCollection<Category>(categoriesQuery);

  // Fetch recent evaluations using a collection group query
  const recentEvaluationsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collectionGroup(firestore, 'evaluations'),
            limit(20) // Fetch a larger batch to sort on client
          )
        : null,
    [firestore]
  );
  const { data: recentEvaluations, isLoading: evaluationsLoading } =
    useCollection<Evaluation>(recentEvaluationsQuery);

  const providerStatusData = useMemo(() => {
    if (!providers) return [];
    const active = providers.filter(p => !p.disabled).length;
    const inactive = providers.length - active;
    return [
      { name: 'Activos', value: active },
      { name: 'Inactivos', value: inactive },
    ];
  }, [providers]);

  const totalProviders = useMemo(() => providers?.length || 0, [providers]);
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  const providersByCategoryData = useMemo(() => {
    if (!providers || !categories) return [];

    const categoryMap = new Map<string, string>(
      categories.map((c) => [c.id, c.name])
    );
    const counts = new Map<string, number>();

    for (const provider of providers) {
      if (provider.categoryIds) {
        for (const catId of provider.categoryIds) {
          const catName = categoryMap.get(catId);
          if (catName) {
            counts.set(catName, (counts.get(catName) || 0) + 1);
          }
        }
      }
    }

    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      proveedores: value,
    }));
  }, [providers, categories]);

  const evaluationsWithProviderNames = useMemo(() => {
    if (!recentEvaluations || !providers) return [];

    const sortedEvaluations = [...recentEvaluations].sort((a, b) => {
      const dateA = a.createdAt?.toDate() ?? new Date(0);
      const dateB = b.createdAt?.toDate() ?? new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    const top5 = sortedEvaluations.slice(0, 5);
    
    return top5.map((ev) => {
      const provider = providers.find((p) => p.id === ev.providerId);
      return {
        ...ev,
        providerName: provider?.businessName || 'Desconocido',
      };
    });
  }, [recentEvaluations, providers]);

  const isLoading = providersLoading || categoriesLoading || evaluationsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Administrativo
        </h1>
        <p className="text-muted-foreground">
          Un resumen de la actividad de tus proveedores.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumen de Proveedores</CardTitle>
            <CardDescription>Total de {totalProviders} proveedores registrados.</CardDescription>
          </CardHeader>
          <CardContent>
            {totalProviders > 0 ? (
               <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={providerStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {providerStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                   <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                    No hay proveedores para mostrar.
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Proveedores por Categoría</CardTitle>
            <CardDescription>
              Distribución de proveedores en las diferentes categorías.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {providersByCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={providersByCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="proveedores"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                No hay datos de categorías para mostrar.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8">
          <CardHeader>
            <CardTitle>Evaluaciones Recientes</CardTitle>
            <CardDescription>
              Últimas 5 evaluaciones realizadas en la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {evaluationsWithProviderNames.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Puntaje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluationsWithProviderNames.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell>
                        <Link
                          href={`/providers/${ev.providerId}/view`}
                          className="font-medium hover:underline"
                        >
                          {ev.providerName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {format(ev.createdAt.toDate(), 'dd MMM, yyyy', {
                            locale: es,
                          })}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs">
                        {EVALUATION_TYPES[ev.evaluationType]}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {ev.totalScore.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No se han realizado evaluaciones.
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
