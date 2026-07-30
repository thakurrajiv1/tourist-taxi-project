-- ============================================
-- Tourist Taxi Booking Platform — Core Schema
-- Module 1: Cities, Vehicle Types, Routes, Fare
-- ============================================

CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicle_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,              -- Sedan, SUV, Tempo Traveller, etc.
  seater_capacity INT,
  per_km_rate DECIMAL(10,2) NOT NULL,
  base_fare DECIMAL(10,2) DEFAULT 0,
  driver_allowance_per_day DECIMAL(10,2) DEFAULT 0,
  night_halt_charge DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Fixed-price popular routes (override the calculated fare)
CREATE TABLE IF NOT EXISTS trip_routes (
  id SERIAL PRIMARY KEY,
  from_city_id INT NOT NULL REFERENCES cities(id),
  to_city_id INT NOT NULL REFERENCES cities(id),
  vehicle_type_id INT NOT NULL REFERENCES vehicle_types(id),
  trip_type VARCHAR(20) NOT NULL CHECK (trip_type IN ('one_way','round_trip','local')),
  distance_km DECIMAL(10,2),
  fixed_price DECIMAL(10,2) NOT NULL,
  seo_slug VARCHAR(150) UNIQUE,            -- e.g. delhi-to-manali-taxi
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(from_city_id, to_city_id, vehicle_type_id, trip_type)
);

-- Cached distances so we don't hit a maps API on every quote request
CREATE TABLE IF NOT EXISTS city_distances (
  id SERIAL PRIMARY KEY,
  from_city_id INT NOT NULL REFERENCES cities(id),
  to_city_id INT NOT NULL REFERENCES cities(id),
  distance_km DECIMAL(10,2) NOT NULL,
  duration_minutes INT,
  UNIQUE(from_city_id, to_city_id)
);

-- Placeholder for Module 2
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  from_city_id INT REFERENCES cities(id),
  to_city_id INT REFERENCES cities(id),
  vehicle_type_id INT REFERENCES vehicle_types(id),
  trip_type VARCHAR(20) NOT NULL,
  pickup_date DATE NOT NULL,
  return_date DATE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100),
  quoted_fare DECIMAL(10,2),
  advance_paid DECIMAL(10,2) DEFAULT 0,
  payment_preference VARCHAR(20) NOT NULL DEFAULT 'pay_later' CHECK (payment_preference IN ('pay_now','pay_later')),
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, initiated, paid, failed, refunded
  booking_status VARCHAR(20) DEFAULT 'pending', -- pending, awaiting_payment, confirmed, assigned, completed, cancelled
  assigned_driver_id INT,
  created_at TIMESTAMP DEFAULT now()
);

-- Placeholder for Module 5
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  vehicle_number VARCHAR(20),
  vehicle_type_id INT REFERENCES vehicle_types(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Helpful index for fare lookups
CREATE INDEX IF NOT EXISTS idx_trip_routes_lookup
  ON trip_routes (from_city_id, to_city_id, vehicle_type_id, trip_type);

CREATE INDEX IF NOT EXISTS idx_city_distances_lookup
  ON city_distances (from_city_id, to_city_id);
