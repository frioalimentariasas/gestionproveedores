'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth, useUser } from '@/firebase';
import { Button } from '../ui/button';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/providers', label: 'Gestión de Proveedores' },
  ];

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: 'Has cerrado sesión',
        description: 'Vuelve pronto.',
      });
      router.push('/auth/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al cerrar sesión',
        description: 'Por favor, inténtalo de nuevo.',
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-24 items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Frio Alimentaria Logo"
              width={140}
              height={40}
            />
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-4 py-2 transition-all duration-300',
                  pathname === link.href
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-foreground/80 hover:bg-primary/10'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {!loading &&
            (user ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
            ))}
        </div>
      </div>
    </header>
  );
}
