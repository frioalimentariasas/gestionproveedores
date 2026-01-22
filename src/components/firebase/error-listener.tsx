'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

// This is a client component that listens for permission errors
// and displays a toast notification.
// It also logs the error to the console for debugging purposes.
// This is useful for developers to understand why a request was denied.
// This component should be placed in the root layout of the application.
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error('Firestore Permission Error:', error.toObject());

      toast({
        variant: 'destructive',
        title: 'Error de Permiso',
        description:
          'No tienes permiso para realizar esta acción. Contacta al administrador.',
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
