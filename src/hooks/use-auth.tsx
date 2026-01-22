'use client';

import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { type DocumentData } from 'firebase/firestore';

// Define la forma del perfil de usuario, acomodando tanto admin como proveedor
export interface UserProfile extends DocumentData {
    uid: string;
    role: 'admin' | 'provider';
    email: string | null;
    // Específico de Admin
    name?: string;
    // Específico de Proveedor
    companyName?: string;
    status?: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
}

// Crea el contexto con un valor por defecto
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

// Crea el componente proveedor
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Cualquier usuario autenticado en Firebase tendrá acceso.
                // La verificación de roles en la base de datos se omite por completo.
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    // Se asignan valores por defecto para que la UI funcione correctamente.
                    role: 'admin',
                    name: firebaseUser.displayName || firebaseUser.email,
                    companyName: firebaseUser.displayName || firebaseUser.email,
                    status: 'approved',
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = { user, loading };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Crea un hook personalizado para un fácil acceso al contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
