
'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { NotificationTemplateManager } from '@/components/notifications/notification-template-manager';

export default function AdminNotificationsPage() {
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
        <div className="flex items-center gap-4 mb-8 justify-center">
            <Mail className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
                Gestión de Notificaciones
            </h1>
        </div>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Personaliza los mensajes de correo electrónico que envía el sistema. Utiliza las variables disponibles para personalizar cada mensaje automáticamente.
        </p>
        <NotificationTemplateManager />
      </div>
    </AuthGuard>
  );
}
