'use server';

import * as brevo from '@getbrevo/brevo';

// --- Brevo Setup ---
if (!process.env.BREVO_API_KEY) {
  console.error('BREVO_API_KEY is not set. Emails will not be sent.');
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (!ADMIN_EMAIL) {
  console.warn('ADMIN_EMAIL is not set. Admin notifications will not be sent.');
}

const apiInstance = new brevo.TransactionalEmailsApi();
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );
}

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  sender?: { email: string; name?: string };
}

async function sendTransactionalEmail({
  to,
  subject,
  htmlContent,
  sender = {
    email: 'no-reply@frioalimentaria.com.co',
    name: 'Frioalimentaria SAS',
  },
}: SendEmailParams) {
  if (!process.env.BREVO_API_KEY) {
    console.error('Brevo API key is not configured. Email not sent.');
    return { success: false, error: 'Brevo API key is not configured.' };
  }

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.sender = sender;
  sendSmtpEmail.to = to;
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Brevo email sent successfully.');
    return { success: true, data };
  } catch (error) {
    console.error('Error sending Brevo email:', error);
    return { success: false, error };
  }
}

// --- Email Notification Actions ---

/**
 * Notifies the admin when a new provider has completed the registration form.
 */
export async function notifyAdminOfNewProvider({
  businessName,
  documentNumber,
  email,
}: {
  businessName: string;
  documentNumber: string;
  email: string;
}) {
  if (!ADMIN_EMAIL) return;

  const subject = `Nuevo Proveedor Registrado: ${businessName}`;
  const htmlContent = `
    <h1>Nuevo Proveedor en la Plataforma</h1>
    <p>Se ha registrado un nuevo proveedor en el portal.</p>
    <ul>
      <li><strong>Razón Social:</strong> ${businessName}</li>
      <li><strong>Documento:</strong> ${documentNumber}</li>
      <li><strong>Email:</strong> ${email}</li>
    </ul>
    <p>Puedes revisar los detalles en el panel de administración.</p>
  `;

  await sendTransactionalEmail({
    to: [{ email: ADMIN_EMAIL }],
    subject,
    htmlContent,
  });
}

/**
 * Notifies the admin when a provider has submitted updates to their form.
 */
export async function notifyAdminOfFormUpdate({
  businessName,
  email,
}: {
  businessName: string;
  email: string;
}) {
  if (!ADMIN_EMAIL) return;

  const subject = `Proveedor Actualizó su Información: ${businessName}`;
  const htmlContent = `
    <h1>Actualización de Formulario</h1>
    <p>El proveedor <strong>${businessName}</strong> (${email}) ha actualizado y guardado su formulario en la plataforma.</p>
    <p>Los datos han sido bloqueados y están listos para tu revisión en el panel de administración.</p>
  `;

  await sendTransactionalEmail({
    to: [{ email: ADMIN_EMAIL }],
    subject,
    htmlContent,
  });
}

/**
 * Notifies a provider when an admin has unlocked their form for editing.
 */
export async function notifyProviderFormUnlocked({
  providerEmail,
  providerName,
}: {
  providerEmail: string;
  providerName: string;
}) {
  const subject = 'Tu formulario de proveedor ha sido habilitado para edición';
  const htmlContent = `
    <h1>Hola, ${providerName}</h1>
    <p>Te informamos que tu formulario de proveedor en la plataforma de Frioalimentaria ha sido <strong>habilitado para edición</strong>.</p>
    <p>Ahora puedes iniciar sesión y realizar los cambios necesarios en tu información.</p>
    <p>Una vez que guardes los cambios, el formulario se bloqueará nuevamente.</p>
    <br>
    <p>Gracias,</p>
    <p>El equipo de Frioalimentaria SAS</p>
  `;

  await sendTransactionalEmail({
    to: [{ email: providerEmail, name: providerName }],
    subject,
    htmlContent,
  });
}
