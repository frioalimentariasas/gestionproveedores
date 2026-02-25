
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
import { LogOut, ChevronDown, User as UserIcon, Menu, LayoutDashboard, ClipboardCheck, Users, Tags, BarChart3, Settings, Mail, FileSearch, Home, ClipboardList, BookOpen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { useRole } from '@/hooks/use-role';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

const adminNavLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/selection', label: 'Procesos de Selección', icon: ClipboardCheck },
  { href: '/providers', label: 'Gestión de Proveedores', icon: Users },
  { href: '/categories', label: 'Categorías', icon: Tags },
  { href: '/comparison', label: 'Comparador de Desempeño', icon: BarChart3 },
  { href: '/parametrizacion', label: 'Configuración de Pesos', icon: Settings },
  { href: '/admin/notifications', label: 'Plantillas de Email', icon: Mail },
  { href: '/admin/form-preview', label: 'Vista Previa Formulario', icon: FileSearch },
  { href: '/manual', label: 'Manual de Usuario', icon: BookOpen },
];

const providerNavLinks = [
  { href: '/providers/form', label: 'Mi Perfil de Proveedor', icon: UserIcon },
  { href: '/evaluations', label: 'Mis Evaluaciones ISO', icon: ClipboardList },
  { href: '/manual', label: 'Guía de Ayuda', icon: BookOpen },
];

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

  const displayName = !isAdmin && providerData?.businessName 
    ? providerData.businessName 
    : (user?.displayName || user?.email);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl h-24 items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-6">
          {/* Logo Branding */}
          <div className="flex flex-col items-center shrink-0">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Frio Alimentaria Logo"
                width={130}
                height={36}
                priority
              />
            </Link>
            {isAdmin && !loading && (
              <h1 className="text-[10px] font-bold tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase mt-1 leading-none text-center w-full">
                Gestión de Proveedores
              </h1>
            )}
          </div>

          {/* Menu Drawer Trigger */}
          {user && !loading && (
            <div className="flex items-center gap-2 border-l pl-6 ml-2 h-12">
              <Sheet>
                <SheetTrigger asChild>
                  {/* Menu Button - Custom Hover/Active Resaltado en Azul Primario */}
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 px-3 hover:bg-primary hover:text-white data-[state=open]:bg-primary data-[state=open]:text-white transition-colors rounded-none h-12 group"
                  >
                    <Menu className="h-6 w-6 text-primary group-hover:text-white group-data-[state=open]:text-white transition-colors" />
                    <span className="font-bold text-xs uppercase tracking-tight hidden md:inline-block">Menú Principal</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 sm:max-w-xs">
                  <SheetHeader className="p-6 bg-primary text-primary-foreground text-left">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-1 rounded-sm">
                        <Image
                          src="/logo.png"
                          alt="Logo"
                          width={80}
                          height={22}
                        />
                      </div>
                      <SheetTitle className="text-primary-foreground text-lg">Menú Principal</SheetTitle>
                    </div>
                    <SheetDescription className="text-primary-foreground/70 text-xs">
                      Plataforma de Gestión de Proveedores FAL
                    </SheetDescription>
                  </SheetHeader>
                  
                  <ScrollArea className="h-[calc(100vh-140px)]">
                    <nav className="flex flex-col gap-1 p-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                        Navegación
                      </p>
                      {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                          <SheetClose asChild key={link.href}>
                            <Link
                              href={link.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium",
                                isActive 
                                  ? "bg-primary text-primary-foreground shadow-sm" 
                                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                              {link.label}
                            </Link>
                          </SheetClose>
                        );
                      })}
                      
                      <Separator className="my-4" />
                      
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                        Cuenta
                      </p>
                      <SheetClose asChild>
                        <Link
                          href="/account"
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground",
                            pathname === '/account' && "bg-muted text-foreground"
                          )}
                        >
                          <UserIcon className="h-5 w-5 text-muted-foreground" />
                          Mi Perfil / Configuración
                        </Link>
                      </SheetClose>
                      
                      <Button 
                        variant="ghost" 
                        className="justify-start gap-3 px-3 py-6 mt-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5" />
                        Cerrar Sesión
                      </Button>
                    </nav>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              {/* Home Icon Button - Custom Hover Resaltado */}
              <Button 
                variant="ghost" 
                size="icon" 
                asChild 
                className="hover:bg-primary hover:text-white transition-colors text-primary h-12 w-12 shrink-0"
              >
                <Link href="/">
                  <Home className="h-6 w-6" />
                  <span className="sr-only">Inicio</span>
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 ml-4 shrink-0">
          {loading ? (
            <Skeleton className="h-9 w-28" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* User Button - Custom Hover Resaltado con azul y texto blanco */}
                <Button 
                  variant="outline" 
                  className="max-w-[400px] truncate uppercase border-primary/20 hover:bg-primary hover:text-white hover:border-primary data-[state=open]:bg-primary data-[state=open]:text-white transition-colors duration-200"
                >
                  <span className="truncate">{displayName}</span>
                  <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Mi Cuenta</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/manual" className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Manual de Usuario</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/notifications" className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Plantillas de Email</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
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
