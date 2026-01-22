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
                try {
                    // Check for admin role first
                    const adminDocRef = doc(db, 'admins', user.uid);
                    const adminDoc = await getDoc(adminDocRef);

                    if (adminDoc.exists()) {
                        setUserData({ uid: user.uid, role: 'admin', ...adminDoc.data() });
                    } else {
                        // If not admin, check for provider role
                        const providerDocRef = doc(db, 'providers', user.uid);
                        const providerDoc = await getDoc(providerDocRef);
                        
                        if (providerDoc.exists()) {
                            setUserData({ uid: user.uid, role: 'provider', ...providerDoc.data() });
                        } else {
                            // User is authenticated in Firebase, but has no data in our DB
                            console.error("User document not found in 'admins' or 'providers' collection.");
                            setUserData(null);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUserData(null);
                } finally {
                    // This is the correct place to set loading to false: 
                    // only after all async operations for a logged-in user are complete.
                    setLoading(false);
                }
            } else {
                // No user is signed in.
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
