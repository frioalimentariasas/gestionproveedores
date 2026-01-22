'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard } from 'lucide-react';
import { Logo } from '@/components/logo';
import { LogoutButton } from '@/components/auth/logout-button';
import { cn } from '@/lib/utils';

interface SidebarProps {
    userRole: 'admin' | 'provider';
}

const NavLink = ({ href, children, icon }: { href: string; children: React.ReactNode; icon: React.ReactNode }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "bg-muted text-primary"
            )}
        >
            {icon}
            {children}
        </Link>
    );
};


export function Sidebar({ userRole }: SidebarProps) {
  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b px-6">
                 <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Logo className="w-32" />
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium">
                    <NavLink href="/" icon={<LayoutDashboard className="h-4 w-4" />}>
                        Dashboard
                    </NavLink>
                    {userRole === 'admin' && (
                        <NavLink href="/providers" icon={<Users className="h-4 w-4" />}>
                            Gestionar Proveedores
                        </NavLink>
                    )}
                </nav>
            </div>
            <div className="mt-auto p-4">
                <LogoutButton />
            </div>
        </div>
    </aside>
  );
}
