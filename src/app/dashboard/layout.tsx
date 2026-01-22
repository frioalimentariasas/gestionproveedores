'use client';

import { useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/use-user-data';
import { Sidebar } from '@/components/layout/sidebar';
import { ReactNode, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserDataProvider } from '@/hooks/user-provider';

function DashboardGate({ children }: { children: ReactNode }) {
  const { userData, loading } = useUserData();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !userData) {
      router.push('/');
    }
  }, [loading, userData, router]);

  if (loading || !userData) {
    return (
      <div className="flex min-h-screen w-full">
        <div className="hidden md:flex flex-col w-64 border-r p-4 gap-4 bg-background">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full mt-auto" />
        </div>
        <div className="flex-1 p-8 bg-muted/40">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={userData.role} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
        {children}
      </main>
    </div>
  );
}


export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <UserDataProvider>
      <DashboardGate>{children}</DashboardGate>
    </UserDataProvider>
  );
}
