-- Migration 010: booking reference for public tracking
-- A random, unguessable token — unlike the sequential id, this is safe
-- to expose in a public tracking URL without becoming an IDOR
-- vulnerability (see the fix in Module: bookings IDOR closure).

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(32);

-- Backfill any existing rows with a random-ish value so the column can
-- become NOT NULL + UNIQUE. New bookings get a cryptographically random
-- reference generated in application code (crypto.randomBytes) — this
-- backfill is only for rows that predate this migration.
UPDATE bookings
SET booking_reference = substr(md5(random()::text || id::text || clock_timestamp()::text), 1, 12)
WHERE booking_reference IS NULL;

ALTER TABLE bookings
  ALTER COLUMN booking_reference SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
