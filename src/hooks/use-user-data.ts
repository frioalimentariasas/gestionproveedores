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
      setLoading(true); // Set loading at the beginning of every auth state check.
      if (currentUser) {
        setUser(currentUser); // Set the Firebase user object immediately.
        // Now, fetch the user's profile from Firestore to determine their role and data.
        try {
          const adminDocRef = doc(db, 'admins', currentUser.uid);
          const adminDoc = await getDoc(adminDocRef);

          if (adminDoc.exists()) {
            setUserData({ ...adminDoc.data(), uid: currentUser.uid, role: 'admin' } as UserProfile);
          } else {
            const providerDocRef = doc(db, 'providers', currentUser.uid);
            const providerDoc = await getDoc(providerDocRef);
            if (providerDoc.exists()) {
              setUserData({ ...providerDoc.data(), uid: currentUser.uid, role: 'provider' } as UserProfile);
            } else {
              // Authenticated user has no profile in 'admins' or 'providers'.
              console.warn("User document not found.");
              setUserData(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        } finally {
          // After all async operations are done, set loading to false.
          setLoading(false);
        }
      } else {
        // No user is signed in.
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading };
}
