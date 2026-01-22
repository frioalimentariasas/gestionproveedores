'use client';

import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from './provider';

// This is a client-side only provider that ensures that the Firebase app
// is initialized only once. It is a wrapper around the `FirebaseProvider`.
// It is useful for preventing the "Firebase app already initialized" error.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const firebaseApp = initializeFirebase();
  return <FirebaseProvider firebaseApp={firebaseApp}>{children}</FirebaseProvider>;
}
