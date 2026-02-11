'use client';

import AuthGuard from '@/components/auth/auth-guard';
import ManageSelectionEvent from '@/components/selection/manage-selection-event';
import { useRole } from '@/hooks/use-role';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ManageSelectionEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { isAdmin, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-4 py-12">
        <ManageSelectionEvent eventId={eventId} />
      </div>
    </AuthGuard>
  );
}
