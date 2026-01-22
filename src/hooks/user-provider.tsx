'use client';

import { useState, useEffect, createContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/firestore';
import { doc, getDoc, DocumentData } from 'firebase/firestore';

export interface UserProfile extends DocumentData {
    uid: string;
    role: 'admin' | 'provider';
    status?: 'pending' | 'approved' | 'rejected';
    name?: string;
    companyName?: string;
}

export interface UserDataContextType {
    userData: UserProfile | null;
    loading: boolean;
}

export const UserDataContext = createContext<UserDataContextType>({
    userData: null,
    loading: true,
});

export function UserDataProvider({ children }: { children: ReactNode }) {
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user) {
                // User is authenticated, now fetch their data.
                const adminDocRef = doc(db, 'admins', user.uid);
                const adminDoc = await getDoc(adminDocRef);

                if (adminDoc.exists()) {
                    setUserData({ uid: user.uid, role: 'admin', ...adminDoc.data() });
                } else {
                    const providerDocRef = doc(db, 'providers', user.uid);
                    const providerDoc = await getDoc(providerDocRef);
                    
                    if (providerDoc.exists()) {
                        setUserData({ uid: user.uid, role: 'provider', ...providerDoc.data() });
                    } else {
                        // User exists in Auth but not in our DB. An invalid state.
                        console.error("Authenticated user has no document in 'admins' or 'providers'. Signing out.");
                        setUserData(null);
                        await auth.signOut(); // Sign out to prevent being stuck.
                    }
                }
                // Only set loading to false after all async DB checks are complete for an authenticated user.
                setLoading(false);
            } else {
                // User is not authenticated. This is a final state.
                setUserData(null);
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return (
        <UserDataContext.Provider value={{ userData, loading }}>
            {children}
        </UserDataContext.Provider>
    );
}
