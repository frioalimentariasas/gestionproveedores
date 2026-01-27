import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido.')
    .email('El email no es válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

export const registerSchema = z
  .object({
    businessName: z.string().min(1, 'La razón social es requerida.'),
    documentType: z.string().min(1, 'El tipo de documento es requerido.'),
    documentNumber: z
      .string()
      .min(1, 'El número de documento es requerido.')
      .regex(/^[0-9]+$/, 'El número de documento solo debe contener números.'),
    email: z
      .string()
      .min(1, 'El email es requerido.')
      .email('El email no es válido.'),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
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

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

const fileSchema = z
  .any()
  .refine((files) => files?.length === 1, 'El archivo es requerido.')
  .refine(
    (files) => files?.[0]?.size <= MAX_FILE_SIZE,
    `El tamaño máximo del archivo es de 2MB.`
  )
  .refine(
    (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
    'Solo se aceptan archivos .pdf'
  );

const fileSchemaOptional = z
  .any()
  .optional()
  .refine(
    (files) =>
      !files ||
      files.length === 0 ||
      (files?.[0]?.size <= MAX_FILE_SIZE &&
        ACCEPTED_FILE_TYPES.includes(files?.[0]?.type)),
    'El archivo debe ser un PDF de menos de 2MB.'
  );

export const providerFormSchema = z.object({
  serviceDescription: z
    .string()
    .min(1, 'La descripción del bien y/o servicio es requerida.'),
  // Section 1
  businessName: z.string().min(1, 'La razón social es requerida.'),
  documentType: z.string().min(1, 'El tipo de documento es requerido.'),
  documentNumber: z.string().min(1, 'El número de documento es requerido.'),
  address: z.string().min(1, 'La dirección es requerida.'),
  department: z.string().min(1, 'El departamento es requerido.'),
  city: z.string().min(1, 'La ciudad es requerida.'),
  phone: z.string().min(1, 'El teléfono es requerido.'),
  email: z.string().email('Email no válido.'),
  // Section 2
  personType: z.string().min(1, 'El tipo de persona es requerido.'),
  taxRegime: z.string().min(1, 'El régimen de IVA es requerido.'),
  isIcaAgent: z.string().min(1, 'Debe seleccionar una opción.'),
  icaTariff: z.string().optional(),
  isIncomeTaxAgent: z.string().min(1, 'Debe seleccionar una opción.'),
  // Section 3
  contactName: z.string().min(1, 'El nombre de contacto es requerido.'),
  contactPhone: z.string().min(1, 'El teléfono de contacto es requerido.'),
  contactEmail: z.string().email('Email de contacto no válido.'),
  // Section 4
  bankName: z.string().min(1, 'El nombre del banco es requerido.'),
  accountType: z.string().min(1, 'El tipo de cuenta es requerido.'),
  accountNumber: z.string().min(1, 'El número de cuenta es requerido.'),
  beneficiaryName: z
    .string()
    .min(1, 'El nombre del titular es requerido.'),
  // Section 5
  rutFile: fileSchemaOptional,
  camaraComercioFile: fileSchemaOptional,
  estadosFinancierosFile: fileSchemaOptional,
  declaracionRentaFile: fileSchemaOptional,
  cedulaRepresentanteLegalFile: fileSchemaOptional,
  certificacionBancariaFile: fileSchemaOptional,
  // Hidden URL fields
  rutFileUrl: z.string().optional(),
  camaraComercioFileUrl: z.string().optional(),
  estadosFinancierosFileUrl: z.string().optional(),
  declaracionRentaFileUrl: z.string().optional(),
  cedulaRepresentanteLegalFileUrl: z.string().optional(),
  certificacionBancariaFileUrl: z.string().optional(),
  // Section 6
  sarlaftAccepted: z
    .boolean()
    .refine((val) => val === true, 'Debe aceptar los términos.'),
  // New lock field
  formLocked: z.boolean().optional(),
});
