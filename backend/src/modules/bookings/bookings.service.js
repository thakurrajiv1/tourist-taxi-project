const pool = require('../../config/db');
const { getFare, getFareForCustomLocation } = require('../fare/fare.service');

const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/; // Indian mobile numbers
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

async function createBooking(input) {
  const {
    from_city_id, to_city_id, from_address, to_address, vehicle_type_id, trip_type,
    pickup_date, return_date, customer_name, customer_phone,
    customer_email, payment_preference,
  } = input;

  const isCityBased = Boolean(from_city_id && to_city_id);

  // Always recompute the fare server-side — never trust a client-submitted price.
  const quote = isCityBased
    ? await getFare({ from_city_id, to_city_id, vehicle_type_id, trip_type, pickup_date, return_date })
    : await getFareForCustomLocation({ from_address, to_address, vehicle_type_id, trip_type, pickup_date, return_date });

  // A custom-location quote can come back in the "maps not configured yet"
  // graceful state (no fare) rather than throwing — a booking can't be
  // priced from that, so surface it clearly instead of saving a bad row.
  if (quote.maps_enabled === false) {
    const err = new Error(quote.message);
    err.statusCode = 503;
    throw err;
  }

  const finalPaymentPreference = payment_preference || 'pay_later';
  const bookingStatus = finalPaymentPreference === 'pay_now' ? 'awaiting_payment' : 'pending';

  const result = await pool.query(
    `INSERT INTO bookings
      (from_city_id, to_city_id, from_address, to_address, distance_km,
       vehicle_type_id, trip_type, pickup_date, return_date,
       customer_name, customer_phone, customer_email, quoted_fare,
       payment_preference, payment_status, booking_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending',$15)
     RETURNING *`,
    [
      isCityBased ? from_city_id : null,
      isCityBased ? to_city_id : null,
      isCityBased ? null : from_address.trim(),
      isCityBased ? null : to_address.trim(),
      quote.distance_km || null,
      vehicle_type_id, trip_type, pickup_date, return_date || null,
      customer_name.trim(), customer_phone.replace(/\s/g, ''), customer_email || null,
      quote.fare, finalPaymentPreference, bookingStatus,
    ]
  );

  const booking = result.rows[0];

  return {
    booking,
    fare_breakdown: quote,
    // Frontend should call POST /api/payments/create-order/:bookingId next
    // when this is true (Module 4). That endpoint itself degrades
    // gracefully if Razorpay isn't configured yet.
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

/**
 * Manually confirms a pending (pay_later) booking — the ops-team equivalent
 * of what Module 4's webhook does automatically for pay_now bookings once
 * payment is captured.
 */
async function confirmBooking(bookingId) {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  if (booking.booking_status !== 'pending') {
    const err = new Error(
      `Only 'pending' bookings can be manually confirmed (currently '${booking.booking_status}')`
    );
    err.statusCode = 400;
    throw err;
  }

  const result = await pool.query(
    `UPDATE bookings SET booking_status = 'confirmed' WHERE id = $1 RETURNING *`,
    [bookingId]
  );
  return result.rows[0];
}

/**
 * A booking "occupies" a driver from pickup_date through return_date.
 * For one_way and local trips there's no return_date, so the driver is
 * only considered occupied on the pickup day itself.
 */
function getTripEndDate(booking) {
  return booking.return_date || booking.pickup_date;
}

/**
 * Assigns a driver to a confirmed booking.
 * Guardrails:
 *  - booking must exist and be in 'confirmed' status (not yet paid/pending
 *    bookings shouldn't tie up a driver)
 *  - driver must exist, be active, and match the booking's vehicle type
 *  - driver must not already be assigned to another trip whose dates overlap
 */
async function assignDriverToBooking(bookingId, driverId) {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  if (booking.booking_status !== 'confirmed') {
    const err = new Error(
      `Booking must be 'confirmed' before a driver can be assigned (currently '${booking.booking_status}')`
    );
    err.statusCode = 400;
    throw err;
  }

  const driverResult = await pool.query(
    'SELECT * FROM drivers WHERE id = $1 AND is_active = true',
    [driverId]
  );
  if (driverResult.rows.length === 0) {
    const err = new Error('Driver not found or inactive');
    err.statusCode = 404;
    throw err;
  }
  const driver = driverResult.rows[0];

  if (driver.vehicle_type_id !== booking.vehicle_type_id) {
    const err = new Error(
      "Driver's vehicle type does not match the booking's requested vehicle type"
    );
    err.statusCode = 400;
    throw err;
  }

  const tripEndDate = getTripEndDate(booking);

  // Overlap check: any other trip already assigned to this driver where
  // existing.start <= new.end AND existing.end >= new.start
  const conflictResult = await pool.query(
    `SELECT id, pickup_date, return_date FROM bookings
     WHERE assigned_driver_id = $1
       AND id != $2
       AND booking_status IN ('assigned', 'completed')
       AND pickup_date <= $3
       AND COALESCE(return_date, pickup_date) >= $4`,
    [driverId, bookingId, tripEndDate, booking.pickup_date]
  );

  if (conflictResult.rows.length > 0) {
    const conflict = conflictResult.rows[0];
    const err = new Error(
      `Driver is already assigned to booking #${conflict.id} ` +
        `(${conflict.pickup_date} to ${conflict.return_date || conflict.pickup_date}), which overlaps this trip`
    );
    err.statusCode = 409;
    throw err;
  }

  const result = await pool.query(
    `UPDATE bookings
     SET assigned_driver_id = $1, booking_status = 'assigned'
     WHERE id = $2
     RETURNING *`,
    [driverId, bookingId]
  );

  return result.rows[0];
}

module.exports = {
  validateBookingInput,
  createBooking,
  getBookingById,
  getAllBookings,
  confirmBooking,
  assignDriverToBooking,
};
