import { z } from 'zod';
import { EVALUATION_CRITERIA } from './evaluations';

export const loginSchema = z.object({
  nit: z
    .string()
    .min(1, 'El NIT es requerido.')
    .regex(/^[0-9]{1,10}$/, 'El NIT debe ser un número de máximo 10 dígitos.'),
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
  })
  .superRefine((data, ctx) => {
    if (data.documentType === 'NIT') {
      if (!/^[0-9]{10}$/.test(data.documentNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El NIT debe ser un número de 10 dígitos.',
          path: ['documentNumber'],
        });
      }
    }
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

const fileSchema = z
  .any()
  .refine((files) => files?.length === 1, 'El archivo es requerido.')
  .refine(
    (files) => files?.[0]?.size <= MAX_FILE_SIZE,
    `El tamaño máximo del archivo es de 5MB.`
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
    'El archivo debe ser un PDF de menos de 5MB.'
  );

export const providerFormSchema = z
  .object({
    serviceDescription: z
      .string()
      .min(1, 'La descripción del bien y/o servicio es requerida.'),
    // Section 1
    providerType: z.string().min(1, 'El tipo de proveedor es requerido.'),
    documentType: z.string().min(1, 'El tipo de documento es requerido.'),
    documentNumber: z
      .string()
      .min(1, 'El número de documento es requerido.')
      .regex(
        /^[0-9-]*$/,
        'El número de documento solo debe contener números y guiones.'
      ),
    businessName: z.string().min(1, 'La razón social es requerida.'),
    personType: z.string().min(1, 'El tipo de persona es requerido.'),
    city: z.string().min(1, 'La ciudad es requerida.'),
    department: z.string().min(1, 'El departamento es requerido.'),
    country: z.string().min(1, 'El país es requerido.'),
    address: z.string().min(1, 'La dirección es requerida.'),
    fax: z.string().optional(),
    phone: z.string().min(1, 'El teléfono es requerido.'),
    website: z
      .string()
      .url('URL de página web no válida')
      .optional()
      .or(z.literal('')),
    providerContactName: z
      .string()
      .min(1, 'El nombre de contacto es requerido.'),
    providerContactTitle: z
      .string()
      .min(1, 'El cargo del contacto es requerido.'),
    providerContactEmail: z.string().email('Email de contacto no válido.'),
    paymentContactName: z
      .string()
      .min(1, 'El nombre de la persona para notificar pago es requerido.'),
    paymentContactTitle: z
      .string()
      .min(1, 'El cargo de la persona para notificar pago es requerido.'),
    paymentContactEmail: z
      .string()
      .email('El email para notificación de pago no es válido.'),
    email: z.string().email('Email no válido.'),

    // Section 2 - Tributaria
    taxRegimeType: z.string().optional(),
    isLargeTaxpayer: z.string().optional(),
    largeTaxpayerResolution: z.string().optional(),
    isIncomeSelfRetainer: z.string().optional(),
    incomeSelfRetainerResolution: z.string().optional(),
    isIcaSelfRetainer: z.string().optional(),
    icaSelfRetainerMunicipality: z.string().optional(),
    icaSelfRetainerResolution: z.string().optional(),
    ciiuCode: z.string().optional(),
    icaCode: z.string().optional(),
    declarationCity: z.string().optional(),
    icaPercentage: z.string().optional(),

    // Section 3 - Ambiental
    implementsEnvironmentalMeasures: z.string().optional(),
    environmentalMeasuresDescription: z.string().optional(),

    // Section 4 - Representante Legal
    legalRepresentativeName: z.string().optional(),
    legalRepresentativeDocumentType: z.string().optional(),
    legalRepresentativeDocumentNumber: z.string().optional(),

    // Section 5 - Financiera
    bankName: z.string().min(1, 'El nombre del banco es requerido.'),
    accountType: z.string().min(1, 'El tipo de cuenta es requerido.'),
    accountNumber: z.string().min(1, 'El número de cuenta es requerido.'),
    beneficiaryName: z
      .string()
      .min(1, 'El nombre del titular es requerido.'),
    // Section 6 - Documentos
    rutFile: fileSchemaOptional,
    camaraComercioFile: fileSchemaOptional,
    cedulaRepresentanteLegalFile: fileSchemaOptional,
    certificacionBancariaFile: fileSchemaOptional,
    // Hidden URL fields
    rutFileUrl: z.string().optional(),
    camaraComercioFileUrl: z.string().optional(),
    cedulaRepresentanteLegalFileUrl: z.string().optional(),
    certificacionBancariaFileUrl: z.string().optional(),
    // Section 7 - HSEQ
    hseqSgsst: z.string().optional(),
    // Section 8 - SARLAFT
    sarlaftAccepted: z
      .boolean()
      .refine((val) => val === true, 'Debe aceptar los términos.'),
    // Status fields
    formLocked: z.boolean().optional(),
    disabled: z.boolean().optional(),
    // New field
    categoryIds: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.personType === 'Persona Jurídica') {
      if (!data.legalRepresentativeName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El nombre del representante legal es requerido.',
          path: ['legalRepresentativeName'],
        });
      }
      if (!data.legalRepresentativeDocumentType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El tipo de documento del representante es requerido.',
          path: ['legalRepresentativeDocumentType'],
        });
      }
      if (!data.legalRepresentativeDocumentNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El número de documento del representante es requerido.',
          path: ['legalRepresentativeDocumentNumber'],
        });
      }
    }
  });

// Schema for evaluation form
const baseScores = z.record(z.string(), z.number().min(1).max(5));

export const evaluationSchema = z.object({
  scores: baseScores,
  comments: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().optional(),
});
