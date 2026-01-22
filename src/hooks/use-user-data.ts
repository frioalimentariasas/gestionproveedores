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
        setUser(currentUser);
        try {
          // Check if the user is an admin
          const adminDocRef = doc(db, 'admins', currentUser.uid);
          const adminDoc = await getDoc(adminDocRef);

          if (adminDoc.exists()) {
            setUserData({ uid: currentUser.uid, role: 'admin', ...adminDoc.data() } as UserProfile);
          } else {
            // If not an admin, check if they are a provider
            const providerDocRef = doc(db, 'providers', currentUser.uid);
            const providerDoc = await getDoc(providerDocRef);
            
            if (providerDoc.exists()) {
              setUserData({ uid: currentUser.uid, role: 'provider', ...providerDoc.data() } as UserProfile);
            } else {
              // User is authenticated but has no profile document in either collection
              console.warn("Authenticated user has no profile document.");
              setUserData(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        } finally {
          // Loading is finished only after all checks are done
          setLoading(false);
        }
      } else {
        // No user is logged in, this is a definitive state.
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading };
}
