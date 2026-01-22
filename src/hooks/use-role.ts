'use client';

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc } from '@/firebase';

/**
 * Hook to determine if the current user is an administrator.
 * It checks for the existence of a document in the `roles_admin` collection.
 * @returns {object} An object containing `isAdmin` boolean and `isLoading` boolean.
 */
export function useRole() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Memoize the document reference to prevent re-renders
  const adminRoleDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [user, firestore]);

  const { data: adminDoc, isLoading: isRoleLoading } = useDoc(adminRoleDocRef);

  const isAdmin = !!adminDoc;
  const isLoading = isUserLoading || (user ? isRoleLoading : false);

  return { isAdmin, isLoading };
}
