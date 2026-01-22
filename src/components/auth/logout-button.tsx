'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LogoutButton() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cerrar la sesión. Por favor, inténtelo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button onClick={handleLogout} variant="outline">
      <LogOut className="mr-2 h-4 w-4" />
      Cerrar Sesión
    </Button>
  );
}
