'use server';

// The Brevo API key is sensitive and should be stored in an environment variable.
// Ensure you have a .env.local file with:
// BREVO_API_KEY=your_brevo_api_key
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// The admin email to which notifications are sent.
const ADMIN_EMAIL = 'asistente@frioalimentaria.com.co';
const SENDER_EMAIL = 'asistente@frioalimentaria.com.co';

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  sender?: { email: string; name?: string };
  replyTo?: { email: string; name?: string };
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
  if (!BREVO_API_KEY) {
    const errorMsg = 'Brevo API key is not configured. Cannot send email.';
    console.error(`sendTransactionalEmail failed: ${errorMsg}`);
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
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Could not parse error response from Brevo API.' }));
      const errorMessage = `Brevo API Error: ${response.status} ${response.statusText}. Details: ${errorData.message || 'No additional details provided.'}`;
      console.error('Error sending Brevo email:', errorMessage, errorData);
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    console.log('Brevo email sent successfully. Message ID:', data.messageId);
    return { success: true, data };
  } catch (error) {
    console.error('Error in sendTransactionalEmail fetch call:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown network error occurred while sending the email.';
    return { success: false, error: errorMessage };
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

  return await sendTransactionalEmail({
    to: [{ email: ADMIN_EMAIL }],
    subject,
    htmlContent,
    replyTo: { email: email, name: businessName },
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
  const subject = `Proveedor Actualizó su Información: ${businessName}`;
  const htmlContent = `
    <h1>Actualización de Formulario</h1>
    <p>El proveedor <strong>${businessName}</strong> (${email}) ha actualizado y guardado su formulario en la plataforma.</p>
    <p>Los datos han sido bloqueados y están listos para tu revisión en el panel de administración.</p>
  `;

  return await sendTransactionalEmail({
    to: [{ email: ADMIN_EMAIL }],
    subject,
    htmlContent,
    replyTo: { email: email, name: businessName },
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
    <p>Una vez que guardes los cambios, el formulario se volverá a bloquear.</p>
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
  providerName: string;
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
  businessName,
}: {
  providerEmail: string;
  businessName: string;
}) {
  const subject = `Solicitud de Reactivación de Cuenta: "${businessName}"`;
  const htmlContent = `
    <h1>Solicitud de Reactivación de Cuenta</h1>
    <p>El proveedor <strong>${businessName}</strong> (email: ${providerEmail}) ha solicitado que su cuenta sea reactivada.</p>
    <p>Por favor, inicie sesión en el panel de administración para revisar y habilitar la cuenta si lo considera apropiado.</p>
  `;

  return await sendTransactionalEmail({
    to: [{ email: ADMIN_EMAIL }],
    subject,
    htmlContent,
    replyTo: { email: providerEmail, name: businessName },
  });
}


/**
 * Notifies a competitor that they have been selected in a selection process and invites them to register.
 */
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
  const subject = `¡Felicitaciones! Has sido seleccionado en el proceso: ${selectionProcessName}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.gestionproveedores.frioalimentaria.com.co';
  const registrationUrl = `${baseUrl}/auth/register?eventId=${eventId}`;
  
  const htmlContent = `
    <h1>Hola, ${competitorName}</h1>
    <p>Nos complace informarte que has sido seleccionado para el proceso de selección: <strong>${selectionProcessName}</strong>.</p>
    <p>El siguiente paso es completar tu registro en nuestro portal de proveedores. Por favor, haz clic en el siguiente enlace para comenzar:</p>
    <p><a href="${registrationUrl}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #165793; text-decoration: none; border-radius: 5px;">Registrarse como Proveedor</a></p>
    <p>Si el botón no funciona, puedes copiar y pegar la siguiente URL en tu navegador:</p>
    <p>${registrationUrl}</p>
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

/**
 * Sends a direct invitation to an active provider to register in the platform.
 */
export async function sendDirectInvitation({
  providerName,
  providerEmail,
}: {
  providerName: string;
  providerEmail: string;
}) {
  const subject = 'REGISTRO DE PROVEEDOR FRIOALIMENTARIA SAS';
  const registrationUrl = 'https://app.gestionproveedores.frioalimentaria.com.co/auth/register';
  
  const htmlContent = `
    <p>Buen día Estimado Proveedor <strong>${providerName}</strong>,</p>
    <br>
    <p>Nos permitimos informarle que será vinculado como proveedor autorizado de nuestra compañía. Le damos una cordial bienvenida. Confiamos en que esta relación será productiva y que juntos alcanzaremos importantes logros. Le invitamos a registrarse y actualizar la informacion en el siguiente link: <a href="${registrationUrl}">${registrationUrl}</a></p>
    <br>
    <h3>Documentación y Facturación:</h3>
    <ol>
      <li><strong>Revisión de facturas y pagos:</strong> Para cualquier consulta relacionada con la revisión de facturas y pagos, por favor contacte a <a href="mailto:administracion@frioalimentaria.com.co">administracion@frioalimentaria.com.co</a>. Asegúrese de que las facturas se presenten correctamente y a tiempo para evitar retrasos en los pagos.</li>
      <li><strong>Orden de Compra (OC):</strong> Es indispensable contar con una Orden de Compra (OC) antes de proceder con la facturación. Esta debe ser solicitada al funcionario que requirió el servicio. Por favor, tenga en cuenta que sin este documento no es posible realizar la radicación de la factura.</li>
      <li><strong>Radicación de facturas electrónicas:</strong> Las facturas electrónicas deben ser enviadas al correo: <a href="mailto:asistente@frioalimentaria.com.co">asistente@frioalimentaria.com.co</a>.</li>
      <li><strong>Actualización documental y solicitudes adicionales:</strong> Para actualizaciones documentales o solicitudes adicionales, puede comunicarse al correo: <a href="mailto:asistente@frioalimentaria.com.co">asistente@frioalimentaria.com.co</a>.</li>
    </ol>
    <br>
    <p>Estamos a su disposición para resolver cualquier inquietud que pueda tener. Nuevamente, le damos la bienvenida y esperamos construir una relación comercial sólida y beneficiosa.</p>
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

/**
 * Notifies a provider that their form registration is still pending.
 */
export async function notifyProviderPendingForm({
  providerEmail,
  providerName,
}: {
  providerEmail: string;
  providerName: string;
}) {
  const subject = 'Recordatorio: Diligenciamiento de Formulario de Proveedor Pendiente';
  const htmlContent = `
    <h1>Hola, ${providerName}</h1>
    <p>Hemos notado que aún no has finalizado el diligenciamiento de tu formulario de registro en nuestra plataforma de proveedores de Frioalimentaria.</p>
    <p>Es indispensable completar toda la información y adjuntar los documentos obligatorios para que nuestro equipo pueda validar tu perfil y proceder con la vinculación formal.</p>
    <p>Por favor, ingresa con tus credenciales (NIT) en el siguiente enlace y completa los campos pendientes:</p>
    <p><a href="https://app.gestionproveedores.frioalimentaria.com.co/auth/login" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #165793; text-decoration: none; border-radius: 5px;">Ir al Formulario</a></p>
    <p>Una vez guardes y bloquees el formulario, recibiremos una notificación automática para su revisión.</p>
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
