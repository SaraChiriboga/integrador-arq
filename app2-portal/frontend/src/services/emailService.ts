import emailjs from '@emailjs/browser';

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;

interface ReportEmailParams {
  toEmail: string;
  requestId: string;
  pdfUrl: string;
}

/**
 * Envia el correo de "reporte listo" directo desde el navegador via EmailJS,
 * sin pasar por un backend con credenciales SMTP. Silencioso ante fallos
 * (no debe romper la experiencia de descarga del PDF si el correo falla).
 */
export const sendReportReadyEmail = async ({ toEmail, requestId, pdfUrl }: ReportEmailParams): Promise<void> => {
  if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
    console.warn('EmailJS no está configurado (faltan variables VITE_EMAILJS_* en .env); se omite el envío de correo.');
    return;
  }

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: toEmail,
        request_id: requestId,
        pdf_url: pdfUrl,
      },
      { publicKey: PUBLIC_KEY }
    );
  } catch (error) {
    console.error('No se pudo enviar el correo de reporte listo vía EmailJS:', error);
  }
};
