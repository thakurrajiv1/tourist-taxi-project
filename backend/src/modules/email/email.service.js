const { Resend } = require('resend');
const {
  RESEND_API_KEY,
  FROM_EMAIL,
  EMAIL_FROM_NAME,
  isEmailEnabled,
} = require('../../config/email.config');

let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Sends an email via Resend's HTTPS API. Degrades gracefully when it
 * isn't configured yet — logs and returns rather than throwing, so
 * booking creation/confirmation/cancellation/driver-assignment never
 * fail just because nobody has set RESEND_API_KEY yet. Every call site
 * in bookings.service.js wraps this in its own try/catch as a second
 * layer of protection, since email delivery should never block or break
 * a booking operation that already succeeded in the database.
 */
async function sendEmail({ to, subject, html }) {
  if (!isEmailEnabled) {
    console.log(`[email] Resend not configured — skipped email "${subject}" to ${to}`);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const { data, error } = await getResendClient().emails.send({
      from: `${EMAIL_FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[email] Resend rejected "${subject}" to ${to}:`, error.message || error);
      return { sent: false, reason: 'send_failed', error: error.message || String(error) };
    }

    return { sent: true, id: data && data.id };
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
    return { sent: false, reason: 'send_failed', error: err.message };
  }
}

module.exports = { sendEmail, getResendClient };
