'use client';

import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/firestore';
import { doc, getDoc, DocumentData } from 'firebase/firestore';

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
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Desvío temporal para el usuario de sistemas
                if (firebaseUser.email === 'sistemas@frioalimentaria.com') {
                    setUser({
                        uid: firebaseUser.uid,
                        role: 'admin',
                        name: 'Usuario de Sistema',
                        email: firebaseUser.email,
                    });
                    setLoading(false);
                    return; // Detiene la ejecución para evitar la lógica de roles
                }
                
                let userProfile: UserProfile | null = null;
                
                // 1. Comprueba si el usuario es un administrador
                const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
                if (adminDoc.exists()) {
                    userProfile = {
                        uid: firebaseUser.uid,
                        role: 'admin',
                        email: firebaseUser.email,
                        ...adminDoc.data()
                    };
                } else {
                    // 2. Si no es un admin, comprueba si es un proveedor
                    const providerDoc = await getDoc(doc(db, 'providers', firebaseUser.uid));
                    if (providerDoc.exists()) {
                         userProfile = {
                            uid: firebaseUser.uid,
                            role: 'provider',
                            email: firebaseUser.email,
                            ...providerDoc.data()
                        };
                    }
                }

                if (userProfile) {
                    setUser(userProfile);
                } else {
                    console.error("Documento de usuario no encontrado en 'admins' o 'providers'.");
                    setUser(null); 
                }
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
