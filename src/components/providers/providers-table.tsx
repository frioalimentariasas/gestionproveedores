'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, updateDoc } from 'firebase/firestore';
import { Loader2, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';

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

  const handleToggleLock = async (
    providerId: string,
    currentStatus: boolean | undefined
  ) => {
    if (!firestore) return;
    const isCurrentlyLocked = currentStatus ?? false;
    const providerRef = doc(firestore, 'providers', providerId);
    try {
      await updateDoc(providerRef, { formLocked: !isCurrentlyLocked });
      toast({
        title: 'Estado de Formulario Actualizado',
        description: `El formulario del proveedor ha sido ${
          !isCurrentlyLocked ? 'bloqueado' : 'habilitado para edición'
        }.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado del formulario.',
      });
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
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem>Ver Formulario</DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleLock(provider.id, provider.formLocked)}
                    >
                      {provider.formLocked ? 'Habilitar Edición' : 'Bloquear Formulario'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>Actualizar Contraseña</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      Desactivar Proveedor
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
