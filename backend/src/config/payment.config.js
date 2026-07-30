require('dotenv').config();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || null;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || null;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || null;

// Percentage of the fare collected as advance for pay_now bookings.
// Intentionally left unset (null) until your finance team decides —
// see ADVANCE_PAYMENT_PERCENTAGE in .env. The payments service refuses to
// create a real order while this is null, rather than silently guessing.
const rawPercentage = process.env.ADVANCE_PAYMENT_PERCENTAGE;
const ADVANCE_PAYMENT_PERCENTAGE =
  rawPercentage && rawPercentage.trim() !== '' ? parseFloat(rawPercentage) : null;

// The gateway is only "on" once both Razorpay keys are present. Until then,
// every part of the app that touches payments degrades gracefully instead
// of erroring — see payments.service.js.
const isPaymentGatewayEnabled = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

module.exports = {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
  ADVANCE_PAYMENT_PERCENTAGE,
  isPaymentGatewayEnabled,
};
