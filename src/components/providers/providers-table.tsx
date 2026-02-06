'use client';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
} from '@/actions/user-management';
import {
  notifyProviderFormUnlocked,
  notifyProviderPasswordReset,
  notifyProviderAccountStatus,
} from '@/actions/email';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { EvaluationModal } from './evaluation-modal';
import { cn } from '@/lib/utils';
import { AssignCategoriesModal } from './assign-categories-modal';

interface Provider {
  id: string;
  businessName: string;
  documentNumber: string;
  email: string;
  formLocked?: boolean;
  disabled?: boolean;
  categoryIds?: string[];
  providerType?: string;
}

export default function ProvidersTable() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [actionState, setActionState] = useState<{
    [key: string]: boolean;
  }>({});
  const [dialogState, setDialogState] = useState<{
    type: 'password' | 'status' | null;
    provider: Provider | null;
    newPassword?: string;
  }>({ type: null, provider: null });

  const [evaluationTarget, setEvaluationTarget] = useState<Provider | null>(null);
  const [assignCategoriesTarget, setAssignCategoriesTarget] = useState<Provider | null>(null);


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
          description: `El formulario del proveedor ha sido ${
            !isCurrentlyLocked ? 'bloqueado' : 'habilitado para edición'
          }.`,
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
          description: `La cuenta de ${
            provider.businessName
          } ha sido ${newDisabledStatus ? 'desactivada' : 'activada'}.`,
        });
      } else {
        throw new Error(
          result.error || 'Error al actualizar el estado del usuario.'
        );
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
        <AlertDescription>
          No tienes permiso para ver la lista de proveedores. Contacta a un
          administrador para que te asigne el rol.
        </AlertDescription>
      </Alert>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No hay proveedores registrados todavía.
      </p>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razón Social</TableHead>
              <TableHead>NIT / Documento</TableHead>
              <TableHead>Email de Contacto</TableHead>
              <TableHead className="text-center">Formulario</TableHead>
              <TableHead className="text-center">Estado Cuenta</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((provider) => (
              <TableRow
                key={provider.id}
                className={cn(
                  provider.disabled ? 'bg-muted/50 text-muted-foreground' : ''
                )}
              >
                <TableCell className="font-medium">
                  {provider.businessName}
                </TableCell>
                <TableCell>{provider.documentNumber}</TableCell>
                <TableCell>{provider.email}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={provider.formLocked ? 'outline' : 'secondary'}>
                    {provider.formLocked ? 'Bloqueado' : 'Habilitado'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={provider.disabled ? 'destructive' : 'default'}>
                    {provider.disabled ? 'Desactivada' : 'Activada'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {actionState[provider.id] ? (
                    <div className="flex items-center justify-end pr-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/providers/${provider.id}/view`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ver Formulario</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" asChild>
                            <Link href={`/providers/${provider.id}/evaluations`}>
                              <ClipboardList className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Historial de Evaluaciones</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEvaluationTarget(provider)}>
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Nueva Evaluación</p></TooltipContent>
                      </Tooltip>
                       <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setAssignCategoriesTarget(provider)}>
                            <Tag className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Asignar Categorías</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleLock(provider)}>
                            {provider.formLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{provider.formLocked ? 'Habilitar Edición' : 'Bloquear Formulario'}</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setDialogState({ type: 'password', provider: provider })}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Restablecer Contraseña</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className={cn(provider.disabled ? 'text-green-600 focus:text-green-700' : 'text-destructive focus:text-destructive')} onClick={() => setDialogState({ type: 'status', provider: provider })}>
                            {provider.disabled ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{provider.disabled ? 'Activar Proveedor' : 'Desactivar Proveedor'}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
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

      <Dialog
        open={dialogState.type === 'password'}
        onOpenChange={(open) =>
          !open && setDialogState({ type: null, provider: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState.newPassword
                ? 'Contraseña Restablecida'
                : `¿Restablecer contraseña para ${dialogState.provider?.businessName}?`}
            </DialogTitle>
            <DialogDescription>
              {dialogState.newPassword ? (
                <>
                  La nueva contraseña es:{' '}
                  <strong className="text-lg">{dialogState.newPassword}</strong>
                  <br />
                  Se ha enviado un correo al proveedor con esta información.
                  Puede cerrar esta ventana.
                </>
              ) : (
                'Se generará una nueva contraseña y se enviará al correo del proveedor. Esta acción no se puede deshacer.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {dialogState.newPassword ? (
              <Button onClick={() => setDialogState({ type: null, provider: null })}>
                Cerrar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setDialogState({ type: null, provider: null })}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={actionState[dialogState.provider?.id || '']}
                >
                  {actionState[dialogState.provider?.id || ''] ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Sí, restablecer'
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog
        open={dialogState.type === 'status'}
        onOpenChange={(open) =>
          !open && setDialogState({ type: null, provider: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a{' '}
              <strong>
                {dialogState.provider?.disabled ? 'activar' : 'desactivar'}
              </strong>{' '}
              la cuenta del proveedor{' '}
              <strong>{dialogState.provider?.businessName}</strong>.
              {dialogState.provider?.disabled
                ? ' Podrá volver a iniciar sesión.'
                : ' No podrá iniciar sesión hasta que se reactive.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              {dialogState.provider?.disabled ? 'Activar' : 'Desactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
