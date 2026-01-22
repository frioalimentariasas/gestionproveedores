'use client';

import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';

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
                // Si hay un usuario de Firebase, busca su perfil en la base de datos
                const adminRef = doc(db, 'admins', firebaseUser.uid);
                const adminSnap = await getDoc(adminRef);

                if (adminSnap.exists()) {
                    setUser({
                        ...adminSnap.data(),
                        uid: firebaseUser.uid,
                        role: 'admin',
                    } as UserProfile);
                } else {
                    const providerRef = doc(db, 'providers', firebaseUser.uid);
                    const providerSnap = await getDoc(providerRef);
                    if (providerSnap.exists()) {
                         setUser({
                            ...providerSnap.data(),
                            uid: firebaseUser.uid,
                            role: 'provider',
                        } as UserProfile);
                    } else {
                        // El usuario está en Auth pero no en la BD (caso de error o registro incompleto)
                        setUser(null); 
                    }
                }
            } else {
                // No hay usuario de Firebase
                setUser(null);
            }
            // La carga termina solo después de todas las comprobaciones
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
