
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  PlusCircle,
  FileText,
  Loader2,
  Trash2,
  Save,
  AlertCircle,
  Info,
  NotebookPen,
} from 'lucide-react';
import type { Competitor, Criterion } from './manage-selection-event';
import { competitorSchema } from '@/lib/schemas';
import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';

interface CompetitorsManagerProps {
  eventId: string;
  criteria: Criterion[];
  competitors: Competitor[];
  onSave: (competitors: Competitor[]) => void;
  isLocked: boolean;
}

type AddCompetitorFormValues = z.infer<typeof competitorSchema>;

export function CompetitorsManager({
  eventId,
  criteria,
  competitors,
  onSave,
  isLocked,
}: CompetitorsManagerProps) {
  const { toast } = useToast();
  const [localCompetitors, setLocalCompetitors] = useState<Competitor[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLocalCompetitors(competitors);
  }, [competitors]);

  const form = useForm<AddCompetitorFormValues>({
    resolver: zodResolver(competitorSchema),
    defaultValues: { name: '', nit: '', email: '' },
  });

  const handleAddCompetitor = async (values: AddCompetitorFormValues) => {
    setIsUploading(true);
    let quoteUrl = '';
    const file = values.quoteFile?.[0];

    if (file) {
      try {
        const fileName = `quote_${Date.now()}_${file.name}`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', eventId);
        formData.append('fileName', `selection_quotes/${fileName}`);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Error al subir el archivo.');
        const { url } = await response.json();
        quoteUrl = url;
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error de Carga',
          description:
            'No se pudo subir la cotización. Inténtalo de nuevo.',
        });
        setIsUploading(false);
        return;
      }
    }
    
    setIsUploading(false);
    
    const newCompetitor: Competitor = {
      id: crypto.randomUUID(),
      name: values.name,
      nit: values.nit,
      email: values.email,
      scores: {},
      totalScore: 0,
      auditNotes: '',
    };

    if (quoteUrl) {
      newCompetitor.quoteUrl = quoteUrl;
    }

    setLocalCompetitors((prev) => [...prev, newCompetitor]);
    form.reset();
  };

  const handleScoreChange = (competitorId: string, criterionId: string, value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return;

    const score = value === '' ? undefined : parseInt(value, 10);

    setLocalCompetitors(prev => prev.map(comp => {
        if (comp.id === competitorId) {
            const newScores = { ...(comp.scores || {}) };
            if (score === undefined) {
                delete newScores[criterionId];
            } else {
                newScores[criterionId] = score;
            }
            
            const totalScore = criteria.reduce((total, crit) => {
                const s = newScores[crit.id] || 0;
                return total + (s * (crit.weight / 100));
            }, 0);
            return { ...comp, scores: newScores, totalScore };
        }
        return comp;
    }));
  };

  const handleAuditNotesChange = (competitorId: string, notes: string) => {
    setLocalCompetitors(prev => prev.map(comp => 
      comp.id === competitorId ? { ...comp, auditNotes: notes } : comp
    ));
  };

  const handleRemoveCompetitor = (competitorId: string) => {
    setLocalCompetitors(prev => prev.filter(c => c.id !== competitorId));
  }

  const isSaveDisabled = useMemo(() => {
    if (localCompetitors.length === 0) return true;
    
    return localCompetitors.some(comp => {
      // Check if all criteria scores are filled
      const missingScores = criteria.some(crit => {
        if (crit.weight > 0) {
          const score = comp.scores?.[crit.id];
          return score === undefined || score === null || isNaN(score) || score < 1 || score > 5;
        }
        return false;
      });

      // Check if audit notes are present
      const missingNotes = !comp.auditNotes?.trim();

      return missingScores || missingNotes;
    });
  }, [localCompetitors, criteria]);

  const noCriteria = !criteria || criteria.length === 0;

  if (isLocked && competitors.length === 0) {
      return <p className="text-center text-sm text-muted-foreground">No se añadieron competidores para este proceso cerrado.</p>;
  }

  return (
    <div className="space-y-6">
      {noCriteria && (
        <Alert>
          <AlertTitle>Define los Criterios Primero</AlertTitle>
          <AlertDescription>
            Debes guardar al menos un criterio en el Paso 1 antes de añadir
            competidores.
          </AlertDescription>
        </Alert>
      )}

      {!isLocked && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleAddCompetitor)}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-start gap-4 p-4 border rounded-lg"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Competidor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Proveedor S.A.S." {...field} disabled={noCriteria} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="nit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIT del Competidor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 900123456" {...field} disabled={noCriteria} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del Competidor</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Ej: contacto@proveedor.com" {...field} disabled={noCriteria} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="quoteFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cotización (PDF)</FormLabel>
                    <FormControl>
                      <Input type="file" accept="application/pdf" {...form.register('quoteFile')} disabled={noCriteria} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={noCriteria || isUploading} className="w-full">
                {isUploading ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2" />
                )}
                Añadir Competidor
              </Button>
            </div>
          </form>
        </Form>
      )}

      {localCompetitors.length > 0 && (
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border text-sm">
            <h4 className="font-bold flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-primary" />
              Escala de Calificación:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background font-bold px-2">5</Badge>
                <span className="text-muted-foreground">Cumple totalmente</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background font-bold px-2">4</Badge>
                <span className="text-muted-foreground">Cumple con pequeñas observaciones</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background font-bold px-2">3</Badge>
                <span className="text-muted-foreground">Cumple parcialmente</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background font-bold px-2">2</Badge>
                <span className="text-muted-foreground">Deficiente</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background font-bold px-2">1</Badge>
                <span className="text-muted-foreground">No cumple</span>
              </div>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Competidor</TableHead>
                  {criteria.map((c) => (
                    <TableHead key={c.id} className="text-center min-w-[150px]">{c.label} ({c.weight}%)</TableHead>
                  ))}
                  <TableHead className="text-right min-w-[120px]">Puntaje Total</TableHead>
                  {!isLocked && <TableHead className="text-right"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {localCompetitors.map((c) => (
                  <TableRow key={c.id} className="align-top">
                    <TableCell>
                      <div className="font-bold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.nit}</div>
                      <div className="text-xs text-muted-foreground mb-4">{c.email}</div>
                      
                      {/* Audit Notes Field */}
                      <div className="mt-4 space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                          <NotebookPen className="h-3 w-3" />
                          Base de Verificación (Audit):
                        </label>
                        <Textarea 
                          placeholder="Especifique cómo verificó los puntajes (ej: DIAN, Portafolio, Llamada referencias)..."
                          className={cn(
                            "text-xs min-h-[80px] bg-muted/30",
                            !c.auditNotes?.trim() && !isLocked && "border-destructive focus-visible:ring-destructive"
                          )}
                          value={c.auditNotes || ''}
                          onChange={(e) => handleAuditNotesChange(c.id, e.target.value)}
                          disabled={isLocked}
                        />
                      </div>

                      {c.quoteUrl && (
                        <Button variant="link" asChild className="p-0 h-auto text-xs mt-2">
                          <a href={c.quoteUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-3 w-3 mr-1" />
                            Ver Cotización
                          </a>
                        </Button>
                      )}
                    </TableCell>
                    {criteria.map(crit => {
                      const score = c.scores?.[crit.id];
                      const isRequired = crit.weight > 0;
                      const isInvalid = isRequired && (score === undefined || score < 1 || score > 5);
                      
                      return (
                        <TableCell key={crit.id} className="text-center pt-4">
                            <Input
                                type="number"
                                min="1"
                                max="5"
                                placeholder={isRequired ? "1-5" : "N/A"}
                                className={cn(
                                  "w-20 mx-auto text-center font-bold",
                                  isInvalid && !isLocked && "border-destructive focus-visible:ring-destructive"
                                )}
                                value={score ?? ''}
                                onChange={(e) => handleScoreChange(c.id, crit.id, e.target.value)}
                                disabled={isLocked}
                            />
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right pt-4">
                      <div className="text-2xl font-black text-primary">
                        {c.totalScore?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">
                        Equiv: {((c.totalScore || 0) * 20).toFixed(0)}%
                      </div>
                    </TableCell>
                    {!isLocked && (
                      <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveCompetitor(c.id)}>
                              <Trash2 className="h-4 w-4 text-destructive"/>
                          </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!isLocked && localCompetitors.length > 0 && (
         <div className="flex flex-col items-end gap-2">
          {isSaveDisabled && (
            <div className="text-xs text-destructive flex flex-col items-end gap-1">
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Puntajes incompletos (1-5) o inválidos.
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Faltan las Notas de Verificación de Auditoría.
              </span>
            </div>
          )}
          <Button onClick={() => onSave(localCompetitors)} disabled={isSaveDisabled}>
            <Save className="mr-2" />
            Guardar Puntajes y Bitácora
          </Button>
        </div>
      )}
    </div>
  );
}
