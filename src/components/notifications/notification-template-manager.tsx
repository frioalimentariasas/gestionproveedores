
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Loader2, Save, Info, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface Template {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'pending_form_reminder_provider',
    name: 'Recordatorio de Formulario Pendiente',
    subject: 'Recordatorio: Diligenciamiento de Formulario de Proveedor Pendiente',
    htmlContent: '<h1>Hola, {{providerName}}</h1><p>Hemos notado que aún no has finalizado el diligenciamiento de tu formulario...</p><p><a href="{{loginUrl}}">Ir al Formulario</a></p>',
    variables: ['providerName', 'loginUrl'],
  },
  {
    id: 'winner_selection_provider',
    name: 'Notificación de Proveedor Seleccionado (Ganador)',
    subject: '¡Felicitaciones! Has sido seleccionado en el proceso: {{selectionProcessName}}',
    htmlContent: '<h1>Hola, {{competitorName}}</h1><p>Nos complace informarte que has sido seleccionado para {{selectionProcessName}}.</p><p><a href="{{registrationUrl}}">Registrarse</a></p>',
    variables: ['competitorName', 'selectionProcessName', 'registrationUrl'],
  },
  {
    id: 'form_unlocked_provider',
    name: 'Notificación de Formulario Habilitado',
    subject: 'Tu formulario de proveedor ha sido habilitado para edición',
    htmlContent: '<h1>Hola, {{providerName}}</h1><p>Tu formulario ha sido habilitado para edición.</p>',
    variables: ['providerName'],
  },
  {
    id: 'password_reset_provider',
    name: 'Restablecimiento de Contraseña',
    subject: 'Restablecimiento de Contraseña de su Cuenta',
    htmlContent: '<h1>Hola, {{providerName}}</h1><p>Tu nueva contraseña es: {{newPassword}}</p>',
    variables: ['providerName', 'newPassword'],
  }
];

export function NotificationTemplateManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const templatesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'notification_templates') : null),
    [firestore]
  );
  const { data: savedTemplates, isLoading } = useCollection<Template>(templatesQuery);

  const [editState, setEditState] = useState<Partial<Template>>({});

  const handleSelect = (id: string) => {
    const saved = savedTemplates?.find(t => t.id === id);
    const def = DEFAULT_TEMPLATES.find(t => t.id === id);
    
    if (saved) {
      setEditState(saved);
    } else if (def) {
      setEditState(def);
    }
    setSelectedId(id);
  };

  const handleSave = async () => {
    if (!firestore || !selectedId || !editState.subject || !editState.htmlContent) return;

    setIsSaving(true);
    const templateRef = doc(firestore, 'notification_templates', selectedId);

    try {
      await setDoc(templateRef, {
        ...editState,
        id: selectedId,
      }, { merge: true });

      toast({
        title: 'Plantilla Guardada',
        description: 'La notificación ha sido actualizada correctamente.',
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo guardar la plantilla en la base de datos.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Tipos de Notificación</CardTitle>
          <CardDescription>Selecciona una plantilla para editar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEFAULT_TEMPLATES.map((t) => (
            <Button
              key={t.id}
              variant={selectedId === t.id ? 'default' : 'outline'}
              className="w-full justify-start text-left h-auto py-3 px-4"
              onClick={() => handleSelect(t.id)}
            >
              <div className="flex flex-col gap-1 overflow-hidden">
                <span className="font-bold truncate">{t.name}</span>
                <span className="text-[10px] opacity-70 uppercase tracking-tighter truncate">{t.id}</span>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {selectedId ? (
          <Card>
            <CardHeader>
              <CardTitle>Editor de Plantilla: {editState.name}</CardTitle>
              <CardDescription>
                Edita el contenido. Las variables entre llaves se llenarán con los datos reales del proveedor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto del Correo</Label>
                <Input
                  id="subject"
                  value={editState.subject || ''}
                  onChange={(e) => setEditState({ ...editState, subject: e.target.value })}
                  placeholder="Ej: Hola {{providerName}}..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenido HTML</Label>
                <Textarea
                  id="content"
                  className="min-h-[300px] font-mono text-sm"
                  value={editState.htmlContent || ''}
                  onChange={(e) => setEditState({ ...editState, htmlContent: e.target.value })}
                  placeholder="Escribe el cuerpo del correo en HTML..."
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Variables Disponibles para esta plantilla:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {editState.variables?.map((v) => (
                    <Badge key={v} variant="secondary" className="font-mono">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground italic mt-2">
                  * Asegúrate de incluir las variables necesarias para que el correo tenga sentido para el destinatario.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Cambios en Plantilla
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
            <Mail className="h-12 w-12 mb-4 opacity-20" />
            <p>Selecciona una plantilla de la lista de la izquierda para comenzar a editar su contenido.</p>
          </div>
        )}
      </div>
    </div>
  );
}
