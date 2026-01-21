'use server';

import { redirect } from 'next/navigation';
import { LoginSchema, RegisterSchema, ForgotPasswordSchema, type FormState } from '@/lib/schemas';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const adminEmails = [
  'sistemas@frioalimentaria.com.co',
  'asistente@frioalimentaria.com.co',
];

// Actions
export async function login(prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      message: 'Formato de datos inválido. Por favor, corrija los errores.',
      errors: parsed.error.issues,
    };
  }

  await sleep(1000);

  const { email } = parsed.data;

  // Simulate user not found
  if (email.includes('notfound')) {
    return {
      message: 'El correo electrónico o la contraseña son incorrectos.',
    };
  }
  
  console.log(`User attempting to log in: ${email}`);
  if (adminEmails.includes(email)) {
    console.log(`Admin user detected: ${email}`);
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
  
  await sleep(1500);

  const { email } = parsed.data;
  
  // Simulate existing user
  if (email.includes('exists')) {
      return {
          message: 'Ya existe una cuenta con este correo electrónico.',
      }
  }

  console.log('New provider registered:', parsed.data);

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
  
  await sleep(1000);
  
  console.log('Password recovery requested for:', parsed.data.email);

  return {
    message: `Si existe una cuenta con ${parsed.data.email}, le hemos enviado un enlace para recuperar su contraseña.`,
    success: true,
  };
}
