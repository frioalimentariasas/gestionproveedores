
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Provider {
  id: string;
  businessName: string;
  criticalityLevel?: string;
}

interface AssignCriticalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider | null;
}

export function AssignCriticalityModal({
  isOpen,
  onClose,
  provider,
}: AssignCriticalityModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [level, setLevel] = useState<string>('');

  useEffect(() => {
    if (provider?.criticalityLevel) {
      setLevel(provider.criticalityLevel);
    } else {
      setLevel('');
    }
  }, [provider, isOpen]);

  const handleSave = async () => {
    if (!firestore || !provider || !level) return;

    setIsSubmitting(true);
    const providerRef = doc(firestore, 'providers', provider.id);

    try {
      await updateDoc(providerRef, {
        criticalityLevel: level,
      });
      toast({
        title: 'Nivel de Criticidad Actualizado',
        description: `Se ha asignado el nivel "${level}" a ${provider.businessName}.`,
      });
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el nivel de criticidad.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Asignar Nivel de Criticidad
          </DialogTitle>
          <DialogDescription>
            Define el nivel de criticidad para{' '}
            <span className="font-bold">{provider?.businessName}</span>. 
            Este valor ajustará automáticamente los pesos en futuras evaluaciones.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="criticality">Nivel de Criticidad</Label>
                <Select onValueChange={setLevel} value={level}>
                    <SelectTrigger id="criticality">
                        <SelectValue placeholder="Selecciona un nivel..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Crítico">Crítico</SelectItem>
                        <SelectItem value="No Crítico">No Crítico</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || !level}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
