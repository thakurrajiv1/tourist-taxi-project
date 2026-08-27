const nodemailer = require('nodemailer');
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASSWORD,
  EMAIL_FROM_NAME,
  isEmailEnabled,
} = require('../../config/email.config');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE, // true for 465 (SSL), false for 587 (STARTTLS)
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
  }
  return transporter;
}

/**
 * Sends an email. Degrades gracefully when SMTP isn't configured yet —
 * logs and returns rather than throwing, so booking creation/confirmation/
 * cancellation/driver-assignment never fail just because nobody has set
 * SMTP_PASSWORD yet. Every call site in bookings.service.js wraps this in
 * its own try/catch as a second layer of protection, since email delivery
 * should never block or break a booking operation.
 */
async function sendEmail({ to, subject, html }) {
  if (!isEmailEnabled) {
    console.log(`[email] SMTP not configured — skipped email "${subject}" to ${to}`);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    await getTransporter().sendMail({
      from: `"${EMAIL_FROM_NAME}" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
    return { sent: false, reason: 'send_failed', error: err.message };
  }
}

module.exports = { sendEmail, getTransporter };
