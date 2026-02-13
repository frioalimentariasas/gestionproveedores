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

// Using a custom, multi-layered SVG data URI to create a glow effect and force browsers to ignore cached favicons.
const faviconHref = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><filter id='glow'><feGaussianBlur stdDeviation='2.5' /></filter><g id='arm_blue'><path d='M 0 -38 L 0 0' stroke='%2300BFFF' stroke-width='9' stroke-linecap='round'/><path d='M 0 -38 L -7 -31 M 0 -38 L 7 -31' stroke='%2300BFFF' stroke-width='8' stroke-linecap='round'/><path d='M -10 -15 L 10 -15' stroke='%2300BFFF' stroke-width='6' stroke-linecap='round'/><path d='M -12 -25 L 12 -25' stroke='%2300BFFF' stroke-width='7' stroke-linecap='round'/></g><g id='arm_white'><path d='M 0 -38 L 0 0' stroke='white' stroke-width='5' stroke-linecap='round'/><path d='M 0 -38 L -6 -32 M 0 -38 L 6 -32' stroke='white' stroke-width='4' stroke-linecap='round'/><path d='M -8 -15 L 8 -15' stroke='white' stroke-width='3' stroke-linecap='round'/><path d='M -10 -25 L 10 -25' stroke='white' stroke-width='4' stroke-linecap='round'/></g></defs><g transform='translate(50,50)' filter='url(%23glow)'><use href='%23arm_blue' /><use href='%23arm_blue' transform='rotate(60)' /><use href='%23arm_blue' transform='rotate(120)' /><use href='%23arm_blue' transform='rotate(180)' /><use href='%23arm_blue' transform='rotate(240)' /><use href='%23arm_blue' transform='rotate(300)' /></g><g transform='translate(50,50)'><use href='%23arm_white' /><use href='%23arm_white' transform='rotate(60)' /><use href='%23arm_white' transform='rotate(120)' /><use href='%23arm_white' transform='rotate(180)' /><use href='%23arm_white' transform='rotate(240)' /><use href='%23arm_white' transform='rotate(300)' /></g></svg>";


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
