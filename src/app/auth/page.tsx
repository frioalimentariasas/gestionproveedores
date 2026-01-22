'use client';

import { useRouter, redirect } from 'next/navigation';
import { useUserData } from '@/hooks/use-user-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, UserCog, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function AuthPage() {
    const { userData, loading } = useUserData();
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (userData) {
        redirect('/');
    }

    return (
        <Card className="w-full max-w-md animate-in fade-in-50">
            <CardHeader className="text-center">
                 <div className="mx-auto mb-4">
                    <Logo className="w-48" />
                </div>
                <CardTitle className="font-headline text-3xl">Bienvenido</CardTitle>
                <CardDescription>Seleccione el portal al que desea acceder.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button size="lg" onClick={() => router.push('/auth/login')}>
                    <Building className="mr-2" />
                    Portal de Proveedores
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push('/auth/login/admin')}>
                    <UserCog className="mr-2" />
                    Portal de Administración
                </Button>
            </CardContent>
        </Card>
    );
}
