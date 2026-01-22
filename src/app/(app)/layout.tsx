'use client';

import { useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/use-user-data';
import { Sidebar } from '@/components/layout/sidebar';
import { ReactNode, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userData, loading } = useUserData();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if loading is finished and there's no user.
    if (!loading && !userData) {
      router.push('/auth');
    }
  }, [loading, userData, router]);

  // While loading, or if there is no user data yet (even if loading is false for a moment),
  // show a full-page loading screen. This prevents the "flash" of the login page.
  if (loading || !userData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Once loading is complete and we have user data, render the dashboard.
  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={userData.role} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
        {children}
      </main>
    </div>
  );
}
