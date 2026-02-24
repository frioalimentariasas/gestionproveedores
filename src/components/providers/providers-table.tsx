'use client';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
  useUser,
} from '@/firebase';
import { collection, query, doc, updateDoc } from 'firebase/firestore';
import {
  Eye,
  KeyRound,
  Loader2,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  ClipboardList,
  PlusCircle,
  Tag,
  Trash2,
  FileClock,
  ShieldAlert,
  AlertTriangle,
  BellRing,
  Settings2,
  ChevronRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useState } from 'react';
import {
  resetUserPassword,
  toggleUserStatus,
  deleteProvider,
} from '@/actions/user-management';
import {
  notifyProviderFormUnlocked,
  notifyProviderPasswordReset,
  notifyProviderAccountStatus,
  notifyProviderPendingForm,
  notifyProviderFormApproved,
  notifyProviderCorrectionRequested,
} from '@/actions/email';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { EvaluationModal } from './evaluation-modal';
import { cn } from '@/lib/utils';
import { AssignCategoriesModal } from './assign-categories-modal';
import { AssignCriticalityModal } from './assign-criticality-modal';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface Provider {
  id: string;
  businessName: string;
  documentNumber: string;
  email: string;
  formLocked?: boolean;
  disabled?: boolean;
  categoryIds?: string[];
  providerType?: string;
  originSelectionEventId?: string;
  criticalityLevel?: 'Crítico' | 'No Crítico';
  registrationStatus?: 'pending' | 'in_review' | 'approved' | 'correction_requested';
  rejectionReason?: string;
}

