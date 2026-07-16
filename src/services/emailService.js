/* ─────────────────────────────────────────────
   EMAIL SERVICE — envío transaccional vía Brevo.

   Se usa la API HTTP de Brevo (no SMTP) a propósito:
   el backend corre detrás de un proxy corporativo
   (Fortinet) que suele bloquear SMTP, pero deja pasar
   HTTPS — el mismo camino que ya usa la IA. El proxy
   se confía con NODE_EXTRA_CA_CERTS al arrancar.

   Si no hay BREVO_API_KEY configurada, el envío es un
   no-op silencioso (log de aviso): así el back sigue
   funcionando en desarrollo sin credenciales de mail.
───────────────────────────────────────────── */

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export const emailConfigurado = () => Boolean(process.env.BREVO_API_KEY);

const remitente = () => ({
  name: process.env.EMAIL_FROM_NAME || 'NEXIA',
  email: process.env.EMAIL_FROM || 'no-reply@nexia.edu',
});

/**
 * Envía un email individual. Lanza si Brevo responde con error, para que el
 * llamador (notificacionService) lo registre; nunca debe romper el request.
 */
export async function enviarEmailAsync({ to, toNombre, subject, html, text }) {
  if (!emailConfigurado()) {
    console.warn(`[email] BREVO_API_KEY no configurada — se omite el envío a ${to}`);
    return { skipped: true };
  }

  if (typeof fetch !== 'function') {
    throw new Error('fetch global no disponible: se requiere Node 18+');
  }

  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: remitente(),
      to: [{ email: to, name: toNombre || undefined }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    throw new Error(`Brevo respondió ${res.status}: ${detalle}`);
  }

  return { skipped: false };
}
