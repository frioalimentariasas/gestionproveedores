import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This file provides the Firebase context and hooks.
// It is used to share the Firebase app and services between components.
// You should not need to modify this file.

type FirebaseContextValue = {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
};

const FirebaseContext = createContext<FirebaseContextValue>({
  app: null,
  auth: null,
  firestore: null,
});

export function FirebaseProvider({
  children,
  firebaseApp,
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
}) {
  const [app, setApp] = useState<FirebaseApp | null>(null);

  useEffect(() => {
    setApp(firebaseApp);
  }, [firebaseApp]);

  const auth = useMemo(() => (app ? getAuth(app) : null), [app]);
  const firestore = useMemo(() => (app ? getFirestore(app) : null), [app]);

  return (
    <FirebaseContext.Provider value={{ app, auth, firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}

export function useFirebaseApp() {
  return useFirebase().app;
}

export function useAuth() {
  return useFirebase().auth;
}

export function useFirestore() {
  return useFirebase().firestore;
}
