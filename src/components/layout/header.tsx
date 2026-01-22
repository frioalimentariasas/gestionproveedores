'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/providers', label: 'Gestión de Proveedores' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-start py-4">
        <Link href="/" className="mr-12">
          <Image src="/logo.png" alt="Frio Alimentaria Logo" width={140} height={40} />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-lg transition-all duration-300',
                pathname === link.href
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-foreground/80 hover:bg-primary/90 hover:text-primary-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
