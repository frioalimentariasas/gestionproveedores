import { z } from 'zod';

const ADMIN_EMAILS = [
  'sistemas@frioalimentaria.com.co',
  'asistente@frioalimentaria.com.co',
  'logistica@frioalimentaria.com.co',
];

export const loginSchema = z.object({
  identifier: z.string().min(1, 'El NIT o Email es requerido.'),
  password: z.string().min(1, 'La contraseña es requerido.'),
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
      .trim()
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
    if (ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === data.email.toLowerCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Este correo electrónico está reservado para uso administrativo.',
        path: ['email'],
      });
    }

    if (data.documentType === 'NIT') {
      if (!/^[0-9]{9}$/.test(data.documentNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'El NIT debe ser un número de 9 dígitos (sin dígito de verificación).',
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
    // Section 1
    providerType: z.array(z.string()).refine((value) => value.length > 0, {
      message: 'Debes seleccionar al menos un sector.',
    }),
    categoryIds: z
      .array(z.string())
      .min(1, 'Debes seleccionar al menos una categoría.'),
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
      .min(1, 'El contacto comercial es requerido.'),
    providerContactTitle: z
      .string()
      .min(1, 'El cargo del contacto es requerido.'),
    providerContactEmail: z.string().email('Email de contacto no válido.').min(1, 'El email de contacto es requerido.'),
    paymentContactName: z
      .string()
      .min(1, 'El nombre de la persona para notificar pago es requerido.'),
    paymentContactTitle: z
      .string()
      .min(1, 'El cargo de la persona para notificar pago es requerido.'),
    paymentContactEmail:
      z.string()
      .email('El email para notificación de pago no es válido.').min(1, 'El email para notificación de pago es requerido.'),
    email: z.string().trim().email('Email no válido.'),

    // Section 2 - Tributaria
    taxRegimeType: z.string().min(1, 'El tipo de régimen es requerido.'),
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
    implementsEnvironmentalMeasures: z.string().min(1, 'Este campo es requerido.'),
    environmentalMeasuresDescription: z.string().optional(),

    // Section 4 - Representante Legal
    legalRepresentativeName: z.string().optional(),
    legalRepresentativeDocumentType: z.string().optional(),
    legalRepresentativeDocumentNumber: z.string().optional(),

    // Section 5 - Financiera
    bankName: z.string().min(1, 'El nombre del banco es requerido.'),
    accountType: z.string().min(1, 'El tipo de cuenta es requerido.'),
    accountNumber: z
      .string()
      .min(1, 'El número de cuenta es requerido.')
      .regex(/^[0-9]+$/, 'El número de cuenta solo debe contener números.')
      .max(20, 'El número de cuenta no puede tener más de 20 dígitos.'),
    beneficiaryName: z
      .string()
      .min(1, 'El nombre del titular es requerido.')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre del titular solo debe contener letras y espacios.'),
    
    // Section 6 - Documentos (Inputs)
    rutFile: fileSchemaOptional,
    camaraComercioFile: fileSchemaOptional,
    cedulaRepresentanteLegalFile: fileSchemaOptional,
    certificacionBancariaFile: fileSchemaOptional,
    estadosFinancierosFile: fileSchemaOptional,
    declaracionRentaFile: fileSchemaOptional,
    
    // Hidden URL fields (Stored in Firestore)
    rutFileUrl: z.string().optional(),
    camaraComercioFileUrl: z.string().optional(),
    cedulaRepresentanteLegalFileUrl: z.string().optional(),
    certificacionBancariaFileUrl: z.string().optional(),
    estadosFinancierosFileUrl: z.string().optional(),
    declaracionRentaFileUrl: z.string().optional(),
    
    // Section 7 - HSEQ
    hseqSgsst: z.string().min(1, 'Este campo es requerido.'),
    
    // Section 8 - SARLAFT
    sarlaftAccepted: z
      .boolean()
      .refine((val) => val === true, 'Debe aceptar los términos.'),
    
    // Status fields
    formLocked: z.boolean().optional(),
    disabled: z.boolean().optional(),
    criticalityLevel: z.enum(['Crítico', 'No Crítico']).optional(),
  })
  .superRefine((data, ctx) => {
    // Section 4: Legal Representative validation
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
          message: 'El tipo de documento es requerido.',
          path: ['legalRepresentativeDocumentType'],
        });
      }
      if (!data.legalRepresentativeDocumentNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El número de documento es requerido.',
          path: ['legalRepresentativeDocumentNumber'],
        });
      }
    }

    // Section 2: Tax Information validation
    if (data.taxRegimeType === 'Común') {
      if (!data.isLargeTaxpayer) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Requerido.', path: ['isLargeTaxpayer'] });
      }
      if (data.isLargeTaxpayer === 'Sí' && !data.largeTaxpayerResolution) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Resolución requerida.', path: ['largeTaxpayerResolution'] });
      }
    }
    
    // Section 3: Environmental validation
    if (data.implementsEnvironmentalMeasures === 'Sí' && !data.environmentalMeasuresDescription) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Debe describir las medidas ambientales.',
            path: ['environmentalMeasuresDescription'],
        });
    }

    // Section 6: Document validation
    const checkFile = (field: keyof typeof data, name: string) => {
        const fileList = data[field] as FileList | undefined;
        const urlField = `${String(field)}Url` as keyof typeof data;
        const url = data[urlField] as string | undefined;

        if (!url && (!fileList || fileList.length === 0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Adjunte el ${name}.`,
            path: [field as string],
          });
        }
    }

    if (data.personType === 'Persona Jurídica') {
      checkFile('rutFile', 'RUT');
      checkFile('camaraComercioFile', 'Cámara de Comercio');
      checkFile('estadosFinancierosFile', 'Estados Financieros');
      checkFile('declaracionRentaFile', 'Declaración de Renta');
      checkFile('cedulaRepresentanteLegalFile', 'Cédula Representante Legal');
      checkFile('certificacionBancariaFile', 'Certificación Bancaria');
    } else if (data.personType === 'Persona Natural') {
      checkFile('rutFile', 'RUT');
      checkFile('certificacionBancariaFile', 'Certificación Bancaria');
    }
  });

export const categorySchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().optional(),
  categoryType: z.string().min(1, 'El sector es requerido.'),
});

export const selectionEventSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  type: z.enum(['Productos', 'Servicios'], {
    errorMap: () => ({ message: 'Debes seleccionar un sector.' }),
  }),
  criticalityLevel: z.enum(['Crítico', 'No Crítico'], {
    errorMap: () => ({ message: 'Debes seleccionar el nivel de criticidad.' }),
  }),
});

export const criterionSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'El nombre del criterio es requerido.'),
  weight: z.coerce.number().min(0, 'El peso no puede ser negativo.').max(100, 'El peso no puede ser mayor a 100.'),
});

export const criteriaListSchema = z.object({
  criteria: z.array(criterionSchema)
}).refine(data => {
    const totalWeight = data.criteria.reduce((sum, crit) => sum + (Number(crit.weight) || 0), 0);
    return totalWeight === 100;
}, {
    message: 'La suma de los pesos de todos los criterios debe ser exactamente 100%.',
    path: ['criteria'],
});


export const competitorSchema = z.object({
  name: z.string().min(1, 'El nombre del competidor es requerido.'),
  nit: z.string().min(1, 'El NIT es requerido.').regex(/^[0-9]+$/, 'El NIT solo debe contener números.'),
  email: z.string().email('Por favor, ingresa un email válido.'),
  quoteFile: fileSchemaOptional,
});

export const criteriaWeightsSchema = z.object({
  criteria: z.array(z.object({
    id: z.string(),
    label: z.string(),
    weight: z.coerce.number().min(0, "Debe ser >= 0").max(100, "Debe ser <= 100"),
  }))
}).refine(data => {
    const totalWeight = data.criteria.reduce((sum, crit) => sum + (Number(crit.weight) || 0), 0);
    return Math.abs(totalWeight - 100) < 0.01;
}, {
    message: 'La suma de los pesos debe ser exactamente 100%.',
    path: ['criteria'],
});

export const inviteProviderSchema = z.object({
  name: z.string().min(1, 'El nombre del proveedor es requerido.'),
  email: z.string().email('Por favor, ingresa un email válido.'),
});
