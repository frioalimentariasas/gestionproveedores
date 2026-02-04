'use server';

if (!process.env.BREVO_API_KEY) {
  console.error('BREVO_API_KEY is not set. Emails will not be sent.');
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (!ADMIN_EMAIL) {
  console.warn('ADMIN_EMAIL is not set. Admin notifications will not be sent.');
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
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('Brevo API key is not configured. Email not sent.');
    return { success: false, error: 'Brevo API key is not configured.' };
  }

  const payload = {
    sender,
    to,
    subject,
    htmlContent,
  };

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
      const errorData = await response.json();
      console.error('Error sending Brevo email:', errorData);
      const errorMessage = `Brevo API Error: ${response.status} ${response.statusText}. Message: ${errorData.message || 'No additional details.'}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Brevo email sent successfully. Message ID:', data.messageId);
    return { success: true, data };
  } catch (error) {
    console.error('Error in sendTransactionalEmail:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred while sending the email.' };
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

/**
 * Notifies a provider that their password has been reset by an administrator.
 */
export async function notifyProviderPasswordReset({
  providerEmail,
  providerName,
  newPassword,
}: {
  providerEmail: string;
  providerName: string;
  newPassword: string;
}) {
  const subject = 'Restablecimiento de Contraseña de su Cuenta de Proveedor';
  const htmlContent = `
    <h1>Hola, ${providerName}</h1>
    <p>Un administrador ha restablecido la contraseña de su cuenta en el portal de proveedores de Frioalimentaria.</p>
    <p>Su nueva contraseña temporal es: <strong>${newPassword}</strong></p>
    <p>Le recomendamos iniciar sesión y cambiarla lo antes posible desde la sección "Mi Cuenta".</p>
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

/**
 * Notifies a provider about a change in their account status (activated/deactivated).
 */
export async function notifyProviderAccountStatus({
  providerEmail,
  providerName,
  status,
}: {
  providerEmail: string;
  providerName:string;
  status: 'activada' | 'desactivada';
}) {
  const subject = `Su cuenta de proveedor ha sido ${status}`;
  const htmlContent = `
    <h1>Hola, ${providerName}</h1>
    <p>Le informamos que su cuenta en el portal de proveedores de Frioalimentaria ha sido <strong>${status}</strong> por un administrador.</p>
    ${status === 'desactivada' ? '<p>No podrá acceder a la plataforma hasta que su cuenta sea reactivada. Si cree que esto es un error, por favor póngase en contacto con nosotros.</p>' : '<p>Ya puede acceder a la plataforma con sus credenciales.</p>'}
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

/**
 * Notifies the admin that a disabled user has requested to have their account reactivated.
 */
export async function notifyAdminOfReactivationRequest({
  providerEmail,
}: {
  providerEmail: string;
}) {
  if (!ADMIN_EMAIL) {
    return { success: false, error: 'Admin email not configured.' };
  }

  const subject = `Solicitud de Reactivación de Cuenta: ${providerEmail}`;
  const htmlContent = `
    <h1>Solicitud de Reactivación de Cuenta</h1>
    <p>El proveedor con el correo electrónico <strong>${providerEmail}</strong> ha solicitado que su cuenta sea reactivada.</p>
    <p>Por favor, inicie sesión en el panel de administración para revisar y habilitar la cuenta si lo considera apropiado.</p>
  `;

  return await sendTransactionalEmail({
    to: [{ email: ADMIN_EMAIL }],
    subject,
    htmlContent,
  });
}
