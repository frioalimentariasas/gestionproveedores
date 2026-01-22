'use client';

import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '../provider';

type State = {
  user: User | null;
  loading: boolean;
  error: Error | null;
};

// This is the initial state of the hook.
// We use `loading: true` to indicate that we are checking for the user's auth state.
// This is important for preventing flashes of unauthenticated content.
const INITIAL_STATE: State = {
  user: null,
  loading: true,
  error: null,
};

let state: State = INITIAL_STATE;
const listeners = new Set<() => void>();

function useAuthStore(auth: Auth | null) {
  useEffect(() => {
    if (!auth) return;

    // We set the initial state here to ensure that the server-side rendering
    // and client-side rendering are consistent.
    state = INITIAL_STATE;

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        state = { ...state, user, loading: false };
        listeners.forEach((l) => l());
      },
      (error) => {
        state = { ...state, error, loading: false };
        listeners.forEach((l) => l());
      }
    );

    return () => unsubscribe();
  }, [auth]);

  const store = useMemo(
    () => ({
      subscribe: (onStoreChange: () => void) => {
        listeners.add(onStoreChange);
        return () => listeners.delete(onStoreChange);
      },
      getSnapshot: () => state,
    }),
    []
  );

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

// This hook provides the current user's authentication state.
// It is a simple wrapper around the `useAuthStore` hook.
// It is useful for components that need to know if a user is logged in or not.
export function useUser() {
  const auth = useAuth();
  return useAuthStore(auth);
}
