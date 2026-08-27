const crypto = require('crypto');
const pool = require('../../config/db');
const { getFare, getFareForCustomLocation } = require('../fare/fare.service');
const { sendEmail } = require('../email/email.service');
const {
  bookingReceivedCustomerEmail,
  bookingReceivedAdminEmail,
  bookingConfirmedEmail,
  bookingCancelledEmail,
  driverAssignedEmail,
} = require('../email/templates');
const { ADMIN_NOTIFICATION_EMAIL } = require('../../config/email.config');

const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateBookingInput(input) {
  const errors = [];
  const {
    from_city_id, to_city_id, from_address, to_address, vehicle_type_id, trip_type,
    pickup_date, return_date, customer_name, customer_phone,
    customer_email, payment_preference,
  } = input;

  const isCityBased = Boolean(from_city_id && to_city_id);
  const isAddressBased = Boolean(from_address && to_address);

  if (!isCityBased && !isAddressBased) {
    errors.push('Provide either from_city_id + to_city_id, or from_address + to_address');
  }
  if (!vehicle_type_id) errors.push('vehicle_type_id is required');
  if (!['one_way', 'round_trip', 'local'].includes(trip_type)) {
    errors.push('trip_type must be one_way, round_trip, or local');
  }
  if (!customer_name || customer_name.trim().length < 2) {
    errors.push('customer_name is required');
  }
  if (!customer_phone || !PHONE_REGEX.test(customer_phone.replace(/\s/g, ''))) {
    errors.push('customer_phone must be a valid 10-digit Indian mobile number');
  }
  if (customer_email && !EMAIL_REGEX.test(customer_email)) {
    errors.push('customer_email is not a valid email address');
  }
  if (!pickup_date) {
    errors.push('pickup_date is required');
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickup = new Date(pickup_date);
    if (pickup < today) {
      errors.push('pickup_date cannot be in the past');
    }
  }
  if (trip_type === 'round_trip' && !return_date) {
    errors.push('return_date is required for round_trip bookings');
  }
  if (return_date && pickup_date && new Date(return_date) < new Date(pickup_date)) {
    errors.push('return_date cannot be before pickup_date');
  }
  if (payment_preference && !['pay_now', 'pay_later'].includes(payment_preference)) {
    errors.push('payment_preference must be pay_now or pay_later');
  }

  return errors;
}

/**
 * A random, unguessable public identifier — safe to put in a tracking
 * URL or email unlike the sequential integer id (see Module: bookings
 * IDOR closure for why sequential ids can't be exposed publicly).
 */
function generateBookingReference() {
  return crypto.randomBytes(9).toString('base64url'); // 12 URL-safe chars
}

/**
 * Fires an email and never lets a failure propagate — email delivery
 * (or SMTP simply not being configured yet) must never break a booking
 * operation that already succeeded in the database. email.service.js
 * itself already catches send errors, but this wraps template-building
 * too, in case a template throws on unexpected data shapes.
 */
async function notifySafely(buildFn, ...args) {
  try {
    const { subject, html } = buildFn(...args);
    return subject && html ? { subject, html } : null;
  } catch (err) {
    console.error('[email] Failed to build email template:', err.message);
    return null;
  }
}

