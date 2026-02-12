'use server';

import admin from '@/lib/firebase-admin';

function generatePassword() {
  const length = 10;
  // Character set without easily confused characters like I, l, 1, O, 0
  const charset = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*()";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}

export async function resetUserPassword(uid: string) {
  try {
    const newPassword = generatePassword();
    await admin.auth().updateUser(uid, {
      password: newPassword,
    });
    return { success: true, newPassword };
  } catch (error: any) {
    console.error('Error resetting user password:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleUserStatus(uid: string, disabled: boolean) {
  try {
    await admin.auth().updateUser(uid, { disabled });
    await admin.firestore().collection('providers').doc(uid).update({ disabled });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user status:', error);
    return { success: false, error: error.message };
  }
}


export async function getProviderDataByNit(nit: string) {
  try {
    const providersRef = admin.firestore().collection('providers');
    const snapshot = await providersRef.where('documentNumber', '==', nit).limit(1).get();

    if (snapshot.empty) {
      return { success: false, error: 'No provider found with that NIT.' };
    }

    const providerDoc = snapshot.docs[0];
    const providerData = providerDoc.data();
    
    // Return the data needed for the reactivation request
    return { 
        success: true, 
        data: { 
            businessName: providerData.businessName,
            email: providerData.email 
        } 
    };

  } catch (error: any) {
    console.error('Error fetching provider data by NIT:', error);
    return { success: false, error: error.message };
  }
}

export async function migrateUserToNitLogin(uid: string) {
  try {
    const providerDocRef = admin.firestore().collection('providers').doc(uid);
    const providerDoc = await providerDocRef.get();

    if (!providerDoc.exists) {
      throw new Error('Documento del proveedor no encontrado.');
    }

    const providerData = providerDoc.data();
    const nit = providerData?.documentNumber;

    if (!nit) {
      throw new Error('El documento del proveedor no tiene NIT (documentNumber).');
    }

    const syntheticEmail = `${nit}@proveedores.frioalimentaria.com.co`;

    // Update the Firebase Auth user's email
    await admin.auth().updateUser(uid, {
      email: syntheticEmail,
    });
    
    // Optionally, flag the user as migrated in Firestore
    await providerDocRef.update({ nitLoginMigrated: true });

    return { success: true };
  } catch (error: any) {
    console.error('Error migrating user to NIT login:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProvider(uid: string) {
  try {
    const bucket = admin.storage().bucket();
    const providerRef = admin.firestore().collection('providers').doc(uid);

    // Concurrently delete Storage files and Firestore documents
    await Promise.all([
      bucket.deleteFiles({ prefix: `providers/${uid}/` }),
      admin.firestore().recursiveDelete(providerRef),
    ]);
    
    // Finally, delete the auth user
    await admin.auth().deleteUser(uid);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting provider:', error);
    // If the user is not found in auth, it might have been deleted already.
    // We can consider this a success for the cleanup operation.
    if (error.code === 'auth/user-not-found') {
      console.warn(`Auth user with UID ${uid} not found. It might have been deleted previously.`);
      return { success: true };
    }
    return { success: false, error: error.message };
  }
}

export async function deleteSelectionEvent(eventId: string) {
  try {
    const bucket = admin.storage().bucket();
    const eventRef = admin.firestore().collection('selection_events').doc(eventId);

    // Concurrently delete Storage files and Firestore document
    // The prefix is based on the current implementation in `competitors-manager.tsx` and `api/upload/route.ts`
    await Promise.all([
      bucket.deleteFiles({ prefix: `providers/${eventId}/` }),
      eventRef.delete(),
    ]);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting selection event:', error);
    return { success: false, error: error.message };
  }
}

export async function assignCategorySequenceIds() {
  try {
    const categoriesRef = admin.firestore().collection('categories');
    const snapshot = await categoriesRef.get();

    const categoriesWithId: any[] = [];
    const categoriesWithoutId: any[] = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.sequenceId) {
        categoriesWithId.push({ id: doc.id, ...data });
      } else {
        categoriesWithoutId.push({ id: doc.id, ...data });
      }
    });

    if (categoriesWithoutId.length === 0) {
      return { success: true, message: 'No categories needed an ID.' };
    }

    let maxId = 0;
    if (categoriesWithId.length > 0) {
      maxId = Math.max(...categoriesWithId.map(c => parseInt(c.sequenceId, 10)));
    }

    // Sort categories without an ID alphabetically by name
    categoriesWithoutId.sort((a, b) => a.name.localeCompare(b.name));

    const batch = admin.firestore().batch();
    let currentId = maxId + 1;

    categoriesWithoutId.forEach(category => {
      const categoryRef = categoriesRef.doc(category.id);
      const newSequenceId = String(currentId).padStart(4, '0');
      batch.update(categoryRef, { sequenceId: newSequenceId });
      currentId++;
    });

    await batch.commit();

    return { success: true, count: categoriesWithoutId.length };
  } catch (error: any) {
    console.error('Error assigning category sequence IDs:', error);
    return { success: false, error: error.message };
  }
}
