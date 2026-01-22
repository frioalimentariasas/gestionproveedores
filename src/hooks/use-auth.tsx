'use client';

import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/firestore';
import { doc, getDoc, DocumentData } from 'firebase/firestore';

// Define la forma del perfil de usuario, acomodando tanto admin como proveedor
export interface UserProfile extends DocumentData {
    uid: string;
    role: 'admin' | 'provider';
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
    const [loading, setLoading] = useState(true); // Inicia en estado de carga

    useEffect(() => {
        // Este efecto se ejecuta una vez al montar para configurar el listener de estado de autenticación
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Si Firebase detecta un usuario, busca su perfil en Firestore
                let userProfile: UserProfile | null = null;
                
                // 1. Comprueba si el usuario es un administrador
                const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
                if (adminDoc.exists()) {
                    userProfile = {
                        uid: firebaseUser.uid,
                        role: 'admin',
                        ...adminDoc.data()
                    };
                } else {
                    // 2. Si no es un admin, comprueba si es un proveedor
                    const providerDoc = await getDoc(doc(db, 'providers', firebaseUser.uid));
                    if (providerDoc.exists()) {
                         userProfile = {
                            uid: firebaseUser.uid,
                            role: 'provider',
                            ...providerDoc.data()
                        };
                    }
                }

                if (userProfile) {
                    setUser(userProfile);
                } else {
                    // Si el usuario está en Auth pero no en nuestra BD, ciérrale la sesión.
                    console.error("Documento de usuario no encontrado en 'admins' o 'providers'. Cerrando sesión.");
                    await auth.signOut();
                    setUser(null);
                }
            } else {
                // No hay ningún usuario conectado
                setUser(null);
            }
            // IMPORTANTE: Establece loading a false solo después de que todas las comprobaciones se completen
            setLoading(false);
        });

        // Limpia el listener cuando el componente se desmonta
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
