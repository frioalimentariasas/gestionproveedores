import { z } from 'zod';

// Schemas
export const LoginSchema = z.object({
  email: z.string().email({ message: 'Por favor ingrese un correo válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export const RegisterSchema = z.object({
  documentType: z.string().min(1, 'El tipo de documento es requerido.'),
  documentNumber: z.string().min(5, 'El número de documento es muy corto.'),
  companyName: z.string().min(2, 'La razón social o nombre es requerido.'),
  country: z.string().min(1, 'El país es requerido.'),
  department: z.string().min(1, 'El departamento es requerido.'),
  city: z.string().min(1, 'La ciudad es requerida.'),
  address: z.string().min(5, 'La dirección es requerida.'),
  phoneCountryCode: z.string().min(1, 'El indicativo es requerido.'),
  phoneNumber: z.string().min(7, 'El número de celular es muy corto.'),
  email: z.string().email({ message: 'Por favor ingrese un correo válido.' }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});


export const AdminRegisterSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido.'),
  email: z.string().email({ message: 'Por favor ingrese un correo válido.' }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Por favor ingrese un correo válido.' }),
});

// State Types
export type FormState = {
  message: string;
  errors?: z.ZodIssue[];
  success?: boolean;
};