async function createBooking(input) {
  const {
    from_city_id, to_city_id, from_address, to_address, vehicle_type_id, trip_type,
    pickup_date, return_date, customer_name, customer_phone,
    customer_email, payment_preference,
  } = input;

  const isCityBased = Boolean(from_city_id && to_city_id);

  const quote = isCityBased
    ? await getFare({ from_city_id, to_city_id, vehicle_type_id, trip_type, pickup_date, return_date })
    : await getFareForCustomLocation({ from_address, to_address, vehicle_type_id, trip_type, pickup_date, return_date });

  if (quote.maps_enabled === false) {
    const err = new Error(quote.message);
    err.statusCode = 503;
    throw err;
  }

  const finalPaymentPreference = payment_preference || 'pay_later';
  const bookingStatus = finalPaymentPreference === 'pay_now' ? 'awaiting_payment' : 'pending';
  const bookingReference = generateBookingReference();

  const result = await pool.query(
    `INSERT INTO bookings
      (from_city_id, to_city_id, from_address, to_address, distance_km,
       vehicle_type_id, trip_type, pickup_date, return_date,
       customer_name, customer_phone, customer_email, quoted_fare,
       payment_preference, payment_status, booking_status, booking_reference)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending',$15,$16)
     RETURNING *`,
    [
      isCityBased ? from_city_id : null,
      isCityBased ? to_city_id : null,
      isCityBased ? null : from_address.trim(),
      isCityBased ? null : to_address.trim(),
      quote.distance_km || null,
      vehicle_type_id, trip_type, pickup_date, return_date || null,
      customer_name.trim(), customer_phone.replace(/\s/g, ''), customer_email || null,
      quote.fare, finalPaymentPreference, bookingStatus, bookingReference,
    ]
  );

  const booking = await getBookingById(result.rows[0].id);

  // Fire both notification emails without blocking or failing the
  // booking response — a slow or misconfigured mail server should never
  // make the customer's booking request itself fail.
  if (booking.customer_email) {
    const customerEmail = await notifySafely(bookingReceivedCustomerEmail, booking);
    if (customerEmail) sendEmail({ to: booking.customer_email, ...customerEmail });
  }
  if (ADMIN_NOTIFICATION_EMAIL) {
    const adminEmail = await notifySafely(bookingReceivedAdminEmail, booking);
    if (adminEmail) sendEmail({ to: ADMIN_NOTIFICATION_EMAIL, ...adminEmail });
  }

  return {
    booking,
    fare_breakdown: quote,
    payment_required: finalPaymentPreference === 'pay_now',
  };
}

