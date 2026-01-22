import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido.')
    .email('El email no es válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

export const updateNameSchema = z.object({
  displayName: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(50, 'El nombre no puede tener más de 50 caracteres.'),
});

export const updatePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, 'La nueva contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });
