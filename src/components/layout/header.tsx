'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  useAuth,
  useUser,
  useFirestore,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '../ui/button';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { useRole } from '@/hooks/use-role';

const adminNavLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/providers', label: 'Gestión de Proveedores' },
  { href: '/categories', label: 'Categorías' },
];

const providerNavLinks = [{ href: '/providers/form', label: 'Mi Perfil' }];

interface ProviderData {
  businessName?: string;
}

export default function Header() {
  const pathname = usePathname();
  const { user, loading: userLoading } = useUser();
  const { isAdmin, isLoading: roleLoading } = useRole();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const providerDocRef = useMemoFirebase(() => {
    if (!user || !firestore || isAdmin) return null;
    return doc(firestore, 'providers', user.uid);
  }, [user, firestore, isAdmin]);

  const { data: providerData, isLoading: providerDataLoading } =
    useDoc<ProviderData>(providerDocRef);

  const loading =
    userLoading || roleLoading || (!isAdmin && providerDataLoading);
  const navLinks = isAdmin ? adminNavLinks : providerNavLinks;

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
      <div className="container flex h-24 items-center justify-between px-4">
        <div className="flex items-center gap-12">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Frio Alimentaria Logo"
              width={140}
              height={40}
            />
          </Link>
          {user && !loading && (
            <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
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
          )}
        </div>
        <div className="flex items-center gap-4">
          {loading ? (
            <Skeleton className="h-9 w-28" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {providerData?.businessName || user.displayName || user.email}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/account">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Mi Cuenta</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/auth/login">Iniciar Sesión</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
