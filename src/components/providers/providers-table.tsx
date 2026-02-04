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
  MoreHorizontal,
  ClipboardList,
  PlusCircle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
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
import { type EvaluationType } from '@/lib/evaluations';
import { EvaluationModal } from './evaluation-modal';
import { cn } from '@/lib/utils';

interface Provider {
  id: string;
  businessName: string;
  documentNumber: string;
  email: string;
  formLocked?: boolean;
  disabled?: boolean;
}

export default function ProvidersTable() {
  const firestore = useFirestore();
  const { toast } = useToast();

  // State management for modals
  const [actionState, setActionState] = useState<{
    [key: string]: boolean;
  }>({});
  const [dialogState, setDialogState] = useState<{
    type: 'password' | 'status' | null;
    provider: Provider | null;
    newPassword?: string;
  }>({ type: null, provider: null });

  const [evaluationTarget, setEvaluationTarget] = useState<{ provider: Provider; type: EvaluationType } | null>(null);

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
    // Use non-blocking update for better UI responsiveness
    updateDoc(providerRef, dataToUpdate)
      .then(() => {
        if (isCurrentlyLocked) {
          // Send notification only when unlocking
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
                className={
                  provider.disabled ? 'bg-muted/50 text-muted-foreground' : ''
                }
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/providers/${provider.id}/view`} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Ver Formulario</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/providers/${provider.id}/evaluations`} className="cursor-pointer">
                            <ClipboardList className="mr-2 h-4 w-4" />
                            <span>Historial de Evaluaciones</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            <span>Nueva Evaluación</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                onClick={() =>
                                  setEvaluationTarget({ provider, type: 'provider_selection' })
                                }
                              >
                                Evaluación de Selección
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                onClick={() =>
                                  setEvaluationTarget({ provider, type: 'provider_performance' })
                                }
                              >
                                Evaluación de Desempeño
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                onClick={() =>
                                  setEvaluationTarget({ provider, type: 'contractor_evaluation' })
                                }
                              >
                                Evaluación de Contratista
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleLock(provider)}>
                          {provider.formLocked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                          <span>
                            {provider.formLocked
                              ? 'Habilitar Edición'
                              : 'Bloquear Formulario'}
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setDialogState({ type: 'password', provider: provider })
                          }
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          <span>Restablecer Contraseña</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={cn(
                            provider.disabled
                              ? 'text-green-600 focus:text-green-700'
                              : 'text-destructive focus:text-destructive'
                          )}
                          onClick={() =>
                            setDialogState({ type: 'status', provider: provider })
                          }
                        >
                          {provider.disabled ? (
                            <UserCheck className="mr-2 h-4 w-4" />
                          ) : (
                            <UserX className="mr-2 h-4 w-4" />
                          )}
                          <span>
                            {provider.disabled ? 'Activar Proveedor' : 'Desactivar Proveedor'}
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        provider={evaluationTarget?.provider ?? null}
        evaluationType={evaluationTarget?.type ?? null}
      />

      {/* Password Reset Dialog */}
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
      
      {/* Status Change Dialog */}
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
