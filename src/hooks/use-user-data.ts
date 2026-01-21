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
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        let userDoc;
        
        userDoc = await getDoc(doc(db, "admins", currentUser.uid));
        if (userDoc.exists()) {
            setUserData({ ...userDoc.data(), uid: currentUser.uid, role: 'admin' } as UserProfile);
            setLoading(false);
            return;
        }

        userDoc = await getDoc(doc(db, "providers", currentUser.uid));
        if (userDoc.exists()) {
            setUserData({ ...userDoc.data(), uid: currentUser.uid, role: 'provider' } as UserProfile);
        } else {
            // This might happen if user is created in Auth but not in Firestore yet
            // or if the user is an admin. We already checked for admin.
            // Let's assume for a brief moment the user is not found.
            setUserData(null);
        }
        setLoading(false);
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading };
}
