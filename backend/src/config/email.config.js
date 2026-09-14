require('dotenv').config();

// Render's free tier blocks all outbound SMTP ports (25, 465, 587) —
// confirmed directly in Render's own docs, not fixable with DNS/IPv4
// tuning. Resend sends over a normal HTTPS API call instead, which is
// never blocked on any hosting tier.
const RESEND_API_KEY = process.env.RESEND_API_KEY || null;

// Must be an address on a domain you've verified in the Resend
// dashboard (Settings > Domains) — Resend rejects sends from
// unverified domains.
const FROM_EMAIL = process.env.FROM_EMAIL || 'contactus@roamingroute.in';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Roaming Route Travel and Transport';

// Where new-booking notifications go — defaults to the sending address
// itself if not set separately.
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || FROM_EMAIL;

// Email notifications stay inactive until the API key is set — see
// email.service.js for the graceful "log and skip" behavior while off,
// same dormant-until-configured pattern as Razorpay, Mapbox, and Google
// Reviews.
const isEmailEnabled = Boolean(RESEND_API_KEY);

module.exports = {
  RESEND_API_KEY,
  FROM_EMAIL,
  EMAIL_FROM_NAME,
  ADMIN_NOTIFICATION_EMAIL,
  isEmailEnabled,
};
