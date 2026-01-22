'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
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

export function useUserData() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is authenticated, now determine their role and get data.
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        const providerDocRef = doc(db, 'providers', currentUser.uid);

        try {
            const adminDoc = await getDoc(adminDocRef);
            if (adminDoc.exists()) {
                // User is an admin
                setUserData({ ...adminDoc.data(), uid: currentUser.uid, role: 'admin' } as UserProfile);
            } else {
                // Not an admin, check if they are a provider
                const providerDoc = await getDoc(providerDocRef);
                if (providerDoc.exists()) {
                    // User is a provider
                    setUserData({ ...providerDoc.data(), uid: currentUser.uid, role: 'provider' } as UserProfile);
                } else {
                    // User is authenticated but has no data in either collection.
                    // This is an invalid state, so treat them as logged out.
                    console.warn("User record not found in 'admins' or 'providers'.");
                    setUserData(null);
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setUserData(null);
        } finally {
            setUser(currentUser);
            setLoading(false);
        }
      } else {
        // User is not authenticated.
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading };
}
