-- Migration 006: tour packages (multi-day itineraries)

CREATE TABLE IF NOT EXISTS tour_packages (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  duration_days INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cover_image_url TEXT,
  inclusions TEXT[],
  exclusions TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tour_package_itinerary (
  id SERIAL PRIMARY KEY,
  package_id INT NOT NULL REFERENCES tour_packages(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  title VARCHAR(150),
  description TEXT,
  UNIQUE(package_id, day_number)
);
