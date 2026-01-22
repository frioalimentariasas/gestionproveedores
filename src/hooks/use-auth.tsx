'use client';

import { createContext, useReducer, useEffect, ReactNode, useContext } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';

export interface UserProfile {
    uid: string;
    email: string | null;
    name: string | null;
    role: 'admin' | 'provider';
}

interface AuthState {
    user: UserProfile | null;
    loading: boolean;
}

type AuthAction =
  | { type: 'AUTH_STATE_CHANGED'; payload: FirebaseUser | null };

const initialState: AuthState = {
    user: null,
    loading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_STATE_CHANGED':
      console.log('[AUTH REDUCER] Action: AUTH_STATE_CHANGED', { user: !!action.payload });
      if (action.payload) {
        return {
          ...state,
          user: {
              uid: action.payload.uid,
              email: action.payload.email,
              name: action.payload.displayName || action.payload.email,
              role: 'admin', // Rol temporal según solicitado
          },
          loading: false, // La carga finaliza JUNTO con la actualización del usuario
        };
      }
      return {
        ...state,
        user: null,
        loading: false, // La carga finaliza confirmando que NO hay usuario
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthState>(initialState);
AuthContext.displayName = 'AuthContext';


export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        console.log('[AUTH PROVIDER] useEffect: Iniciando, seteando listener de onAuthStateChanged.');
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log(`[AUTH PROVIDER] onAuthStateChanged: Se disparó el evento. User: ${!!firebaseUser}`);
            dispatch({ type: 'AUTH_STATE_CHANGED', payload: firebaseUser });
        });

        return () => {
            console.log('[AUTH PROVIDER] useEffect Cleanup: Desuscribiendo de onAuthStateChanged.');
            unsubscribe();
        };
    }, []);

    console.log('[AUTH PROVIDER] Render: Estado actual ->', state);

    return (
        <AuthContext.Provider value={state}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
