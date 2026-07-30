-- Migration 007: custom location support
-- A booking is now either city-based (from_city_id + to_city_id) OR
-- address-based (from_address + to_address) — exactly one of the two.

ALTER TABLE bookings
  ALTER COLUMN from_city_id DROP NOT NULL,
  ALTER COLUMN to_city_id DROP NOT NULL;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS from_address TEXT,
  ADD COLUMN IF NOT EXISTS to_address TEXT,
  ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2);

ALTER TABLE bookings
  ADD CONSTRAINT chk_booking_location CHECK (
    (from_city_id IS NOT NULL AND to_city_id IS NOT NULL)
    OR (from_address IS NOT NULL AND to_address IS NOT NULL)
  );
