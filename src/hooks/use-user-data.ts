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
      try {
        setUser(currentUser);
        if (currentUser) {
          // Check for admin first
          let userDoc = await getDoc(doc(db, 'admins', currentUser.uid));
          if (userDoc.exists()) {
            setUserData({ ...userDoc.data(), uid: currentUser.uid, role: 'admin' } as UserProfile);
          } else {
            // If not admin, check for provider
            userDoc = await getDoc(doc(db, 'providers', currentUser.uid));
            if (userDoc.exists()) {
              setUserData({ ...userDoc.data(), uid: currentUser.uid, role: 'provider' } as UserProfile);
            } else {
              console.warn("User exists in Auth but their data is not in 'admins' or 'providers' collections.");
              setUserData(null);
            }
          }
        } else {
          // No user is logged in
          setUserData(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserData(null);
      } finally {
        // Set loading to false only after all checks are complete
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading };
}
