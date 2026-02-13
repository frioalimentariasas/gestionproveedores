import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/header';
import { FirebaseClientProvider } from '@/firebase';
import { FirebaseErrorListener } from '@/components/firebase/error-listener';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Using an inline SVG data URI to force browsers to ignore cached favicons.
const faviconHref = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>❄️</text></svg>";


export const metadata: Metadata = {
  title: 'Gestión de Proveedores',
  description: 'Plataforma de gestión de proveedores para Frio Alimentaria.',
  icons: {
    icon: faviconHref,
    apple: faviconHref,
    shortcut: faviconHref,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <FirebaseClientProvider>
          <Header />
          <main>{children}</main>
          <Toaster />
          <FirebaseErrorListener />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
