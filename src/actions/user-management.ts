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
