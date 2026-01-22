import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between py-2">
        <Link href="/" className="mr-6">
          <div className="flex flex-col items-start">
            <Image src="/logo.png" alt="Frio Alimentaria Logo" width={140} height={40} />
            <span className="mt-1 text-sm font-semibold">Gestión de Proveedores</span>
          </div>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Dashboard
          </Link>
          <Link
            href="/providers"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Gestión de Proveedores
          </Link>
        </nav>
      </div>
    </header>
  );
}
