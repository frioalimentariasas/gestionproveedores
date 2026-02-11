'use client';

import { useMemo, useState } from 'react';
import type { Competitor } from './manage-selection-event';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Crown, Trophy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

interface ResultsManagerProps {
  competitors: Competitor[];
  onDeclareWinner: (winnerId: string) => void;
  winnerId?: string;
  isLocked: boolean;
}

export function ResultsManager({
  competitors,
  onDeclareWinner,
  winnerId,
  isLocked
}: ResultsManagerProps) {

  const sortedCompetitors = useMemo(() => {
    if (!competitors) return [];
    return [...competitors].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  }, [competitors]);

  const winner = useMemo(() => {
    if (!winnerId) return null;
    return competitors.find(c => c.id === winnerId);
  }, [competitors, winnerId]);


  if (competitors.length === 0) {
    return (
      <Alert>
        <AlertTitle>Sin Competidores</AlertTitle>
        <AlertDescription>
          Añade y guarda los puntajes de los competidores en el Paso 2 para ver los resultados aquí.
        </AlertDescription>
      </Alert>
    );
  }

  const chartData = sortedCompetitors.map(c => ({
    name: c.name,
    Puntaje: c.totalScore?.toFixed(2) || 0,
    isWinner: c.id === winnerId,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded-md shadow-md">
          <p className="font-bold">{label}</p>
          <p className="text-primary">{`Puntaje: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Resultados</CardTitle>
          <CardDescription>Comparación visual de los puntajes totales de los competidores.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
              <XAxis type="number" domain={[0, 5]} hide/>
              <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar dataKey="Puntaje" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isWinner ? 'hsl(var(--accent))' : 'hsl(var(--primary))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Resultados Finales</CardTitle>
            <CardDescription>Lista de competidores ordenados por puntaje. Selecciona un ganador para cerrar el proceso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            {winner && (
                 <Alert className="border-yellow-500 text-yellow-700">
                    <Trophy className="h-4 w-4 !text-yellow-600" />
                    <AlertTitle className="text-yellow-800 font-bold">¡Ganador Declarado!</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                       El ganador de este proceso de selección es <strong>{winner.name}</strong>. El proceso está cerrado.
                    </AlertDescription>
                </Alert>
            )}
            {sortedCompetitors.map((c, index) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                        <span className={`text-lg font-bold w-8 text-center ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`}>{index + 1}.</span>
                        <div>
                            <p className="font-semibold">{c.name}</p>
                            <p className="text-sm text-muted-foreground">Puntaje: {c.totalScore?.toFixed(2) || 'N/A'}</p>
                        </div>
                    </div>
                     {!isLocked && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button size="sm">
                                    <Crown className="mr-2 h-4 w-4"/>
                                    Declarar Ganador
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Confirmar Ganador?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Estás a punto de declarar a <strong>{c.name}</strong> como el ganador. Esta acción cerrará el proceso de selección y no se podrá revertir.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeclareWinner(c.id)}>
                                        Sí, declarar ganador
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     )}
                     {c.id === winnerId && <Trophy className="h-6 w-6 text-yellow-500" />}
                </div>
            ))}
        </CardContent>
      </Card>

    </div>
  );
}
