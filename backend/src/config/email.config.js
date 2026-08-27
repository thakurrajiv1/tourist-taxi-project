require('dotenv').config();

// Hostinger's SMTP hostname is universal (not per-domain) — smtp.hostinger.com
// on port 465 with SSL, authenticated with the full mailbox address and
// its password. Confirmed against Hostinger's current documentation.
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
const SMTP_SECURE = SMTP_PORT === 465; // true = SSL (465), false = STARTTLS (587)
const SMTP_USER = process.env.SMTP_USER || null; // e.g. contactus@roamingroute.in
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || null;

const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Roaming Route Travel and Transport';
// Where new-booking notifications go — defaults to the sending mailbox
// itself if not set separately.
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || SMTP_USER;

// Email notifications stay inactive until both credentials are set — see
// email.service.js for the graceful "log and skip" behavior while off,
// same dormant-until-configured pattern as Razorpay, Mapbox, and Google
// Reviews.
const isEmailEnabled = Boolean(SMTP_USER && SMTP_PASSWORD);

module.exports = {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASSWORD,
  EMAIL_FROM_NAME,
  ADMIN_NOTIFICATION_EMAIL,
  isEmailEnabled,
};
