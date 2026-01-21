'use server';

import { redirect } from 'next/navigation';
import { LoginSchema, RegisterSchema, ForgotPasswordSchema, type FormState } from '@/lib/schemas';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  type AuthError,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/firestore';


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
      return 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo.';
  }
}


// Actions
export async function login(prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      message: 'Formato de datos inválido. Por favor, corrija los errores.',
      errors: parsed.error.issues,
    };
  }

  const { email, password } = parsed.data;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    return {
      message: getAuthErrorMessage(error as AuthError),
    };
  }
  
  redirect('/dashboard');
}

export async function register(prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      message: 'Formato de datos inválido. Por favor, corrija los campos.',
      errors: parsed.error.issues,
    };
  }
  
  const { email, password, ...providerData } = parsed.data;
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save provider data to Firestore, using user's UID as document ID
    await setDoc(doc(db, 'providers', user.uid), {
      ...providerData,
      email: user.email, // Ensure email from auth is the one stored
      createdAt: new Date().toISOString(),
    });

  } catch (error) {
    return {
      message: getAuthErrorMessage(error as AuthError),
    };
  }

  redirect('/dashboard');
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
