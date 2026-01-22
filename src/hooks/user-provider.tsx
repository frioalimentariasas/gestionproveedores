'use client';

import { useState, useEffect, createContext, ReactNode, useCallback } from 'react';
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

    const fetchUserDocument = useCallback(async (user: User) => {
        try {
            // 1. Check for admin document
            const adminDocRef = doc(db, 'admins', user.uid);
            const adminDoc = await getDoc(adminDocRef);
            if (adminDoc.exists()) {
                setUserData({ uid: user.uid, role: 'admin', ...adminDoc.data() });
                return;
            }

            // 2. If not admin, check for provider document
            const providerDocRef = doc(db, 'providers', user.uid);
            const providerDoc = await getDoc(providerDocRef);
            if (providerDoc.exists()) {
                setUserData({ uid: user.uid, role: 'provider', ...providerDoc.data() });
                return;
            }

            // 3. If user exists in Auth but not in our DB, it's an invalid state.
            console.error("Authenticated user has no document in 'admins' or 'providers'. Signing out.");
            await auth.signOut();
            setUserData(null);

        } catch (error) {
            console.error("Error fetching user document:", error);
            setUserData(null);
        } finally {
            // This now runs only after all async logic inside the try/catch is complete.
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true); // Always start in a loading state.
        const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
            if (user) {
                // User is detected, trigger the separate document fetching logic.
                fetchUserDocument(user);
            } else {
                // No user is signed in. Final state.
                setUserData(null);
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [fetchUserDocument]);

    return (
        <UserDataContext.Provider value={{ userData, loading }}>
            {children}
        </UserDataContext.Provider>
    );
}
