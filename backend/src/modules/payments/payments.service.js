const crypto = require('crypto');
const pool = require('../../config/db');
const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
  ADVANCE_PAYMENT_PERCENTAGE,
  isPaymentGatewayEnabled,
} = require('../../config/payment.config');

async function getBookingById(id) {
  const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Creates a Razorpay order for a booking's advance payment.
 * Degrades gracefully when the gateway isn't configured yet — returns a
 * clear "not live yet" response instead of throwing, so the booking flow
 * never breaks just because Razorpay hasn't been set up.
 */
async function createPaymentOrder(bookingId) {
  const booking = await getBookingById(bookingId);

  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  if (booking.payment_preference !== 'pay_now') {
    const err = new Error('This booking was not marked for online payment');
    err.statusCode = 400;
    throw err;
  }

  if (booking.payment_status === 'paid') {
    const err = new Error('This booking has already been paid');
    err.statusCode = 400;
    throw err;
  }

  if (!isPaymentGatewayEnabled) {
    return {
      payment_gateway_enabled: false,
      message:
        "Online payment isn't live yet. Our team will contact you shortly to arrange the advance payment.",
      booking_id: booking.id,
      quoted_fare: parseFloat(booking.quoted_fare),
    };
  }

  if (ADVANCE_PAYMENT_PERCENTAGE === null) {
    // Keys exist but nobody has decided the advance amount yet — refuse
    // rather than guess a number that could be wrong.
    const err = new Error(
      'Payment gateway keys are set but ADVANCE_PAYMENT_PERCENTAGE is not configured in .env. ' +
        'Set it before accepting real payments.'
    );
    err.statusCode = 500;
    throw err;
  }

  // Lazy-required so the app runs fine without the razorpay package
  // installed while the gateway is disabled.
  const Razorpay = require('razorpay');
  const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

  const advanceAmount = Math.round(
    parseFloat(booking.quoted_fare) * (ADVANCE_PAYMENT_PERCENTAGE / 100)
  );
  const amountInPaise = advanceAmount * 100; // Razorpay expects the smallest currency unit

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `booking_${booking.id}`,
    notes: { booking_id: String(booking.id) },
  });

  await pool.query(
    `UPDATE bookings
     SET razorpay_order_id = $1, advance_amount = $2, payment_status = 'initiated'
     WHERE id = $3`,
    [order.id, advanceAmount, booking.id]
  );

  return {
    payment_gateway_enabled: true,
    order_id: order.id,
    amount: advanceAmount,
    currency: 'INR',
    key_id: RAZORPAY_KEY_ID, // the public key — safe to expose to the frontend
    booking_id: booking.id,
  };
}

/**
 * Verifies that a webhook actually came from Razorpay using HMAC-SHA256
 * over the raw request body, per Razorpay's webhook signing scheme.
 */
function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');
  }
  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signatureHeader;
}

async function handlePaymentCaptured(orderId, paymentId) {
  await pool.query(
    `UPDATE bookings
     SET payment_status = 'paid', booking_status = 'confirmed', razorpay_payment_id = $1
     WHERE razorpay_order_id = $2`,
    [paymentId, orderId]
  );
}

async function handlePaymentFailed(orderId) {
  await pool.query(
    `UPDATE bookings SET payment_status = 'failed' WHERE razorpay_order_id = $1`,
    [orderId]
  );
}

module.exports = {
  createPaymentOrder,
  verifyWebhookSignature,
  handlePaymentCaptured,
  handlePaymentFailed,
};
