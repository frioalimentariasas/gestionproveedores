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

// This is a global store. It's safe for SSR because:
// 1. It's only written to on the client (inside useEffect).
// 2. On the server, we always return INITIAL_STATE via getServerSnapshot.
let state: State = INITIAL_STATE;
const listeners = new Set<() => void>();

function onStateChange(newState: State) {
  state = newState;
  listeners.forEach((l) => l());
}

function useAuthStore(auth: Auth | null) {
  useEffect(() => {
    if (!auth) {
      // If there's no auth provider, we're not loading.
      onStateChange({ user: null, loading: false, error: null });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        onStateChange({ user, loading: false, error: null });
      },
      (error) => {
        onStateChange({ user: null, loading: false, error: null });
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

  // getServerSnapshot is essential for SSR. It provides the initial state on the server.
  // On the server, we don't know the user's auth state, so we always return the loading state.
  const getServerSnapshot = () => {
    return INITIAL_STATE;
  };

  return useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);
}

// This hook provides the current user's authentication state.
// It is a simple wrapper around the `useAuthStore` hook.
// It is useful for components that need to know if a user is logged in or not.
export function useUser() {
  const auth = useAuth();
  return useAuthStore(auth);
}
