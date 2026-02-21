
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
import { Crown, Trophy, Mail, Copy, Loader2, Info, NotebookPen, MessageSquareQuote } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { notifyWinnerOfSelection } from '@/actions/email';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface ResultsManagerProps {
  eventId: string;
  eventName: string;
  competitors: Competitor[];
  onSelectCompetitor: (competitor: Competitor, justification: string) => void;
  selectedCompetitorId?: string;
  justification?: string;
  isLocked: boolean;
}

/**
 * Maps the 1-5 scale to the 0-100 decision scale provided by the user.
 */
function getDecisionStatus(score: number = 0) {
  const percentage = score * 20; // 5.00 * 20 = 100
  if (percentage >= 85) {
    return { label: 'Aprobado', color: 'bg-green-100 text-green-800 border-green-200' };
  } else if (percentage >= 70) {
    return { label: 'Aprobado Condicionado', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  } else if (percentage >= 60) {
    return { label: 'Requiere análisis gerencial', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  } else {
    return { label: 'No Aprobado', color: 'bg-red-100 text-red-800 border-red-200' };
  }
}

export function ResultsManager({
  eventId,
  eventName,
  competitors,
  onSelectCompetitor,
  selectedCompetitorId,
  justification,
  isLocked
}: ResultsManagerProps) {
  
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
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
    decision: getDecisionStatus(c.totalScore).label,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border p-2 rounded-md shadow-md text-xs">
          <p className="font-bold border-b mb-1 pb-1">{label}</p>
          <p className="text-primary">{`Puntaje: ${data.Puntaje} / 5.00`}</p>
          <p className="font-semibold text-muted-foreground mt-1">{`Decisión: ${data.decision}`}</p>
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

   const handleResendEmail = async () => {
      if (!selectedCompetitor) return;
      setIsResending(true);
      try {
        const result = await notifyWinnerOfSelection({
            competitorEmail: selectedCompetitor.email,
            competitorName: selectedCompetitor.name,
            selectionProcessName: eventName,
            eventId: eventId,
        });

        if (result.success) {
            toast({
                title: 'Correo Reenviado',
                description: `Se ha enviado nuevamente la notificación a ${selectedCompetitor.name}.`,
            });
        } else {
            throw new Error(result.error || 'Error desconocido');
        }
      } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Error al Reenviar',
            description: error.message || 'No se pudo reenviar el correo de notificación.',
         });
      } finally {
        setIsResending(false);
      }
  };

  const handleCopyLink = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.gestionproveedores.frioalimentaria.com.co';
    const registrationUrl = `${baseUrl}/auth/register?eventId=${eventId}`;
    navigator.clipboard.writeText(registrationUrl).then(() => {
        toast({
            title: 'Enlace Copiado',
            description: 'El enlace de registro ha sido copiado al portapapeles.',
        });
    }, (err) => {
        toast({
            variant: 'destructive',
            title: 'Error al Copiar',
            description: 'No se pudo copiar el enlace.',
        });
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gráfico de Resultados</CardTitle>
            <CardDescription>Comparación visual de los puntajes totales de los competidores.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                <XAxis type="number" domain={[0, 5]} hide/>
                <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="Puntaje" radius={[0, 4, 4, 0]} barSize={20}>
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
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Guía de Decisión
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            <div className="flex justify-between items-center border-b pb-1">
              <span className="font-bold">Puntaje (%)</span>
              <span className="font-bold">Decisión</span>
            </div>
            <div className="flex justify-between items-center text-green-700 font-medium">
              <span>&ge; 85% (4.25)</span>
              <span>Aprobado</span>
            </div>
            <div className="flex justify-between items-center text-blue-700 font-medium">
              <span>70 - 84% (3.5)</span>
              <span>Aprobado Cond.</span>
            </div>
            <div className="flex justify-between items-center text-yellow-700 font-medium">
              <span>60 - 69% (3.0)</span>
              <span>Req. Análisis</span>
            </div>
            <div className="flex justify-between items-center text-red-700 font-medium">
              <span>&lt; 60% (3.0)</span>
              <span>No Aprobado</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 italic">
              * El sistema multiplica el puntaje (1-5) por 20 para obtener el equivalente porcentual.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Resumen de Competidores para Auditoría</CardTitle>
            <CardDescription>Lista de competidores con sus bases de verificación. Selecciona un proveedor para cerrar el proceso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {selectedCompetitor && (
                 <Alert className="border-yellow-500 text-yellow-700 bg-yellow-50/30 mb-6">
                    <Trophy className="h-4 w-4 !text-yellow-600" />
                    <AlertTitle className="text-yellow-800 font-bold">Proveedor Seleccionado</AlertTitle>
                    <AlertDescription className="text-yellow-700 space-y-2">
                       <p>El proveedor seleccionado de este proceso es <strong>{selectedCompetitor.name}</strong>. El proceso está cerrado y se ha enviado una invitación por correo para que complete su registro.</p>
                       {justification && (
                          <div className="mt-2 pt-2 border-t border-yellow-400/50">
                            <p className="font-semibold text-xs text-yellow-800">Justificación de Selección:</p>
                            <p className="text-xs italic">"{justification}"</p>
                          </div>
                       )}
                       <div className="mt-4 pt-4 border-t border-yellow-400/50 flex items-center gap-2">
                          <Button size="sm" variant="outline" className="border-yellow-500/50 hover:bg-yellow-100/50 text-yellow-800 hover:text-yellow-900" onClick={handleResendEmail} disabled={isResending}>
                              {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                              Reenviar Email
                          </Button>
                          <Button size="sm" variant="outline" className="border-yellow-500/50 hover:bg-yellow-100/50 text-yellow-800 hover:text-yellow-900" onClick={handleCopyLink}>
                              <Copy className="h-4 w-4" />
                              Copiar Enlace
                          </Button>
                      </div>
                    </AlertDescription>
                </Alert>
            )}
            <div className="space-y-4">
              {sortedCompetitors.map((c, index) => {
                  const decision = getDecisionStatus(c.totalScore);
                  return (
                    <div key={c.id} className="flex flex-col p-4 rounded-lg border bg-card hover:bg-muted/10 transition-colors gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className={cn(
                                  "text-xl font-bold w-8 text-center",
                                  index === 0 ? 'text-primary' : 'text-muted-foreground'
                                )}>{index + 1}.</span>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-bold text-lg">{c.name}</p>
                                      <Badge variant="outline" className={cn("text-[10px] py-0 h-5 border shadow-none", decision.color)}>
                                        {decision.label}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Puntaje: <span className="font-bold text-foreground">{c.totalScore?.toFixed(2) || 'N/A'}</span> ({( (c.totalScore || 0) * 20 ).toFixed(0)}%)
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {!isLocked && (
                                  <Button size="sm" onClick={() => setDialogState({ isOpen: true, competitor: c, justification: '' })}>
                                      <Crown className="mr-2 h-4 w-4"/>
                                      Seleccionar Ganador
                                  </Button>
                              )}
                              {c.id === selectedCompetitorId && <Trophy className="h-6 w-6 text-yellow-500" />}
                            </div>
                        </div>
                        
                        {/* Audit trail display */}
                        <div className="bg-muted/30 p-3 rounded-md border-l-4 border-muted">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                                <NotebookPen className="h-3 w-3" /> Base de Verificación (Audit Log)
                            </div>
                            <p className="text-xs italic text-muted-foreground whitespace-pre-wrap">
                                {c.auditNotes || "Sin notas de auditoría registradas."}
                            </p>
                        </div>
                    </div>
                  );
              })}
            </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={dialogState.isOpen} onOpenChange={(isOpen) => setDialogState(prev => ({...prev, isOpen}))}>
        <AlertDialogContent className="sm:max-w-[500px]">
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Selección de Proveedor</AlertDialogTitle>
                <AlertDialogDescription>
                    Estás a punto de cerrar el proceso y declarar a <strong>{dialogState.competitor?.name}</strong> como ganador.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4 text-sm">
                <div className="p-4 rounded-md bg-muted/50 border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Recomendación:</span>
                    <Badge variant="outline" className={cn("text-[10px]", getDecisionStatus(dialogState.competitor?.totalScore).color)}>
                        {getDecisionStatus(dialogState.competitor?.totalScore).label}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Puntaje Final:</span>
                    <span className="font-bold text-primary text-lg">{dialogState.competitor?.totalScore?.toFixed(2)} ({( (dialogState.competitor?.totalScore || 0) * 20 ).toFixed(0)}%)</span>
                  </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <MessageSquareQuote className="h-4 w-4 text-primary" />
                        <Label htmlFor="justification" className="font-bold">Justificación de la Selección</Label>
                    </div>
                    <Textarea
                      id="justification"
                      placeholder="Escriba los motivos por los cuales este proveedor fue elegido (Ej: Mejor relación costo-beneficio, solidez técnica comprobada)..."
                      value={dialogState.justification}
                      onChange={(e) => setDialogState(prev => ({ ...prev, justification: e.target.value }))}
                      className="min-h-[120px]"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Esta justificación es obligatoria para cumplir con los estándares de auditoría interna.</p>
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDialogState({ isOpen: false, competitor: null, justification: '' })}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleSelectClick}
                    disabled={!dialogState.justification.trim()}
                    className="bg-primary text-primary-foreground"
                >
                    Confirmar y Cerrar Proceso
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}
