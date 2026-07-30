-- Migration 004: driver assignment integrity + indexes

-- Ensure assigned_driver_id can't point at a driver that doesn't exist.
-- Existing NULL values are unaffected.
ALTER TABLE bookings
  ADD CONSTRAINT fk_assigned_driver
  FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id);

-- Speeds up the overlap-conflict check run on every driver assignment.
CREATE INDEX IF NOT EXISTS idx_bookings_driver_dates
  ON bookings (assigned_driver_id, pickup_date, return_date)
  WHERE assigned_driver_id IS NOT NULL;
