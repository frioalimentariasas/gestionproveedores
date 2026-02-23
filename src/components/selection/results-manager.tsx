'use client';

import { useMemo, useState } from 'react';
import type { Competitor, Criterion } from './manage-selection-event';
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
import { Crown, Trophy, Mail, Copy, Loader2, Info, NotebookPen, MessageSquareQuote, Printer } from 'lucide-react';
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
  eventType: string;
  criticality?: string;
  criteria: Criterion[];
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
  eventType,
  criticality,
  criteria,
  competitors,
  onSelectCompetitor,
  selectedCompetitorId,
  justification,
  isLocked
}: ResultsManagerProps) {
  
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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
    const baseUrl = window.location.origin;
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

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    const { default: jsPDF } = await import('jspdf');
    const { format } = await import('date-fns');

    try {
        const doc = new jsPDF();
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = margin;

        const drawBackgroundWatermark = () => {
            const originalColor = doc.getTextColor();
            doc.setTextColor(250, 250, 250); // Extremadamente tenue
            doc.setFontSize(50);
            doc.setFont(undefined, 'bold');
            doc.text('REPORTE ISO 9001', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
            doc.setTextColor(originalColor);
        };

        const safeAddPage = () => {
            doc.addPage();
            yPos = margin;
            drawBackgroundWatermark();
        };

        // Draw watermark on first page
        drawBackgroundWatermark();

        // Header Function
        const getLogoBase64 = async () => {
            const response = await fetch('/logo.png');
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        };

        const logoBase64 = await getLogoBase64();
        doc.addImage(logoBase64, 'PNG', margin, 12, 40, 13);

        // Doc Info Box
        doc.setFontSize(8);
        doc.setDrawColor(0);
        const boxX = pageWidth - margin - 50;
        const boxY = 12;
        const boxWidth = 50;
        const boxHeight = 15;
        doc.rect(boxX, boxY, boxWidth, boxHeight);
        doc.text('Codigo: FA-GFC-F05', boxX + 2, boxY + 4);
        doc.line(boxX, boxY + 5, boxX + boxWidth, boxY + 5);
        doc.text('Version: 1', boxX + 2, boxY + 9);
        doc.line(boxX, boxY + 10, boxX + boxWidth, boxY + 10);
        doc.text('Vigencia: 12/06/2025', boxX + 2, boxY + 14);
        
        yPos += 20;

        // Title
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ACTA DE SELECCIÓN DE PROVEEDORES ISO 9001', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Section 1: General Info
        doc.setFontSize(10);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, 'F');
        doc.text('1. INFORMACIÓN GENERAL DEL PROCESO', margin + 2, yPos);
        yPos += 8;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        const generalInfo = [
            `Nombre del Proceso: ${eventName}`,
            `Sector: ${eventType}`,
            `Nivel de Criticidad: ${criticality || 'No Asignado'}`,
            `Fecha de Generación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
            `Estado: ${isLocked ? 'CERRADO' : 'ABIERTO'}`
        ];
        generalInfo.forEach(line => {
            doc.text(line, margin + 5, yPos);
            yPos += 5;
        });
        yPos += 5;

        // Section 2: Criteria
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, 'F');
        doc.text('2. CRITERIOS DE EVALUACIÓN Y PONDERACIÓN', margin + 2, yPos);
        yPos += 8;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        criteria.filter(c => c.weight > 0).forEach(c => {
            if (yPos > pageHeight - 20) safeAddPage();
            doc.text(`- ${c.label}`, margin + 5, yPos);
            doc.text(`${c.weight}%`, pageWidth - margin - 15, yPos, { align: 'right' });
            yPos += 5;
        });
        yPos += 5;

        // Section 3: Comparative Matrix
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, 'F');
        doc.text('3. MATRIZ COMPARATIVA DE RESULTADOS', margin + 2, yPos);
        yPos += 8;

        // Table Header
        const startX = margin;
        doc.setFontSize(8);
        doc.rect(startX, yPos - 4, pageWidth - margin * 2, 6);
        doc.text('EMPRESA COMPETIDORA', startX + 2, yPos);
        doc.text('PUNTAJE (1-5)', startX + 62, yPos);
        doc.text('% CUMPLIMIENTO', startX + 92, yPos);
        doc.text('DECISIÓN ISO', startX + 127, yPos);
        yPos += 6;

        sortedCompetitors.forEach(c => {
            if (yPos > pageHeight - 20) safeAddPage();
            const decision = getDecisionStatus(c.totalScore);
            doc.setFont(undefined, c.id === selectedCompetitorId ? 'bold' : 'normal');
            doc.rect(startX, yPos - 4, pageWidth - margin * 2, 6);
            doc.text(c.name.substring(0, 35), startX + 2, yPos);
            doc.text(c.totalScore?.toFixed(2) || '0.00', startX + 62, yPos);
            doc.text(`${((c.totalScore || 0) * 20).toFixed(0)}%`, startX + 92, yPos);
            doc.text(decision.label, startX + 127, yPos);
            yPos += 6;
        });
        yPos += 10;

        // Section 4: Audit notes
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, 'F');
        doc.text('4. BITÁCORA DE VERIFICACIÓN (AUDITORÍA)', margin + 2, yPos);
        yPos += 8;

        sortedCompetitors.forEach(c => {
            if (yPos > pageHeight - 30) safeAddPage();
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text(`> ${c.name}:`, margin + 2, yPos);
            yPos += 5;
            doc.setFont(undefined, 'italic');
            doc.setFontSize(8);
            const notesLines = doc.splitTextToSize(c.auditNotes || 'Sin notas de verificación registradas.', pageWidth - margin * 2 - 10);
            doc.text(notesLines, margin + 5, yPos);
            yPos += (notesLines.length * 4) + 5;
        });

        // Section 5: Justification
        if (selectedCompetitor) {
            if (yPos > pageHeight - 50) safeAddPage();
            yPos += 5;
            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            doc.setFillColor(220, 220, 255);
            doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, 'F');
            doc.text('5. RESULTADO FINAL Y JUSTIFICACIÓN DE ADJUDICACIÓN', margin + 2, yPos);
            yPos += 8;

            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            doc.text(`Proveedor Seleccionado: ${selectedCompetitor.name}`, margin + 5, yPos);
            yPos += 7;
            doc.setFont(undefined, 'bold');
            doc.text('Motivo de Selección:', margin + 5, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            const justLines = doc.splitTextToSize(justification || 'No proporcionada.', pageWidth - margin * 2 - 10);
            doc.text(justLines, margin + 5, yPos);
            yPos += (justLines.length * 4) + 10;
        }

        // Footer signatures
        if (yPos > pageHeight - 40) {
            safeAddPage();
            yPos += 20;
        } else {
            yPos += 20;
        }
        doc.line(margin + 10, yPos, margin + 70, yPos);
        doc.line(pageWidth - margin - 70, yPos, pageWidth - margin - 10, yPos);
        doc.setFontSize(8);
        doc.text('Firma Responsable Selección', margin + 15, yPos + 5);
        doc.text('Firma Aprobación Calidad', pageWidth - margin - 65, yPos + 5);

        // Page Numbers
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setTextColor(150);
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        doc.save(`Acta_Seleccion_${eventName.replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
        toast({ title: 'Reporte Generado', description: 'El acta de selección se ha descargado correctamente.' });
    } catch (e) {
        console.error("Error generating PDF:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el PDF.' });
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Gráfico de Resultados</CardTitle>
                <CardDescription>Comparación visual de los puntajes totales de los competidores.</CardDescription>
            </div>
            {isLocked && (
                <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={isGeneratingPdf}>
                    {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
                    Descargar Reporte PDF
                </Button>
            )}
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
