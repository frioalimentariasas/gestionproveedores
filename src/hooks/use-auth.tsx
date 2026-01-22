'use client';

import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';

export interface UserProfile {
    uid: string;
    email: string | null;
    name: string | null;
    role: 'admin' | 'provider';
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('[AUTH PROVIDER] useEffect: Iniciando, seteando listener de onAuthStateChanged.');
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            console.log('[AUTH PROVIDER] onAuthStateChanged: Se disparó el evento.');
            if (firebaseUser) {
                console.log('[AUTH PROVIDER] onAuthStateChanged: Usuario de Firebase detectado.', { uid: firebaseUser.uid, email: firebaseUser.email });
                const userProfile: UserProfile = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || firebaseUser.email,
                    role: 'admin',
                };
                console.log('[AUTH PROVIDER] onAuthStateChanged: Seteando perfil de usuario.', userProfile);
                setUser(userProfile);
            } else {
                console.log('[AUTH PROVIDER] onAuthStateChanged: No hay usuario de Firebase (null).');
                setUser(null);
            }
            console.log('[AUTH PROVIDER] onAuthStateChanged: Finalizando carga, seteando loading a false.');
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => {
            console.log('[AUTH PROVIDER] useEffect Cleanup: Desuscribiendo de onAuthStateChanged.');
            unsubscribe();
        }
    }, []);

    console.log('[AUTH PROVIDER] Render: Estado actual ->', { loading, user });

    return (
        <AuthContext.Provider value={{ user, loading }}>
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
