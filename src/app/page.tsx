'use client';

import AuthGuard from '@/components/auth/auth-guard';

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="container mx-auto p-4">
        <h1 className="my-8 text-center text-4xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-center text-muted-foreground">
          Aquí se mostrarán los resúmenes de informes.
        </p>
      </div>
    </AuthGuard>
  );
}