export default function ProvidersTable() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const [actionState, setActionState] = useState<{
    [key: string]: boolean;
  }>({});
  
  // States for sub-modals
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const [dialogState, setDialogState] = useState<{
    type: 'password' | 'status' | 'review' | null;
    provider: Provider | null;
    newPassword?: string;
  }>({ type: null, provider: null });

  const [evaluationTarget, setEvaluationTarget] = useState<Provider | null>(null);
  const [assignCategoriesTarget, setAssignCategoriesTarget] = useState<Provider | null>(null);
  const [criticalityTarget, setCriticalityTarget] = useState<Provider | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    provider: Provider | null;
  }>({ isOpen: false, provider: null });

  const [reviewNote, setReviewNote] = useState('');


  const providersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'providers')) : null),
    [firestore]
  );

  const { data: providers, isLoading, error } = useCollection<Provider>(providersQuery);

  const setActionLoading = (providerId: string, isLoading: boolean) => {
    setActionState((prev) => ({ ...prev, [providerId]: isLoading }));
  };

  const handleToggleLock = async (provider: Provider) => {
    if (!firestore) return;
    const isCurrentlyLocked = provider.formLocked ?? false;
    const providerRef = doc(firestore, 'providers', provider.id);
    const dataToUpdate = { formLocked: !isCurrentlyLocked };

    setActionLoading(provider.id, true);
    updateDoc(providerRef, dataToUpdate)
      .then(() => {
        if (isCurrentlyLocked) {
          notifyProviderFormUnlocked({
            providerEmail: provider.email,
            providerName: provider.businessName,
          });
        }
        toast({
          title: 'Estado de Formulario Actualizado',
          description: `El formulario ha sido ${!isCurrentlyLocked ? 'bloqueado' : 'habilitado'}.`,
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: providerRef.path,
          operation: 'update',
          requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setActionLoading(provider.id, false);
      });
  };

  const handleApprove = async () => {
    if (!firestore || !dialogState.provider) return;
    const p = dialogState.provider;
    const providerRef = doc(firestore, 'providers', p.id);
    const updateData = { registrationStatus: 'approved', formLocked: true };

    setActionLoading(p.id, true);
    try {
        await updateDoc(providerRef, updateData);
        notifyProviderFormApproved({
            providerEmail: p.email,
            providerName: p.businessName
        }).catch(console.error);
        toast({ title: 'Registro Aprobado', description: `Se ha notificado a ${p.businessName}.` });
        setDialogState({ type: null, provider: null });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error al aprobar', description: 'No se pudo actualizar el estado.' });
    } finally {
        setActionLoading(p.id, false);
    }
  };

  const handleReject = async () => {
    if (!firestore || !dialogState.provider || !reviewNote.trim()) {
        toast({ variant: 'destructive', title: 'Falta Justificación', description: 'Debe indicar qué debe corregir el proveedor.' });
        return;
    }
    const p = dialogState.provider;
    const providerRef = doc(firestore, 'providers', p.id);
    const updateData = { 
        registrationStatus: 'correction_requested', 
        formLocked: false, 
        rejectionReason: reviewNote 
    };

    setActionLoading(p.id, true);
    try {
        await updateDoc(providerRef, updateData);
        notifyProviderCorrectionRequested({
            providerEmail: p.email,
            providerName: p.businessName,
            reason: reviewNote
        }).catch(console.error);
        toast({ title: 'Solicitud de Corrección Enviada', description: `El formulario de ${p.businessName} ha sido desbloqueado.` });
        setReviewNote('');
        setDialogState({ type: null, provider: null });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error al rechazar', description: 'No se pudo actualizar el estado.' });
    } finally {
        setActionLoading(p.id, false);
    }
  };

  const handleSendReminder = async (provider: Provider) => {
    setActionLoading(provider.id, true);
    try {
      const result = await notifyProviderPendingForm({
        providerEmail: provider.email,
        providerName: provider.businessName,
      });

      if (result.success) {
        toast({
          title: 'Recordatorio Enviado',
          description: `Se ha notificado a ${provider.businessName}.`,
        });
      } else {
        throw new Error(result.error || 'Error al enviar recordatorio.');
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error de Envío',
        description: err.message || 'No se pudo enviar el correo.',
      });
    } finally {
      setActionLoading(provider.id, false);
    }
  };

  const handleResetPassword = async () => {
    const provider = dialogState.provider;
    if (!provider) return;

    setActionLoading(provider.id, true);
    const result = await resetUserPassword(provider.id);

    if (result.success && result.newPassword) {
      await notifyProviderPasswordReset({
        providerEmail: provider.email,
        providerName: provider.businessName,
        newPassword: result.newPassword,
      });
      setDialogState({
        type: 'password',
        provider,
        newPassword: result.newPassword,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al restablecer la contraseña',
        description: result.error || 'Ocurrió un error inesperado.',
      });
      setDialogState({ type: null, provider: null });
    }
    setActionLoading(provider.id, false);
  };

  const handleToggleStatus = async () => {
    const provider = dialogState.provider;
    if (!provider) return;

    const newDisabledStatus = !(provider.disabled ?? false);
    setActionLoading(provider.id, true);

    try {
      const result = await toggleUserStatus(provider.id, newDisabledStatus);

      if (result.success) {
        await notifyProviderAccountStatus({
          providerEmail: provider.email,
          providerName: provider.businessName,
          status: newDisabledStatus ? 'desactivada' : 'activada',
        });
        toast({
          title: 'Estado del Proveedor Actualizado',
          description: `La cuenta ha sido ${newDisabledStatus ? 'desactivada' : 'activada'}.`,
        });
      } else {
        throw new Error(result.error || 'Error al actualizar el estado.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al cambiar estado',
        description: error.message || 'Ocurrió un error inesperado.',
      });
    } finally {
      setActionLoading(provider.id, false);
      setDialogState({ type: null, provider: null });
    }
  };

  const handleDeleteProvider = async () => {
    const provider = deleteDialogState.provider;
    if (!provider) return;

    setActionLoading(provider.id, true);
    const result = await deleteProvider(provider.id);
    setActionLoading(provider.id, false);
    setDeleteDialogState({ isOpen: false, provider: null });

    if (result.success) {
      toast({
        title: 'Proveedor Eliminado',
        description: `El proveedor ${provider.businessName} ha sido eliminado.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: result.error || 'Error al eliminar el proveedor.',
      });
    }
  };

  const getStatusBadge = (status?: string) => {
    // Badges con hover:text-white para cumplir con el requerimiento visual
    switch(status) {
        case 'approved': return <Badge className="bg-green-100 text-green-800 border-green-200 hover:text-white transition-colors">Aprobado</Badge>;
        case 'in_review': return <Badge className="bg-blue-100 text-blue-800 border-blue-200 animate-pulse hover:text-white transition-colors">En Revisión</Badge>;
        case 'correction_requested': return <Badge variant="destructive" className="hover:text-white transition-colors">Requiere Corrección</Badge>;
        default: return <Badge variant="secondary" className="hover:text-white transition-colors">Pendiente</Badge>;
    }
  };

  const getCriticalityBadge = (level?: string) => {
    switch (level) {
      case 'Crítico':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'No Crítico':
        return <Badge variant="outline" className="text-green-600 border-green-600">No Crítico</Badge>;
      default:
        return (
          <Badge variant="outline" className="text-red-500 border-red-500 animate-pulse flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Pendiente
          </Badge>
        );
    }
  };

  const openManagementSheet = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando proveedores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error de Permiso</AlertTitle>
        <AlertDescription>No tienes permiso para ver la lista de proveedores.</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Razón Social</TableHead>
              <TableHead>NIT / Documento</TableHead>
              <TableHead className="text-center">Estado Registro</TableHead>
              <TableHead className="text-center">Criticidad</TableHead>
              <TableHead className="text-center">Acceso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers?.map((provider) => (
              <TableRow
                key={provider.id}
                className={cn(provider.disabled ? 'bg-muted/50 text-muted-foreground' : '')}
              >
                <TableCell className="font-medium max-w-[250px] truncate">
                  {provider.businessName}
                </TableCell>
                <TableCell>{provider.documentNumber}</TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(provider.registrationStatus)}
                </TableCell>
                <TableCell className="text-center">
                  {getCriticalityBadge(provider.criticalityLevel)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={provider.disabled ? 'destructive' : 'default'}>
                    {provider.disabled ? 'Desactivada' : 'Activo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {actionState[provider.id] ? (
                    <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/providers/${provider.id}/view`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Link>
                      </Button>
                      <Button variant="default" size="sm" onClick={() => openManagementSheet(provider)}>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Gestionar
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* --- Management Sheet (Panel Lateral) --- */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md p-0">
          <SheetHeader className="p-6 bg-primary text-primary-foreground">
            <SheetTitle className="text-primary-foreground flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Gestión de Proveedor
            </SheetTitle>
            <SheetDescription className="text-primary-foreground/80 font-bold uppercase">
              {selectedProvider?.businessName}
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-120px)] p-6">
            <div className="space-y-8">
              {/* Seccion 0: Auditoría de Registro */}
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> Auditoría de Registro
                </h4>
                <div className="grid gap-2">
                  <Button 
                    variant="secondary" 
                    className="justify-start font-bold" 
                    onClick={() => { setDialogState({ type: 'review', provider: selectedProvider }); setIsSheetOpen(false); }}
                  >
                    <Eye className="mr-2 h-4 w-4" /> Revisar y Aprobar Registro
                  </Button>
                </div>
              </section>

              <Separator />

              {/* Seccion 1: Trazabilidad y Consulta */}
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Info className="h-3 w-3" /> Trazabilidad y Consulta
                </h4>
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start" asChild onClick={() => setIsSheetOpen(false)}>
                    <Link href={`/providers/${selectedProvider?.id}/view`}>
                      <Eye className="mr-2 h-4 w-4" /> Ver Formulario de Registro
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild onClick={() => setIsSheetOpen(false)}>
                    <Link href={`/providers/${selectedProvider?.id}/evaluations`}>
                      <ClipboardList className="mr-2 h-4 w-4" /> Historial de Evaluaciones
                    </Link>
                  </Button>
                  {selectedProvider?.originSelectionEventId && (
                    <Button variant="outline" className="justify-start" asChild onClick={() => setIsSheetOpen(false)}>
                      <Link href={`/selection/${selectedProvider?.originSelectionEventId}`}>
                        <FileClock className="mr-2 h-4 w-4" /> Ver Selección de Origen
                      </Link>
                    </Button>
                  )}
                </div>
              </section>

              <Separator />

              {/* Seccion 2: Gestión Técnica */}
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gestión Técnica</h4>
                <div className="grid gap-2">
                  <Button variant="secondary" className="justify-start" onClick={() => { setEvaluationTarget(selectedProvider); setIsSheetOpen(false); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Realizar Nueva Evaluación
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => { setAssignCategoriesTarget(selectedProvider); setIsSheetOpen(false); }}>
                    <Tag className="mr-2 h-4 w-4" /> Asignar Categorías
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => { setCriticalityTarget(selectedProvider); setIsSheetOpen(false); }}>
                    <ShieldAlert className="mr-2 h-4 w-4" /> Asignar Nivel de Criticidad
                  </Button>
                  {!selectedProvider?.formLocked && (
                    <Button variant="outline" className="justify-start text-orange-600 hover:text-orange-700" onClick={() => handleSendReminder(selectedProvider!)}>
                      <BellRing className="mr-2 h-4 w-4" /> Enviar Recordatorio de Registro
                    </Button>
                  )}
                </div>
              </section>

              <Separator />

              {/* Seccion 3: Administración de Cuenta */}
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Control de Acceso</h4>
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start" onClick={() => handleToggleLock(selectedProvider!)}>
                    {selectedProvider?.formLocked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                    {selectedProvider?.formLocked ? 'Habilitar Edición de Formulario' : 'Bloquear Formulario'}
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setDialogState({ type: 'password', provider: selectedProvider })}>
                    <KeyRound className="mr-2 h-4 w-4" /> Restablecer Contraseña
                  </Button>
                  <Button variant="outline" className={cn("justify-start", selectedProvider?.disabled ? "text-green-600" : "text-destructive")} onClick={() => setDialogState({ type: 'status', provider: selectedProvider })}>
                    {selectedProvider?.disabled ? <UserCheck className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                    {selectedProvider?.disabled ? 'Activar Cuenta' : 'Desactivar Cuenta'}
                  </Button>
                  {user?.email === 'sistemas@frioalimentaria.com.co' && (
                    <Button variant="ghost" className="justify-start text-destructive hover:bg-destructive/10" onClick={() => setDeleteDialogState({ isOpen: true, provider: selectedProvider })}>
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar Permanentemente
                    </Button>
                  )}
                </div>
              </section>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      
      {/* --- Review Dialog --- */}
      <Dialog 
        open={dialogState.type === 'review'} 
        onOpenChange={(open) => !open && setDialogState({ type: null, provider: null })}
      >
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                    Revisión de Registro ISO 9001
                </DialogTitle>
                <DialogDescription>
                    Audita la información de <strong>{dialogState.provider?.businessName}</strong> antes de dar el aval oficial.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
                <Alert className="bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-xs">
                        Asegúrese de que todos los documentos adjuntos (RUT, Cámara, Cert. Bancaria) coincidan con los datos digitados.
                    </AlertDescription>
                </Alert>

                <div className="space-y-2">
                    <Label htmlFor="note" className="text-sm font-bold">Observaciones / Motivos de Rechazo</Label>
                    <Textarea 
                        id="note"
                        placeholder="Escriba aquí si requiere que el proveedor corrija algún dato específico..."
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Esta nota solo se envía si elige 'Solicitar Correcciones'.</p>
                </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={handleReject}
                    disabled={!reviewNote.trim() || actionState[dialogState.provider?.id || '']}
                >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Solicitar Correcciones
                </Button>
                <Button 
                    variant="default" 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={actionState[dialogState.provider?.id || '']}
                >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Aprobar Registro
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Other Modals --- */}
      <EvaluationModal
        isOpen={!!evaluationTarget}
        onClose={() => setEvaluationTarget(null)}
        provider={evaluationTarget}
      />
      
      <AssignCategoriesModal
        isOpen={!!assignCategoriesTarget}
        onClose={() => setAssignCategoriesTarget(null)}
        provider={assignCategoriesTarget}
      />

      <AssignCriticalityModal
        isOpen={!!criticalityTarget}
        onClose={() => setCriticalityTarget(null)}
        provider={criticalityTarget}
      />

      <Dialog
        open={dialogState.type === 'password'}
        onOpenChange={(open) => !open && setDialogState({ type: null, provider: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState.newPassword ? 'Contraseña Restablecida' : `¿Restablecer contraseña?`}
            </DialogTitle>
            <DialogDescription>
              {dialogState.newPassword ? (
                <>La nueva contraseña es: <strong className="text-lg">{dialogState.newPassword}</strong><br />Se envió un correo al proveedor.</>
              ) : 'Se generará una nueva contraseña y se enviará al proveedor.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {dialogState.newPassword ? <Button onClick={() => setDialogState({ type: null, provider: null })}>Cerrar</Button> : (
              <><Button variant="outline" onClick={() => setDialogState({ type: null, provider: null })}>Cancelar</Button>
                <Button onClick={handleResetPassword} disabled={actionState[dialogState.provider?.id || '']}>
                  {actionState[dialogState.provider?.id || ''] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sí, restablecer'}
                </Button></>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog
        open={dialogState.type === 'status'}
        onOpenChange={(open) => !open && setDialogState({ type: null, provider: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambio de estado?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a <strong>{dialogState.provider?.disabled ? 'activar' : 'desactivar'}</strong> la cuenta de <strong>{dialogState.provider?.businessName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteDialogState.isOpen}
        onOpenChange={(open) => !open && setDeleteDialogState({ isOpen: false, provider: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminará a <strong>{deleteDialogState.provider?.businessName}</strong>, su cuenta y todos sus datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteProvider}>
              Eliminar para siempre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}