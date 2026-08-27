const crypto = require('crypto');
const pool = require('../../config/db');
const {
  RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET,
  ADVANCE_PAYMENT_PERCENTAGE, isPaymentGatewayEnabled,
} = require('../../config/payment.config');
const { sendEmail } = require('../email/email.service');
const { bookingConfirmedEmail } = require('../email/templates');

async function getBookingById(id) {
  const result = await pool.query(
    `SELECT b.*, fc.name AS from_city_name, tc.name AS to_city_name, vt.name AS vehicle_type_name
     FROM bookings b
     LEFT JOIN cities fc ON fc.id = b.from_city_id
     LEFT JOIN cities tc ON tc.id = b.to_city_id
     JOIN vehicle_types vt ON vt.id = b.vehicle_type_id
     WHERE b.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function getBookingByOrderId(orderId) {
  const result = await pool.query(
    `SELECT b.*, fc.name AS from_city_name, tc.name AS to_city_name, vt.name AS vehicle_type_name
     FROM bookings b
     LEFT JOIN cities fc ON fc.id = b.from_city_id
     LEFT JOIN cities tc ON tc.id = b.to_city_id
     JOIN vehicle_types vt ON vt.id = b.vehicle_type_id
     WHERE b.razorpay_order_id = $1`,
    [orderId]
  );
  return result.rows[0] || null;
}

async function createPaymentOrder(bookingId) {
  const booking = await getBookingById(bookingId);
  if (!booking) { const err = new Error('Booking not found'); err.statusCode = 404; throw err; }
  if (booking.payment_preference !== 'pay_now') { const err = new Error('This booking was not marked for online payment'); err.statusCode = 400; throw err; }
  if (booking.payment_status === 'paid') { const err = new Error('This booking has already been paid'); err.statusCode = 400; throw err; }

  if (!isPaymentGatewayEnabled) {
    return { payment_gateway_enabled: false, message: "Online payment isn't live yet. Our team will contact you shortly to arrange the advance payment.", booking_id: booking.id, quoted_fare: parseFloat(booking.quoted_fare) };
  }
  if (ADVANCE_PAYMENT_PERCENTAGE === null) {
    const err = new Error('Payment gateway keys are set but ADVANCE_PAYMENT_PERCENTAGE is not configured in .env. Set it before accepting real payments.');
    err.statusCode = 500; throw err;
  }

  const Razorpay = require('razorpay');
  const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  const advanceAmount = Math.round(parseFloat(booking.quoted_fare) * (ADVANCE_PAYMENT_PERCENTAGE / 100));
  const order = await razorpay.orders.create({ amount: advanceAmount * 100, currency: 'INR', receipt: `booking_${booking.id}`, notes: { booking_id: String(booking.id) } });

  await pool.query(`UPDATE bookings SET razorpay_order_id = $1, advance_amount = $2, payment_status = 'initiated' WHERE id = $3`, [order.id, advanceAmount, booking.id]);

  return { payment_gateway_enabled: true, order_id: order.id, amount: advanceAmount, currency: 'INR', key_id: RAZORPAY_KEY_ID, booking_id: booking.id };
}

function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!RAZORPAY_WEBHOOK_SECRET) throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');
  const expected = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return expected === signatureHeader;
}

/**
 * A payment succeeding is a second path to booking_status = 'confirmed',
 * alongside the manual admin confirm in bookings.service.js — both need
 * to send the same "you're confirmed" email, since the customer doesn't
 * care which path got them there.
 */
async function handlePaymentCaptured(orderId, paymentId) {
  await pool.query(
    `UPDATE bookings SET payment_status = 'paid', booking_status = 'confirmed', razorpay_payment_id = $1 WHERE razorpay_order_id = $2`,
    [paymentId, orderId]
  );

  try {
    const booking = await getBookingByOrderId(orderId);
    if (booking && booking.customer_email) {
      const { subject, html } = bookingConfirmedEmail(booking);
      await sendEmail({ to: booking.customer_email, subject, html });
    }
  } catch (err) {
    // Payment already succeeded and the DB is already updated — an email
    // hiccup here must never surface as a failed payment to Razorpay's
    // webhook retry logic.
    console.error('[email] Failed to send payment-confirmed email:', err.message);
  }
}

async function handlePaymentFailed(orderId) {
  await pool.query(`UPDATE bookings SET payment_status = 'failed' WHERE razorpay_order_id = $1`, [orderId]);
}

module.exports = { createPaymentOrder, verifyWebhookSignature, handlePaymentCaptured, handlePaymentFailed };
