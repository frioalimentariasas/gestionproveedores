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
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface ResultsManagerProps {
  competitors: Competitor[];
  onSelectCompetitor: (competitor: Competitor, justification: string) => void;
  selectedCompetitorId?: string;
  justification?: string;
  isLocked: boolean;
}

export function ResultsManager({
  competitors,
  onSelectCompetitor,
  selectedCompetitorId,
  justification,
  isLocked
}: ResultsManagerProps) {
  
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; competitor: Competitor | null; justification: string }>({ isOpen: false, competitor: null, justification: '' });

  const sortedCompetitors = useMemo(() => {
    if (!competitors) return [];
    return [...competitors].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  }, [competitors]);

  const selectedCompetitor = useMemo(() => {
    if (!selectedCompetitorId) return null;
    return competitors.find(c => c.id === selectedCompetitorId);
  }, [competitors, selectedCompetitorId]);


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
    isSelected: c.id === selectedCompetitorId,
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

  const handleSelectClick = () => {
    if (dialogState.competitor) {
      onSelectCompetitor(dialogState.competitor, dialogState.justification);
      setDialogState({ isOpen: false, competitor: null, justification: '' });
    }
  }

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
                  <Cell key={`cell-${index}`} fill={entry.isSelected ? 'hsl(var(--accent))' : 'hsl(var(--primary))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Resultados Finales</CardTitle>
            <CardDescription>Lista de competidores ordenados por puntaje. Selecciona un proveedor para cerrar el proceso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            {selectedCompetitor && (
                 <Alert className="border-yellow-500 text-yellow-700">
                    <Trophy className="h-4 w-4 !text-yellow-600" />
                    <AlertTitle className="text-yellow-800 font-bold">Proveedor Seleccionado</AlertTitle>
                    <AlertDescription className="text-yellow-700 space-y-2">
                       <p>El proveedor seleccionado de este proceso es <strong>{selectedCompetitor.name}</strong>. El proceso está cerrado.</p>
                       {justification && (
                          <div className="mt-2 pt-2 border-t border-yellow-400/50">
                            <p className="font-semibold text-xs text-yellow-800">Justificación:</p>
                            <p className="text-xs italic">"{justification}"</p>
                          </div>
                       )}
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
                        <Button size="sm" onClick={() => setDialogState({ isOpen: true, competitor: c, justification: '' })}>
                            <Crown className="mr-2 h-4 w-4"/>
                            Seleccionar
                        </Button>
                     )}
                     {c.id === selectedCompetitorId && <Trophy className="h-6 w-6 text-yellow-500" />}
                </div>
            ))}
        </CardContent>
      </Card>
      
      <AlertDialog open={dialogState.isOpen} onOpenChange={(isOpen) => setDialogState(prev => ({...prev, isOpen}))}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar Selección?</AlertDialogTitle>
                <AlertDialogDescription>
                    Estás a punto de seleccionar a <strong>{dialogState.competitor?.name}</strong>. Por favor, argumenta tu decisión. Esta acción cerrará el proceso.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-2 py-2">
                <Label htmlFor="justification">Justificación de la Selección</Label>
                <Textarea
                  id="justification"
                  placeholder="Escribe la justificación de por qué este proveedor fue seleccionado..."
                  value={dialogState.justification}
                  onChange={(e) => setDialogState(prev => ({ ...prev, justification: e.target.value }))}
                  className="min-h-[100px]"
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDialogState({ isOpen: false, competitor: null, justification: '' })}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleSelectClick}
                    disabled={!dialogState.justification.trim()}
                >
                    Sí, seleccionar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}
