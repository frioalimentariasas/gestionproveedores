'use server';

import admin from '@/lib/firebase-admin';

// The admin emails to which notifications are sent.
const ADMIN_RECIPIENTS = [
  { email: 'asistente@frioalimentaria.com.co' },
  { email: 'sistemas@frioalimentaria.com.co' }
];
const SENDER_EMAIL = 'asistente@frioalimentaria.com.co';

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  sender?: { email: string; name?: string };
  replyTo?: { email: string; name?: string };
}

/**
 * Replaces placeholders like {{variableName}} with values from a data object.
 */
function replacePlaceholders(content: string, data: Record<string, string>) {
  let result = content;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, value || '');
  }
  return result;
}

/**
 * Attempts to load a dynamic template from Firestore using Admin SDK.
 */
async function getDynamicTemplate(templateId: string, variables: Record<string, string>) {
  try {
    // Check if admin is properly initialized
    if (!admin || !admin.apps.length) {
      console.warn('Firebase Admin not initialized. Using fallback email templates.');
      return null;
    }

    const templateSnap = await admin.firestore().collection('notification_templates').doc(templateId).get();

    if (templateSnap.exists) {
      const templateData = templateSnap.data();
      if (!templateData) return null;
      
      return {
        subject: replacePlaceholders(templateData.subject, variables),
        htmlContent: replacePlaceholders(templateData.htmlContent, variables),
      };
    }
  } catch (e) {
    console.error(`Error loading dynamic template ${templateId}:`, e);
  }
  return null;
}

/**
 * Sends a transactional email using the Brevo API via fetch.
 */
