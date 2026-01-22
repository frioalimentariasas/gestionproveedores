import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-start py-2">
        <Link href="/" className="mr-6">
          <div className="flex flex-col items-start">
            <Image src="/logo.png" alt="Frio Alimentaria Logo" width={140} height={40} />
            <span className="mt-1 text-sm font-semibold">Gestión de Proveedores</span>
          </div>
        </Link>
        <nav className="ml-10 flex items-center space-x-2 text-sm font-medium">
          <Link
            href="/dashboard"
            className="px-3 py-2 rounded-md transition-colors text-foreground hover:bg-primary hover:text-primary-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/providers"
            className="px-3 py-2 rounded-md transition-colors text-foreground hover:bg-primary hover:text-primary-foreground"
          >
            Gestión de Proveedores
          </Link>
        </nav>
      </div>
    </header>
  );
}
