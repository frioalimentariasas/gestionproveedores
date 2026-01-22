'use server';

import { redirect } from 'next/navigation';
import { LoginSchema, RegisterSchema, AdminRegisterSchema, ForgotPasswordSchema, type FormState } from '@/lib/schemas';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  type AuthError,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/firestore';


// Helper to check if an error is a Firebase AuthError
function isAuthError(error: unknown): error is AuthError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

// Helper to map Firebase auth errors to user-friendly messages
function getAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'El correo electrónico o la contraseña son incorrectos.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo electrónico.';
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
        return 'El correo electrónico no es válido.';
    default:
      console.error('Unhandled Firebase Auth Error:', error);
      return 'Ocurrió un error inesperado durante la autenticación. Por favor, inténtelo de nuevo.';
  }
}

async function handleLogin(formData: FormData, role: 'admin' | 'provider'): Promise<FormState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      message: 'Formato de datos inválido. Por favor, corrija los errores.',
      errors: parsed.error.issues,
    };
  }

  const { email, password } = parsed.data;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Verify role after sign-in
    const collectionName = role === 'admin' ? 'admins' : 'providers';
    const docRef = doc(db, collectionName, user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // If the user document doesn't exist in the specified collection,
      // sign them out and return an error.
      await signOut(auth);
      const errorMessage = role === 'admin' 
        ? 'No tiene permisos de administrador.'
        : 'Esta cuenta no está registrada como proveedor.';
      return { message: errorMessage };
    }

  } catch (error) {
    if (isAuthError(error)) {
        return { message: getAuthErrorMessage(error) };
    }
    console.error(`${role} Login Error:`, error);
    return { message: 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo.' };
  }
  
  redirect('/');
}

export async function providerLogin(prevState: FormState, formData: FormData): Promise<FormState> {
    return handleLogin(formData, 'provider');
}

export async function adminLogin(prevState: FormState, formData: FormData): Promise<FormState> {
    return handleLogin(formData, 'admin');
}


export async function register(prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      message: 'Formato de datos inválido. Por favor, corrija los campos.',
      errors: parsed.error.issues,
    };
  }
  
  const { email, password, phoneCountryCode, phoneNumber, ...providerData } = parsed.data;
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save provider data to Firestore, using user's UID as document ID
    await setDoc(doc(db, 'providers', user.uid), {
      ...providerData,
      phoneNumber: `+${phoneCountryCode}${phoneNumber}`,
      email: user.email, // Ensure email from auth is the one stored
      createdAt: new Date().toISOString(),
      status: 'pending',
      role: 'provider',
    });

  } catch (error) {
    if (isAuthError(error)) {
        return { message: getAuthErrorMessage(error) };
    }
    console.error('Firestore Error during provider registration:', error);
    return {
        message: 'El usuario se ha creado, pero ha ocurrido un error al guardar los datos. Revise las reglas de seguridad de Firestore.',
    };
  }

  redirect('/');
}

export async function registerAdmin(prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = AdminRegisterSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      message: 'Formato de datos inválido. Por favor, corrija los campos.',
      errors: parsed.error.issues,
    };
  }

  const { name, email, password } = parsed.data;

  const allowedAdminEmails = [
    'sistemas@frioalimentaria.com.co',
    'asistente@frioalimentaria.com.co',
  ];

  if (!allowedAdminEmails.includes(email)) {
    return {
      message: 'Este correo electrónico no está autorizado para registrarse como administrador.',
    };
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save admin data to a separate 'admins' collection
    await setDoc(doc(db, 'admins', user.uid), {
      name,
      email: user.email,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });

  } catch (error) {
    if (isAuthError(error)) {
        return { message: getAuthErrorMessage(error) };
    }
    console.error('Firestore Error during admin registration:', error);
    return {
        message: 'El usuario administrador se ha creado, pero ha ocurrido un error al guardar los datos. Revise las reglas de seguridad de Firestore.',
    };
  }

  redirect('/');
}


export async function forgotPassword(prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = ForgotPasswordSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      message: 'Por favor, ingrese un correo electrónico válido.',
      errors: parsed.error.issues,
    };
  }
  
  const { email } = parsed.data;

  try {
    await sendPasswordResetEmail(auth, email);
    return {
      message: `Si existe una cuenta con ${email}, le hemos enviado un enlace para recuperar su contraseña.`,
      success: true,
    };
  } catch (error) {
    // For security, don't reveal if the user exists. Return success message regardless.
     return {
       message: `Si existe una cuenta con ${email}, le hemos enviado un enlace para recuperar su contraseña.`,
       success: true,
    };
  }
}