async function sendTransactionalEmail({
  to,
  subject,
  htmlContent,
  sender = {
    email: SENDER_EMAIL,
    name: 'Notificacion Gestion de proveedores FAL',
  },
  replyTo
}: SendEmailParams): Promise<{ success: boolean; error?: string; data?: any }> {
  // Reading key inside the function to ensure it's not cached as undefined during build
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    const errorMsg = 'BREVO_API_KEY is not configured in environment variables.';
    console.error(`[EMAIL ERROR]: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const payload: any = {
    sender,
    to,
    subject,
    htmlContent,
  };

  if (replyTo) {
    payload.replyTo = replyTo;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Could not parse error response from Brevo API.' }));
      const errorMessage = `Brevo API Error: ${response.status} ${response.statusText}. Details: ${errorData.message || 'No additional details provided.'}`;
      console.error('[BREVO API ERROR]:', errorMessage, errorData);
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    console.log('[EMAIL SUCCESS]: Message ID:', data.messageId, 'Sent to:', to.map(t => t.email).join(', '));
    return { success: true, data };
  } catch (error) {
    console.error('[NETWORK ERROR]: Failed to reach Brevo API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown network error occurred while sending the email.';
    return { success: false, error: errorMessage };
  }
}

// --- Email Notification Actions ---

export async function notifyAdminOfNewProvider({
  businessName,
  documentNumber,
  email,
  eventId,
}: {
  businessName: string;
  documentNumber: string;
  email: string;
  eventId?: string | null;
}) {
  const variables = { businessName, documentNumber, email, eventId: eventId || 'Registro Directo' };
  const dynamic = await getDynamicTemplate('new_provider_admin', variables);

  const subject = dynamic?.subject || `Nuevo Proveedor Registrado: ${businessName}`;
  const htmlContent = dynamic?.htmlContent || `
    <h1>Nuevo Proveedor en la Plataforma</h1>
    <p>Se ha registrado un nuevo proveedor en el portal.</p>
    <ul>
      <li><strong>Razón Social:</strong> ${businessName}</li>
      <li><strong>Documento:</strong> ${documentNumber}</li>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Origen:</strong> ${eventId ? `Proceso de Selección (ID: ${eventId})` : 'Registro Directo / Invitación'}</li>
    </ul>
    <p>Puedes revisar los detalles en el panel de administración.</p>
  `;

  return await sendTransactionalEmail({
    to: ADMIN_RECIPIENTS,
    subject,
    htmlContent,
    replyTo: { email: email, name: businessName },
  });
}

export async function notifyAdminOfFormUpdate({
  businessName,
  email,
}: {
  businessName: string;
  email: string;
}) {
  const variables = { businessName, email };
  const dynamic = await getDynamicTemplate('form_update_admin', variables);

  const subject = dynamic?.subject || `Proveedor Actualizó su Información: ${businessName}`;
  const htmlContent = dynamic?.htmlContent || `
    <h1>Actualización de Formulario</h1>
    <p>El proveedor <strong>${businessName}</strong> (${email}) ha actualizado y guardado su formulario en la plataforma.</p>
    <p>Los datos han sido bloqueados y están listos para tu revisión en el panel de administración.</p>
  `;

  return await sendTransactionalEmail({
    to: ADMIN_RECIPIENTS,
    subject,
    htmlContent,
    replyTo: { email: email, name: businessName },
  });
}

export async function notifyAdminOfReactivationRequest({
  providerEmail,
  businessName,
  justification,
}: {
  providerEmail: string;
  businessName: string;
  justification?: string;
}) {
  const variables = { providerEmail, businessName, justification: justification || 'No proporcionada' };
  const dynamic = await getDynamicTemplate('reactivation_request_admin', variables);

  const subject = dynamic?.subject || `Solicitud de Reactivación de Cuenta: ${businessName}`;
  const htmlContent = dynamic?.htmlContent || `
    <h1>Solicitud de Reactivación de Cuenta</h1>
    <p>El proveedor <strong>${businessName}</strong> (${providerEmail}) solicita reactivar su cuenta.</p>
    <p><strong>Justificación:</strong></p>
    <p>${justification || 'No proporcionada'}</p>
  `;

  return await sendTransactionalEmail({
    to: ADMIN_RECIPIENTS,
    subject,
    htmlContent,
    replyTo: { email: providerEmail, name: businessName },
  });
}

export async function notifyProviderFormSubmitted({
  providerEmail,
  providerName,
}: {
  providerEmail: string;
  providerName: string;
}) {
  const variables = { providerName };
  const dynamic = await getDynamicTemplate('form_submitted_provider', variables);

  const subject = dynamic?.subject || 'Confirmación: Formulario de Registro Recibido';
  const htmlContent = dynamic?.htmlContent || `
    <h1>Hola, ${providerName}</h1>
    <p>Hemos recibido tu formulario de registro en nuestra plataforma de gestión de proveedores.</p>
    <p>Tu información ha sido bloqueada y se encuentra ahora en proceso de revisión por nuestro equipo técnico y de calidad.</p>
    <p>Te notificaremos cualquier novedad a través de este correo electrónico.</p>
    <br>
    <p>Gracias,</p>
    <p>El equipo de Frioalimentaria SAS</p>
  `;

  return await sendTransactionalEmail({
    to: [{ email: providerEmail, name: providerName }],
    subject,
    htmlContent,
  });
}

export async function notifyProviderFormUnlocked({
  providerEmail,
  providerName,
}: {
  providerEmail: string;
  providerName: string;
}) {
  const variables = { providerName };
  const dynamic = await getDynamicTemplate('form_unlocked_provider', variables);

  const subject = dynamic?.subject || 'Tu formulario de proveedor ha sido habilitado para edición';
  const htmlContent = dynamic?.htmlContent || `
    <h1>Hola, ${providerName}</h1>
    <p>Te informamos que tu formulario de proveedor ha sido <strong>habilitado para edición</strong>.</p>
    <p>Ahora puedes realizar los cambios necesarios. Una vez guardes, el formulario se volverá a bloquear.</p>
    <br>
    <p>Gracias,</p>
    <p>El equipo de Frioalimentaria SAS</p>
  `;

  return await sendTransactionalEmail({
    to: [{ email: providerEmail, name: providerName }],
    subject,
    htmlContent,
  });
}

export async function notifyProviderPasswordReset({
  providerEmail,
  providerName,
  newPassword,
}: {
  providerEmail: string;
  providerName: string;
  newPassword: string;
}) {
  const variables = { providerName, newPassword };
  const dynamic = await getDynamicTemplate('password_reset_provider', variables);

  const subject = dynamic?.subject || 'Restablecimiento de Contraseña de su Cuenta';
  const htmlContent = dynamic?.htmlContent || `
    <h1>Hola, ${providerName}</h1>
    <p>Tu nueva contraseña temporal es: <strong>${newPassword}</strong></p>
    <br>
    <p>Gracias,</p>
    <p>El equipo de Frioalimentaria SAS</p>
  `;
  
  return await sendTransactionalEmail({
    to: [{ email: providerEmail, name: providerName }],
    subject,
    htmlContent,
  });
}

export async function notifyProviderAccountStatus({
  providerEmail,
  providerName,
  status,
}: {
  providerEmail: string;
  providerName: string;
  status: 'activada' | 'desactivada';
}) {
  const variables = { providerName, status };
  const dynamic = await getDynamicTemplate('account_status_provider', variables);

  const subject = dynamic?.subject || `Su cuenta de proveedor ha sido ${status}`;
  const htmlContent = dynamic?.htmlContent || `
    <h1>Hola, ${providerName}</h1>
    <p>Le informamos que su cuenta ha sido <strong>${status}</strong> por un administrador.</p>
    <br>
    <p>Gracias,</p>
    <p>El equipo de Frioalimentaria SAS</p>
  `;
  
  return await sendTransactionalEmail({
    to: [{ email: providerEmail, name: providerName }],
    subject,
    htmlContent,
  });
}

export async function notifyWinnerOfSelection({
  competitorEmail,
  competitorName,
  selectionProcessName,
  eventId,
}: {
  competitorEmail: string;
  competitorName: string;
  selectionProcessName: string;
  eventId: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.gestionproveedores.frioalimentaria.com.co';
  const registrationUrl = `${baseUrl}/auth/register?eventId=${eventId}`;
  
  const variables = { competitorName, selectionProcessName, registrationUrl };
  const dynamic = await getDynamicTemplate('winner_selection_provider', variables);

  const subject = dynamic?.subject || `¡Felicitaciones! Has sido seleccionado en el proceso: ${selectionProcessName}`;
  const htmlContent = dynamic?.htmlContent || `
    <h1>Hola, ${competitorName}</h1>
    <p>Has sido seleccionado para el proceso: <strong>${selectionProcessName}</strong>.</p>
    <p>El siguiente paso es completar tu registro:</p>
    <p><a href="${registrationUrl}">Registrarse como Proveedor</a></p>
    <br>
    <p>¡Esperamos trabajar contigo!</p>
    <p>El equipo de Frioalimentaria SAS</p>
  `;

  return await sendTransactionalEmail({
    to: [{ email: competitorEmail, name: competitorName }],
    subject,
    htmlContent,
  });
}

export async function sendDirectInvitation({
  providerName,
  providerEmail,
}: {
  providerName: string;
  providerEmail: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.gestionproveedores.frioalimentaria.com.co';
  const registrationUrl = `${baseUrl}/auth/register`;
  
  const variables = { providerName, registrationUrl };
  const dynamic = await getDynamicTemplate('direct_invitation_provider', variables);

  const subject = dynamic?.subject || 'REGISTRO DE PROVEEDOR FRIOALIMENTARIA SAS';
  const htmlContent = dynamic?.htmlContent || `
    <p>Buen día Estimado Proveedor <strong>${providerName}</strong>,</p>
    <p>Le invitamos a registrarse en nuestro portal: <a href="${registrationUrl}">${registrationUrl}</a></p>
    <br>
    <p>Cordialmente,</p>
    <p><strong>El equipo de Frioalimentaria SAS</strong></p>
  `;

  return await sendTransactionalEmail({
    to: [{ email: providerEmail, name: providerName }],
    subject,
    htmlContent,
  });
}

export async function notifyProviderPendingForm({
  providerEmail,
  providerName,
  daysLeft,
}: {
  providerEmail: string;
  providerName: string;
  daysLeft?: number;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.gestionproveedores.frioalimentaria.com.co';
  const loginUrl = `${baseUrl}/auth/login`;
  
  const variables = { providerName, loginUrl, daysLeft: daysLeft?.toString() || 'pocos' };
  const dynamic = await getDynamicTemplate('pending_form_reminder_provider', variables);

  const subject = dynamic?.subject || 'Recordatorio: Diligenciamiento de Formulario Pendiente';
  const htmlContent = dynamic?.htmlContent || `
    <h1>Hola, ${providerName}</h1>
    <p>Aún no has finalizado el diligenciamiento de tu registro.</p>
    ${daysLeft ? `<p>Solo cuentas con ${daysLeft} días antes del bloqueo automático.</p>` : ''}
    <p><a href="${loginUrl}">Ir al Formulario</a></p>
    <br>
    <p>Gracias,</p>
    <p>El equipo de Frioalimentaria SAS</p>
  `;

  return await sendTransactionalEmail({
    to: [{ email: providerEmail, name: providerName }],
    subject,
    htmlContent,
  });
}

export async function notifyProviderWelcomePlazo({
  providerEmail,
  providerName,
}: {
  providerEmail: string;
  providerName: string;
}) {
  const variables = { providerName };
  const dynamic = await getDynamicTemplate('welcome_plazo_provider', variables);

  const subject = dynamic?.subject || 'Bienvenido a Frioalimentaria - Inicio de Registro de Proveedor';
  const htmlContent = dynamic?.htmlContent || `
    <h1>Hola, ${providerName}</h1>
    <p>Tu cuenta ha sido creada. Cuentas con un plazo máximo de <strong>8 días calendario</strong> para completar tu registro.</p>
    <br>
    <p>Gracias,</p>
    <p>El equipo de Frioalimentaria SAS</p>
  `;

  return await sendTransactionalEmail({
    to: [{ email: providerEmail, name: providerName }],
    subject,
    htmlContent,
  });
}