'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
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
  Upload,
  Save,
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
    defaultValues: { name: '' },
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
      quoteUrl: quoteUrl || undefined,
      scores: {},
      totalScore: 0,
    };
    setLocalCompetitors((prev) => [...prev, newCompetitor]);
    form.reset();
  };

  const handleScoreChange = (competitorId: string, criterionId: string, value: string) => {
    const score = parseInt(value, 10);
    if (isNaN(score) || score < 1 || score > 5) return;

    setLocalCompetitors(prev => prev.map(comp => {
        if (comp.id === competitorId) {
            const newScores = { ...(comp.scores || {}), [criterionId]: score };
            const totalScore = criteria.reduce((total, crit) => {
                const s = newScores[crit.id] || 0;
                return total + (s * (crit.weight / 100));
            }, 0);
            return { ...comp, scores: newScores, totalScore };
        }
        return comp;
    }));
  };

  const handleRemoveCompetitor = (competitorId: string) => {
    setLocalCompetitors(prev => prev.filter(c => c.id !== competitorId));
  }

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
            className="flex flex-col md:flex-row items-start gap-4 p-4 border rounded-lg"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1 w-full">
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
              name="quoteFile"
              render={({ field }) => (
                <FormItem className="flex-1 w-full">
                  <FormLabel>Cotización (PDF)</FormLabel>
                  <FormControl>
                    <Input type="file" accept="application/pdf" {...form.register('quoteFile')} disabled={noCriteria} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="w-full md:w-auto self-end">
              <Button type="submit" disabled={noCriteria || isUploading} className="w-full">
                {isUploading ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2" />
                )}
                Añadir
              </Button>
            </div>
          </form>
        </Form>
      )}

      {localCompetitors.length > 0 && (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Competidor</TableHead>
                {criteria.map((c) => (
                  <TableHead key={c.id} className="text-center min-w-[150px]">{c.label} ({c.weight}%)</TableHead>
                ))}
                <TableHead className="text-right min-w-[120px]">Puntaje Total</TableHead>
                {!isLocked && <TableHead className="text-right"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {localCompetitors.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.name}
                    {c.quoteUrl && (
                      <Button variant="link" asChild className="p-0 h-auto ml-2">
                        <a href={c.quoteUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                  {criteria.map(crit => (
                    <TableCell key={crit.id} className="text-center">
                        <Input
                            type="number"
                            min="1"
                            max="5"
                            className="w-20 mx-auto text-center"
                            value={c.scores?.[crit.id] || ''}
                            onChange={(e) => handleScoreChange(c.id, crit.id, e.target.value)}
                            disabled={isLocked}
                        />
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-lg">
                    {c.totalScore?.toFixed(2) || '0.00'}
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
      )}

      {!isLocked && localCompetitors.length > 0 && (
         <div className="flex justify-end">
          <Button onClick={() => onSave(localCompetitors)}>
            <Save className="mr-2" />
            Guardar Puntajes
          </Button>
        </div>
      )}
    </div>
  );
}
