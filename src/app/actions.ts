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
import { auth } from '@/lib/firebase/auth';

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
      console.error('[SERVER ACTION ERROR] Unhandled Firebase Auth Error:', error);
      return 'Ocurrió un error inesperado durante la autenticación. Por favor, inténtelo de nuevo.';
  }
}

export async function login(prevState: FormState, formData: FormData): Promise<FormState> {
  console.log('[SERVER ACTION] login: Iniciando acción de login.');
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      message: 'Formato de datos inválido. Por favor, corrija los errores.',
      errors: parsed.error.issues,
    };
  }

  const { email, password } = parsed.data;

  try {
    console.log(`[SERVER ACTION] login: Intentando iniciar sesión para ${email}.`);
    await signInWithEmailAndPassword(auth, email, password);
    console.log(`[SERVER ACTION] login: Éxito en signInWithEmailAndPassword para ${email}.`);
  } catch (error) {
    if (isAuthError(error)) {
        console.error('[SERVER ACTION] login: Error de autenticación de Firebase:', error.code);
        return { message: getAuthErrorMessage(error) };
    }
    console.error('[SERVER ACTION] login: Error inesperado:', error);
    return { message: 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo.' };
  }

  console.log('[SERVER ACTION] login: Autenticación exitosa. Redirigiendo a /.');
  redirect('/');
}


export async function register(prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      message: 'Formato de datos inválido. Por favor, corrija los campos.',
      errors: parsed.error.issues,
    };
  }
  
  const { email, password } = parsed.data;
  
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (isAuthError(error)) {
        return { message: getAuthErrorMessage(error) };
    }
    console.error('Error during user registration:', error);
    return {
        message: 'Ocurrió un error inesperado durante el registro.',
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

  const { email, password } = parsed.data;
  
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (isAuthError(error)) {
        return { message: getAuthErrorMessage(error) };
    }
    console.error('Error during admin registration:', error);
    return {
        message: 'Ocurrió un error inesperado durante el registro de administrador.',
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
    return {
       message: `Si existe una cuenta con ${email}, le hemos enviado un enlace para recuperar su contraseña.`,
       success: true,
    };
  }
}
