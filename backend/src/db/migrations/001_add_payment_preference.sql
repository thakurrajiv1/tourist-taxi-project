-- Migration 001: add payment_preference to bookings
-- Run this against your existing database (schema.sql already includes this
-- column if you're setting up fresh, so only run this if your bookings table
-- was created before this migration existed).

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_preference VARCHAR(20) NOT NULL DEFAULT 'pay_later'
  CHECK (payment_preference IN ('pay_now', 'pay_later'));

-- payment_status values now used: pending, initiated, paid, failed, refunded
-- booking_status values now used: pending, awaiting_payment, confirmed, assigned, completed, cancelled
