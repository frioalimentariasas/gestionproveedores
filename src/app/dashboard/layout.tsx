'use client';

import { useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/use-user-data';
import { Sidebar } from '@/components/layout/sidebar';
import { ReactNode, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { userData, loading, user } = useUserData();
  const router = useRouter();

  useEffect(() => {
    // This effect's only job is to redirect if the user is definitively logged out.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // 1. If authentication state is being determined, always show a skeleton.
  //    This is the primary guard against race conditions.
  if (loading) {
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

  // 2. After loading, if we have user data, we can safely render the dashboard.
  if (userData) {
    return (
      <div className="flex min-h-screen">
        <Sidebar userRole={userData.role} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
          {children}
        </main>
      </div>
    );
  }

  // 3. If loading is finished, but there's no user (and thus no userData), the useEffect
  //    will handle the redirect. While that happens, render a skeleton to avoid content flashes.
  //    This also safely handles any error state where a user is authenticated but has no profile data.
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
