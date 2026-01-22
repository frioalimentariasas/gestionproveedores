'use client';

import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../provider';

type AuthStore = {
  user: User | null;
  loading: boolean;
  error: Error | null;
};

// This is a global store that holds the auth state.
let authStore: AuthStore = {
  user: null,
  loading: true,
  error: null,
};

const listeners = new Set<() => void>();

// This function subscribes a component to changes in the auth store.
// It returns an unsubscribe function.
const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

// This function gets the current state of the store.
const getSnapshot = () => {
  return authStore;
};

// This function must be called only once to initialize the listener.
let initialized = false;
const initializeAuthListener = (auth: Auth) => {
  if (initialized) return;
  initialized = true;

  onAuthStateChanged(
    auth,
    (user) => {
      authStore = { user, loading: false, error: null };
      listeners.forEach((l) => l());
    },
    (error) => {
      authStore = { user: null, loading: false, error };
      listeners.forEach((l) => l());
    }
  );
};

// On the server, we always return the initial loading state.
const getServerSnapshot = () => {
  return {
    user: null,
    loading: true,
    error: null,
  };
};

export function useUser() {
  const auth = useAuth();

  useEffect(() => {
    if (auth) {
      initializeAuthListener(auth);
    }
  }, [auth]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
