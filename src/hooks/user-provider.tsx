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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // 1. Check for admin document first.
                    const adminDocRef = doc(db, 'admins', user.uid);
                    const adminDoc = await getDoc(adminDocRef);
                    if (adminDoc.exists()) {
                        setUserData({ uid: user.uid, role: 'admin', ...adminDoc.data() });
                        setLoading(false);
                        return;
                    }

                    // 2. If not an admin, check for a provider document.
                    const providerDocRef = doc(db, 'providers', user.uid);
                    const providerDoc = await getDoc(providerDocRef);
                    if (providerDoc.exists()) {
                        setUserData({ uid: user.uid, role: 'provider', ...providerDoc.data() });
                        setLoading(false);
                        return;
                    }

                    // 3. If user is in Auth but not in our DB (neither admin nor provider),
                    // it's an invalid state. Log them out.
                    console.error("Authenticated user has no document in 'admins' or 'providers'. Signing out.");
                    await auth.signOut();
                    setUserData(null);
                    setLoading(false);

                } catch (error) {
                    // Handle any errors during Firestore document fetching
                    console.error("Error fetching user document:", error);
                    setUserData(null);
                    setLoading(false);
                }
            } else {
                // No user is signed in. Final state is not loading and no user.
                setUserData(null);
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []); // The empty dependency array ensures this effect runs only once on mount.

    return (
        <UserDataContext.Provider value={{ userData, loading }}>
            {children}
        </UserDataContext.Provider>
    );
}
