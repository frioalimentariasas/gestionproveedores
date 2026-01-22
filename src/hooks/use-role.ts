'use client';

import { doc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';

// Hardcoded list of admin emails for robust identification.
const ADMIN_EMAILS = [
  'sistemas@frioalimentaria.com.co',
  'asistente@frioalimentaria.com.co',
];

/**
 * Hook to determine if the current user is an administrator.
 * It first checks if the user's email is in a hardcoded admin list.
 * As a secondary check, it verifies the existence of a document in the `roles_admin` collection.
 * @returns {object} An object containing `isAdmin` boolean and `isLoading` boolean.
 */
export function useRole() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // An admin is someone whose email is in the hardcoded list.
  const isEmailAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);

  // Memoize the document reference to prevent re-renders.
  // We only need to check Firestore if the email doesn't match, as a fallback.
  const adminRoleDocRef = useMemoFirebase(() => {
    if (!user || !firestore || isEmailAdmin) {
      return null;
    }
    return doc(firestore, 'roles_admin', user.uid);
  }, [user, firestore, isEmailAdmin]);

  const { data: adminDoc, isLoading: isRoleDocLoading } = useDoc(adminRoleDocRef);

  // An admin is someone whose email is in the list OR who has a role document.
  const isDocAdmin = !!adminDoc;
  const isAdmin = isEmailAdmin || isDocAdmin;

  // Loading is complete when user loading is done, AND if we need to check the doc, that's done too.
  const isLoading = isUserLoading || (!isEmailAdmin && user ? isRoleDocLoading : false);

  return { isAdmin, isLoading };
}