async function getBookingById(id) {
  const result = await pool.query(
    `SELECT b.*, 
            fc.name AS from_city_name, tc.name AS to_city_name,
            vt.name AS vehicle_type_name
     FROM bookings b
     LEFT JOIN cities fc ON fc.id = b.from_city_id
     LEFT JOIN cities tc ON tc.id = b.to_city_id
     JOIN vehicle_types vt ON vt.id = b.vehicle_type_id
     WHERE b.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Public lookup by the random reference token, not the sequential id —
 * this is what powers the customer-facing tracking page. Deliberately
 * omits raw phone/email from what the caller decides to expose (the
 * controller trims the response), even though the reference itself is
 * already unguessable, as defense in depth.
 */
async function getBookingByReference(reference) {
  const result = await pool.query(
    `SELECT b.*, 
            fc.name AS from_city_name, tc.name AS to_city_name,
            vt.name AS vehicle_type_name,
            d.name AS driver_name, d.phone AS driver_phone, d.vehicle_number AS driver_vehicle_number
     FROM bookings b
     LEFT JOIN cities fc ON fc.id = b.from_city_id
     LEFT JOIN cities tc ON tc.id = b.to_city_id
     JOIN vehicle_types vt ON vt.id = b.vehicle_type_id
     LEFT JOIN drivers d ON d.id = b.assigned_driver_id
     WHERE b.booking_reference = $1`,
    [reference]
  );
  return result.rows[0] || null;
}

async function getAllBookings() {
  const result = await pool.query(
    `SELECT b.*, 
            fc.name AS from_city_name, tc.name AS to_city_name,
            vt.name AS vehicle_type_name
     FROM bookings b
     LEFT JOIN cities fc ON fc.id = b.from_city_id
     LEFT JOIN cities tc ON tc.id = b.to_city_id
     JOIN vehicle_types vt ON vt.id = b.vehicle_type_id
     ORDER BY b.created_at DESC`
  );
  return result.rows;
}

async function confirmBooking(bookingId) {
  const booking = await getBookingById(bookingId);
  if (!booking) { const err = new Error('Booking not found'); err.statusCode = 404; throw err; }
  if (booking.booking_status !== 'pending') {
    const err = new Error(`Only 'pending' bookings can be manually confirmed (currently '${booking.booking_status}')`);
    err.statusCode = 400; throw err;
  }
  const result = await pool.query(`UPDATE bookings SET booking_status = 'confirmed' WHERE id = $1 RETURNING *`, [bookingId]);
  const updated = await getBookingById(bookingId);

  if (updated.customer_email) {
    const email = await notifySafely(bookingConfirmedEmail, updated);
    if (email) sendEmail({ to: updated.customer_email, ...email });
  }

  return result.rows[0];
}

async function cancelBooking(bookingId, reason) {
  const booking = await getBookingById(bookingId);
  if (!booking) { const err = new Error('Booking not found'); err.statusCode = 404; throw err; }
  if (['completed', 'cancelled'].includes(booking.booking_status)) {
    const err = new Error(`Booking is already '${booking.booking_status}' and cannot be cancelled`);
    err.statusCode = 400; throw err;
  }
  const result = await pool.query(
    `UPDATE bookings SET booking_status = 'cancelled', cancellation_reason = $1 WHERE id = $2 RETURNING *`,
    [reason || null, bookingId]
  );
  const updated = await getBookingById(bookingId);

  if (updated.customer_email) {
    const email = await notifySafely(bookingCancelledEmail, updated);
    if (email) sendEmail({ to: updated.customer_email, ...email });
  }

  return result.rows[0];
}

function getTripEndDate(booking) {
  return booking.return_date || booking.pickup_date;
}

async function assignDriverToBooking(bookingId, driverId) {
  const booking = await getBookingById(bookingId);
  if (!booking) { const err = new Error('Booking not found'); err.statusCode = 404; throw err; }
  if (booking.booking_status !== 'confirmed') {
    const err = new Error(`Booking must be 'confirmed' before a driver can be assigned (currently '${booking.booking_status}')`);
    err.statusCode = 400; throw err;
  }

  const driverResult = await pool.query(
    `SELECT d.*, vt.name AS vehicle_type_name FROM drivers d
     LEFT JOIN vehicle_types vt ON vt.id = d.vehicle_type_id
     WHERE d.id = $1 AND d.is_active = true`,
    [driverId]
  );
  if (driverResult.rows.length === 0) { const err = new Error('Driver not found or inactive'); err.statusCode = 404; throw err; }
  const driver = driverResult.rows[0];

  if (driver.vehicle_type_id !== booking.vehicle_type_id) {
    const err = new Error("Driver's vehicle type does not match the booking's requested vehicle type");
    err.statusCode = 400; throw err;
  }

  const tripEndDate = getTripEndDate(booking);
  const conflictResult = await pool.query(
    `SELECT id, pickup_date, return_date FROM bookings
     WHERE assigned_driver_id = $1 AND id != $2 AND booking_status IN ('assigned', 'completed')
       AND pickup_date <= $3 AND COALESCE(return_date, pickup_date) >= $4`,
    [driverId, bookingId, tripEndDate, booking.pickup_date]
  );

  if (conflictResult.rows.length > 0) {
    const conflict = conflictResult.rows[0];
    const err = new Error(
      `Driver is already assigned to booking #${conflict.id} (${conflict.pickup_date} to ${conflict.return_date || conflict.pickup_date}), which overlaps this trip`
    );
    err.statusCode = 409; throw err;
  }

  const result = await pool.query(
    `UPDATE bookings SET assigned_driver_id = $1, booking_status = 'assigned' WHERE id = $2 RETURNING *`,
    [driverId, bookingId]
  );
  const updated = await getBookingById(bookingId);

  if (updated.customer_email) {
    const email = await notifySafely(driverAssignedEmail, updated, driver);
    if (email) sendEmail({ to: updated.customer_email, ...email });
  }

  return result.rows[0];
}

module.exports = {
  validateBookingInput,
  createBooking,
  getBookingById,
  getBookingByReference,
  getAllBookings,
  confirmBooking,
  cancelBooking,
  assignDriverToBooking,
};
