import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido.')
    .email('El email no es válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});
