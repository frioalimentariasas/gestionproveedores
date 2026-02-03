'use client';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import { collection, query, doc, updateDoc } from 'firebase/firestore';
import { Eye, KeyRound, Loader2, Lock, Unlock, UserX } from 'lucide-react';
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
import { notifyProviderFormUnlocked } from '@/actions/email';

// Define the shape of a provider document
interface Provider {
  id: string;
  businessName: string;
  documentNumber: string;
  email: string;
  formLocked?: boolean;
}

export default function ProvidersTable() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const providersQuery = useMemoFirebase(
    () => query(collection(firestore, 'providers')),
    [firestore]
  );

  const { data: providers, isLoading, error } = useCollection<Provider>(providersQuery);

  const handleToggleLock = (
    provider: Provider,
    currentStatus: boolean | undefined
  ) => {
    if (!firestore) return;
    const isCurrentlyLocked = currentStatus ?? false;
    const providerRef = doc(firestore, 'providers', provider.id);
    const dataToUpdate = { formLocked: !isCurrentlyLocked };

    updateDoc(providerRef, dataToUpdate)
      .then(() => {
        // If the form was locked, it is now unlocked, so send notification.
        if (isCurrentlyLocked) {
          notifyProviderFormUnlocked({
            providerEmail: provider.email,
            providerName: provider.businessName,
          }).catch(console.error);
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
      });
  };
  
  const handleUpdatePassword = () => {
    toast({
        title: 'Próximamente',
        description: 'La función para actualizar la contraseña estará disponible pronto.',
    });
  };

  const handleDeactivateProvider = () => {
      toast({
          title: 'Próximamente',
          description: 'La función para desactivar proveedores estará disponible pronto.',
      });
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
          No tienes permiso para ver la lista de proveedores. Contacta a un administrador para que te asigne el rol.
        </AlertDescription>
      </Alert>
    );
  }

  if (!providers || providers.length === 0) {
    return <p className="text-center text-muted-foreground">No hay proveedores registrados todavía.</p>;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Razón Social</TableHead>
            <TableHead>NIT / Documento</TableHead>
            <TableHead>Email de Contacto</TableHead>
            <TableHead className="text-center">Estado Formulario</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell className="font-medium">{provider.businessName}</TableCell>
              <TableCell>{provider.documentNumber}</TableCell>
              <TableCell>{provider.email}</TableCell>
              <TableCell className="text-center">
                 <Badge variant={provider.formLocked ? 'outline' : 'secondary'}>
                  {provider.formLocked ? 'Bloqueado' : 'Habilitado'}
                 </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/providers/${provider.id}/view`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver Formulario</span>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver Formulario</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleLock(provider, provider.formLocked)}
                        >
                          {provider.formLocked ? (
                            <Unlock className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {provider.formLocked ? 'Habilitar Edición' : 'Bloquear Formulario'}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{provider.formLocked ? 'Habilitar Edición' : 'Bloquear Formulario'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleUpdatePassword}>
                          <KeyRound className="h-4 w-4" />
                          <span className="sr-only">Actualizar Contraseña</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Actualizar Contraseña</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={handleDeactivateProvider}
                        >
                          <UserX className="h-4 w-4" />
                          <span className="sr-only">Desactivar Proveedor</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Desactivar Proveedor</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
