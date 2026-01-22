'use client';

import { useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/use-user-data';
import { Sidebar } from '@/components/layout/sidebar';
import { ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userData, loading } = useUserData();
  const router = useRouter();

  useEffect(() => {
    // Only perform the check once loading is complete.
    if (!loading && !userData) {
      router.push('/auth/login');
    }
  }, [loading, userData, router]);
  
  // If we are still loading the user data, always show the spinner.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is finished, but there's no user, the useEffect above will trigger a redirect.
  // We show the loader to prevent a flash of an empty/broken page before the redirect happens.
  if (!userData) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If we reach here, it means loading is false and userData is valid. Render the dashboard.
  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={userData.role} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
        {children}
      </main>
    </div>
  );
}
