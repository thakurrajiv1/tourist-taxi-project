-- Migration 009: booking cancellation support

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
