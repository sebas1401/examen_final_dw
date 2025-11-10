const nodemailer = require('nodemailer');
const dayjs = require('dayjs');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  SMTP_FROM,
  FRONTEND_BASE_URL = 'http://localhost:5173',
} = process.env;

const PLACEHOLDER_EMAIL_DOMAIN = 'reservas.local';

let transporter = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.warn('[email] Transporter no configurado. Mensaje que se enviaría:', {
      to,
      subject,
      html,
    });
    return;
  }
  await transporter.sendMail({
    from: SMTP_FROM || `Reservas Restaurante <${SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

function formatFechaHora({ fechaHora, fecha, hora }) {
  if (fechaHora) {
    const value = dayjs(fechaHora);
    if (value.isValid()) {
      return {
        fecha: value.format('DD/MM/YYYY'),
        hora: value.format('HH:mm'),
      };
    }
  }
  if (fecha && hora) {
    const value = dayjs(`${fecha}T${hora}`);
    if (value.isValid()) {
      return {
        fecha: value.format('DD/MM/YYYY'),
        hora: value.format('HH:mm'),
      };
    }
  }
  return {
    fecha: fecha || '',
    hora: hora || '',
  };
}

function buildUrl(path) {
  return `${FRONTEND_BASE_URL.replace(/\/$/, '')}${path}`;
}

function formatZona(preferenciaZona) {
  if (!preferenciaZona || preferenciaZona === 'SIN_PREFERENCIA') return null;
  const labels = {
    TERRAZA: 'Terraza',
    INTERIOR: 'Interior',
    VIP: 'VIP',
  };
  return labels[preferenciaZona] || null;
}

function buildReservationHtml({ nombre, fechaText, horaText, mesa, personas, comentarios, preferenciaZona }) {
  const zonaLabel = formatZona(preferenciaZona);
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#3a2b23">
      <p>Hola <strong>${nombre || 'cliente'}</strong>,</p>
      <p>Tu reserva ha sido confirmada para el <strong>${fechaText}</strong> a las <strong>${horaText}</strong>.</p>
      <ul style="padding-left:16px">
        ${mesa ? `<li>Mesa asignada: <strong>${mesa}</strong></li>` : ''}
        ${personas ? `<li>Número de personas: <strong>${personas}</strong></li>` : ''}
        ${zonaLabel ? `<li>Ubicación solicitada: <strong>${zonaLabel}</strong></li>` : ''}
      </ul>
      ${comentarios ? `<p><em>Comentarios:</em> ${comentarios}</p>` : ''}
      <p>Si necesitas realizar algún cambio, responde a este correo o ingresa al portal.</p>
      <p>¡Te esperamos!</p>
    </div>
  `;
}

function buildCancellationHtml({ nombre, fechaText, horaText, mesa, personas, motivo }) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#3a2b23">
      <p>Hola <strong>${nombre || 'cliente'}</strong>,</p>
      <p>Tu reserva programada para el <strong>${fechaText}</strong> a las <strong>${horaText}</strong> ha sido cancelada por el equipo.</p>
      <ul style="padding-left:16px">
        ${mesa ? `<li>Mesa asignada: <strong>${mesa}</strong></li>` : ''}
        ${personas ? `<li>Número de personas: <strong>${personas}</strong></li>` : ''}
      </ul>
      ${motivo ? `<p><em>Motivo:</em> ${motivo}</p>` : ''}
      <p>Si deseas reagendar, contesta este correo o visita el portal.</p>
    </div>
  `;
}

async function sendReservationConfirmation({
  to,
  nombre,
  fechaHora,
  fecha,
  hora,
  mesa,
  personas,
  comentarios,
  preferenciaZona,
}) {
  if (!to || to.endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`)) return;
  const { fecha: fechaText, hora: horaText } = formatFechaHora({ fechaHora, fecha, hora });
  const html = buildReservationHtml({ nombre, fechaText, horaText, mesa, personas, comentarios, preferenciaZona });
  await sendEmail({
    to,
    subject: 'Tu reserva ha sido confirmada',
    html,
  });
}

async function sendCancellationNotice({
  to,
  nombre,
  fechaHora,
  fecha,
  hora,
  mesa,
  personas,
  motivo,
}) {
  if (!to || to.endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`)) return;
  const { fecha: fechaText, hora: horaText } = formatFechaHora({ fechaHora, fecha, hora });
  const html = buildCancellationHtml({ nombre, fechaText, horaText, mesa, personas, motivo });
  await sendEmail({
    to,
    subject: 'Tu reserva ha sido cancelada',
    html,
  });
}

module.exports = {
  sendEmail,
  buildUrl,
  sendReservationConfirmation,
  sendCancellationNotice,
  PLACEHOLDER_EMAIL_DOMAIN,
};
