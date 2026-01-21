'use client';

import { useUserData } from "@/hooks/use-user-data";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/firestore";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Provider {
    id: string;
    companyName: string;
    email: string;
    status: 'approved' | 'pending' | 'rejected';
}

export default function ProvidersPage() {
    const { userData, loading: userLoading } = useUserData();
    const router = useRouter();
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchProviders = async () => {
        setLoading(true);
        const q = query(collection(db, "providers"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const providersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Provider));
        setProviders(providersList);
        setLoading(false);
    };

    useEffect(() => {
        if (!userLoading && userData?.role !== 'admin') {
            router.push('/dashboard');
        } else if (userData?.role === 'admin') {
            fetchProviders();
        }
    }, [userData, userLoading, router]);

    const handleUpdateStatus = async (providerId: string, status: Provider['status']) => {
        try {
            const providerRef = doc(db, 'providers', providerId);
            await updateDoc(providerRef, { status });
            toast({ title: "Estado actualizado", description: "El estado del proveedor ha sido actualizado." });
            fetchProviders(); // Refresh list
        } catch (error) {
            console.error("Error updating provider status:", error);
            toast({ variant: 'destructive', title: "Error", description: "No se pudo actualizar el estado del proveedor." });
        }
    };
    
    const handleDeleteProvider = async (providerId: string) => {
        // Note: This only deletes the Firestore document. 
        // Deleting the user from Firebase Auth requires a backend function (e.g., Cloud Function) for security.
        try {
            await deleteDoc(doc(db, "providers", providerId));
            toast({ title: "Proveedor eliminado", description: "El proveedor ha sido eliminado de la base de datos." });
            fetchProviders(); // Refresh list
        } catch (error) {
            console.error("Error deleting provider:", error);
            toast({ variant: 'destructive', title: "Error", description: "No se pudo eliminar al proveedor." });
        }
    };


    if (userLoading || !userData || userData.role !== 'admin') {
        return <div className="flex items-center justify-center h-full">Cargando...</div>;
    }
  
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestionar Proveedores</CardTitle>
                <CardDescription>Aprobar, desactivar o gestionar proveedores registrados.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Razón Social</TableHead>
                            <TableHead className="hidden sm:table-cell">Correo electrónico</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead><span className="sr-only">Acciones</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow><TableCell colSpan={4} className="text-center">Cargando proveedores...</TableCell></TableRow>
                        ) : providers.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center">No hay proveedores registrados.</TableCell></TableRow>
                        ) : (
                            providers.map((provider) => (
                            <TableRow key={provider.id}>
                                <TableCell className="font-medium">{provider.companyName}</TableCell>
                                <TableCell className="hidden sm:table-cell">{provider.email}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        provider.status === 'approved' ? 'default'
                                        : provider.status === 'pending' ? 'secondary'
                                        : 'destructive'
                                    } className="capitalize">
                                        {
                                            { approved: 'Aprobado', pending: 'Pendiente', rejected: 'Rechazado' }[provider.status]
                                        }
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {provider.status === 'pending' || provider.status === 'rejected' ? (
                                                 <DropdownMenuItem onClick={() => handleUpdateStatus(provider.id, 'approved')}>Aprobar</DropdownMenuItem>
                                            ): null}
                                             {provider.status === 'approved' ? (
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(provider.id, 'pending')}>Marcar como Pendiente</DropdownMenuItem>
                                            ) : null}
                                            {provider.status !== 'rejected' ? (
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(provider.id, 'rejected')}>Rechazar</DropdownMenuItem>
                                            ) : null }
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProvider(provider.id)}>Eliminar</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
