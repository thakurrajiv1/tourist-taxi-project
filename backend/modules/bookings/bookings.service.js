const pool = require('../../config/db');
const { getFare } = require('../fare/fare.service');

const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/; // Indian mobile numbers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateBookingInput(input) {
  const errors = [];
  const {
    from_city_id, to_city_id, vehicle_type_id, trip_type,
    pickup_date, return_date, customer_name, customer_phone,
    customer_email, payment_preference,
  } = input;

  if (!from_city_id) errors.push('from_city_id is required');
  if (!to_city_id) errors.push('to_city_id is required');
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
    from_city_id, to_city_id, vehicle_type_id, trip_type,
    pickup_date, return_date, customer_name, customer_phone,
    customer_email, payment_preference,
  } = input;

  // Always recompute the fare server-side — never trust a client-submitted price.
  const quote = await getFare({
    from_city_id, to_city_id, vehicle_type_id, trip_type, pickup_date, return_date,
  });

  const finalPaymentPreference = payment_preference || 'pay_later';
  const bookingStatus = finalPaymentPreference === 'pay_now' ? 'awaiting_payment' : 'pending';

  const result = await pool.query(
    `INSERT INTO bookings
      (from_city_id, to_city_id, vehicle_type_id, trip_type, pickup_date, return_date,
       customer_name, customer_phone, customer_email, quoted_fare,
       payment_preference, payment_status, booking_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12)
     RETURNING *`,
    [
      from_city_id, to_city_id, vehicle_type_id, trip_type, pickup_date, return_date || null,
      customer_name.trim(), customer_phone.replace(/\s/g, ''), customer_email || null,
      quote.fare, finalPaymentPreference, bookingStatus,
    ]
  );

  const booking = result.rows[0];

  return {
    booking,
    fare_breakdown: quote,
    // Module 4 will replace this with a real Razorpay order when payment_preference is pay_now
    payment_required: finalPaymentPreference === 'pay_now',
    payment_integration_pending: finalPaymentPreference === 'pay_now',
  };
}

async function getBookingById(id) {
  const result = await pool.query(
    `SELECT b.*, 
            fc.name AS from_city_name, tc.name AS to_city_name,
            vt.name AS vehicle_type_name
     FROM bookings b
     JOIN cities fc ON fc.id = b.from_city_id
     JOIN cities tc ON tc.id = b.to_city_id
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
     JOIN cities fc ON fc.id = b.from_city_id
     JOIN cities tc ON tc.id = b.to_city_id
     JOIN vehicle_types vt ON vt.id = b.vehicle_type_id
     ORDER BY b.created_at DESC`
  );
  return result.rows;
}

module.exports = { validateBookingInput, createBooking, getBookingById, getAllBookings };
