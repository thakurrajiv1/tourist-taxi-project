-- ============================================================
-- North India Launch Seed Data
-- ============================================================
-- Safe to re-run: every insert checks for existing data first,
-- so this won't create duplicates or clash with cities/vehicle
-- types/routes you already added while testing (e.g. Delhi,
-- Manali, Sedan, the Delhi->Manali fixed route).
--
-- Distances are approximate road distances (km) via standard
-- highway routes — verify/adjust against your actual driver
-- routes before relying on them for pricing.
--
-- Run with:
--   psql -U postgres -d tourist_taxi -f src/db/seeds/north_india_seed.sql
-- ============================================================

-- ----------------------------
-- 1. Cities
-- ----------------------------
INSERT INTO cities (name, state) SELECT 'Delhi', 'Delhi' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Delhi');
INSERT INTO cities (name, state) SELECT 'Agra', 'Uttar Pradesh' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Agra');
INSERT INTO cities (name, state) SELECT 'Jaipur', 'Rajasthan' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Jaipur');
INSERT INTO cities (name, state) SELECT 'Chandigarh', 'Chandigarh' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Chandigarh');
INSERT INTO cities (name, state) SELECT 'Shimla', 'Himachal Pradesh' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Shimla');
INSERT INTO cities (name, state) SELECT 'Manali', 'Himachal Pradesh' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Manali');
INSERT INTO cities (name, state) SELECT 'Dharamshala', 'Himachal Pradesh' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Dharamshala');
INSERT INTO cities (name, state) SELECT 'Amritsar', 'Punjab' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Amritsar');
INSERT INTO cities (name, state) SELECT 'Haridwar', 'Uttarakhand' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Haridwar');
INSERT INTO cities (name, state) SELECT 'Rishikesh', 'Uttarakhand' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Rishikesh');
INSERT INTO cities (name, state) SELECT 'Dehradun', 'Uttarakhand' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Dehradun');
INSERT INTO cities (name, state) SELECT 'Mussoorie', 'Uttarakhand' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Mussoorie');
INSERT INTO cities (name, state) SELECT 'Nainital', 'Uttarakhand' WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Nainital');

-- ----------------------------
-- 2. Vehicle Types
-- ----------------------------
INSERT INTO vehicle_types (name, seater_capacity, per_km_rate, base_fare, driver_allowance_per_day, night_halt_charge)
SELECT 'Sedan', 4, 12, 300, 300, 300
WHERE NOT EXISTS (SELECT 1 FROM vehicle_types WHERE name = 'Sedan');

INSERT INTO vehicle_types (name, seater_capacity, per_km_rate, base_fare, driver_allowance_per_day, night_halt_charge)
SELECT 'SUV', 7, 17, 500, 400, 400
WHERE NOT EXISTS (SELECT 1 FROM vehicle_types WHERE name = 'SUV');

INSERT INTO vehicle_types (name, seater_capacity, per_km_rate, base_fare, driver_allowance_per_day, night_halt_charge)
SELECT 'Tempo Traveller', 12, 22, 800, 500, 500
WHERE NOT EXISTS (SELECT 1 FROM vehicle_types WHERE name = 'Tempo Traveller');

-- ----------------------------
-- 3. City Distances (both directions)
-- ----------------------------
-- Helper pattern: insert (A,B) and (B,A) using name subqueries, upserting
-- on the (from_city_id, to_city_id) unique constraint.

INSERT INTO city_distances (from_city_id, to_city_id, distance_km)
SELECT c1.id, c2.id, d.km FROM (VALUES
  ('Delhi', 'Agra', 230), ('Agra', 'Delhi', 230),
  ('Delhi', 'Jaipur', 280), ('Jaipur', 'Delhi', 280),
  ('Agra', 'Jaipur', 240), ('Jaipur', 'Agra', 240),
  ('Delhi', 'Chandigarh', 250), ('Chandigarh', 'Delhi', 250),
  ('Delhi', 'Shimla', 340), ('Shimla', 'Delhi', 340),
  ('Delhi', 'Manali', 540), ('Manali', 'Delhi', 540),
  ('Delhi', 'Amritsar', 450), ('Amritsar', 'Delhi', 450),
  ('Delhi', 'Dharamshala', 470), ('Dharamshala', 'Delhi', 470),
  ('Delhi', 'Haridwar', 215), ('Haridwar', 'Delhi', 215),
  ('Delhi', 'Rishikesh', 240), ('Rishikesh', 'Delhi', 240),
  ('Delhi', 'Dehradun', 250), ('Dehradun', 'Delhi', 250),
  ('Delhi', 'Mussoorie', 280), ('Mussoorie', 'Delhi', 280),
  ('Delhi', 'Nainital', 300), ('Nainital', 'Delhi', 300),
  ('Chandigarh', 'Shimla', 115), ('Shimla', 'Chandigarh', 115),
  ('Chandigarh', 'Manali', 310), ('Manali', 'Chandigarh', 310),
  ('Chandigarh', 'Amritsar', 230), ('Amritsar', 'Chandigarh', 230),
  ('Chandigarh', 'Dharamshala', 250), ('Dharamshala', 'Chandigarh', 250),
  ('Shimla', 'Manali', 250), ('Manali', 'Shimla', 250),
  ('Shimla', 'Dharamshala', 210), ('Dharamshala', 'Shimla', 210),
  ('Manali', 'Dharamshala', 215), ('Dharamshala', 'Manali', 215),
  ('Amritsar', 'Dharamshala', 200), ('Dharamshala', 'Amritsar', 200),
  ('Haridwar', 'Rishikesh', 25), ('Rishikesh', 'Haridwar', 25),
  ('Haridwar', 'Dehradun', 55), ('Dehradun', 'Haridwar', 55),
  ('Haridwar', 'Mussoorie', 95), ('Mussoorie', 'Haridwar', 95),
  ('Haridwar', 'Nainital', 280), ('Nainital', 'Haridwar', 280),
  ('Rishikesh', 'Dehradun', 45), ('Dehradun', 'Rishikesh', 45),
  ('Dehradun', 'Mussoorie', 35), ('Mussoorie', 'Dehradun', 35),
  ('Rishikesh', 'Nainital', 260), ('Nainital', 'Rishikesh', 260),
  ('Dehradun', 'Nainital', 260), ('Nainital', 'Dehradun', 260),
  -- Cross-region pairs (Himachal <-> Uttarakhand, and Chandigarh as a
  -- second hub) — plausible direct routes tourists actually ask for,
  -- even though they span the regional clusters above.
  ('Rishikesh', 'Manali', 300), ('Manali', 'Rishikesh', 300),
  ('Haridwar', 'Manali', 310), ('Manali', 'Haridwar', 310),
  ('Dehradun', 'Manali', 300), ('Manali', 'Dehradun', 300),
  ('Dehradun', 'Shimla', 260), ('Shimla', 'Dehradun', 260),
  ('Haridwar', 'Shimla', 270), ('Shimla', 'Haridwar', 270),
  ('Rishikesh', 'Shimla', 260), ('Shimla', 'Rishikesh', 260),
  ('Chandigarh', 'Haridwar', 200), ('Haridwar', 'Chandigarh', 200),
  ('Chandigarh', 'Rishikesh', 230), ('Rishikesh', 'Chandigarh', 230),
  ('Chandigarh', 'Dehradun', 215), ('Dehradun', 'Chandigarh', 215),
  ('Chandigarh', 'Nainital', 350), ('Nainital', 'Chandigarh', 350)
) AS d(from_name, to_name, km)
JOIN cities c1 ON c1.name = d.from_name
JOIN cities c2 ON c2.name = d.to_name
ON CONFLICT (from_city_id, to_city_id)
DO UPDATE SET distance_km = EXCLUDED.distance_km;

-- ----------------------------
-- 4. Fixed Routes (popular routes get fixed pricing; everything
--    else falls back to the calculated fare using the distances above)
-- ----------------------------

INSERT INTO trip_routes (from_city_id, to_city_id, vehicle_type_id, trip_type, distance_km, fixed_price, seo_slug)
SELECT c1.id, c2.id, v.id, r.trip_type, r.distance_km, r.fixed_price, r.seo_slug
FROM (VALUES
  ('Delhi', 'Agra', 'Sedan', 'one_way', 230, 3500, 'delhi-to-agra-taxi'),
  ('Delhi', 'Agra', 'SUV', 'one_way', 230, 4800, 'delhi-to-agra-suv-taxi'),
  ('Delhi', 'Jaipur', 'Sedan', 'one_way', 280, 4200, 'delhi-to-jaipur-taxi'),
  ('Agra', 'Jaipur', 'Sedan', 'one_way', 240, 3800, 'agra-to-jaipur-taxi'),
  ('Delhi', 'Manali', 'Sedan', 'one_way', 540, 7500, 'delhi-to-manali-taxi'),
  ('Delhi', 'Manali', 'SUV', 'one_way', 540, 10500, 'delhi-to-manali-suv-taxi'),
  ('Delhi', 'Shimla', 'Sedan', 'one_way', 340, 5200, 'delhi-to-shimla-taxi'),
  ('Chandigarh', 'Manali', 'Sedan', 'one_way', 310, 4800, 'chandigarh-to-manali-taxi'),
  ('Chandigarh', 'Shimla', 'Sedan', 'one_way', 115, 2200, 'chandigarh-to-shimla-taxi'),
  ('Delhi', 'Amritsar', 'Sedan', 'one_way', 450, 6500, 'delhi-to-amritsar-taxi'),
  ('Delhi', 'Haridwar', 'Sedan', 'one_way', 215, 3400, 'delhi-to-haridwar-taxi'),
  ('Delhi', 'Rishikesh', 'Sedan', 'one_way', 240, 3700, 'delhi-to-rishikesh-taxi'),
  ('Delhi', 'Nainital', 'Sedan', 'one_way', 300, 4600, 'delhi-to-nainital-taxi'),
  ('Delhi', 'Dharamshala', 'Sedan', 'one_way', 470, 7000, 'delhi-to-dharamshala-taxi')
) AS r(from_name, to_name, vehicle_name, trip_type, distance_km, fixed_price, seo_slug)
JOIN cities c1 ON c1.name = r.from_name
JOIN cities c2 ON c2.name = r.to_name
JOIN vehicle_types v ON v.name = r.vehicle_name
ON CONFLICT (from_city_id, to_city_id, vehicle_type_id, trip_type)
DO UPDATE SET fixed_price = EXCLUDED.fixed_price, distance_km = EXCLUDED.distance_km;

-- ----------------------------
-- 5. Tour Packages (with day-by-day itinerary)
-- ----------------------------

DO $$
DECLARE
  pkg_id INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tour_packages WHERE slug = 'golden-triangle-tour') THEN
    INSERT INTO tour_packages (title, slug, description, duration_days, price, inclusions, exclusions)
    VALUES (
      'Golden Triangle Tour',
      'golden-triangle-tour',
      'Delhi, Agra & Jaipur — India''s most iconic circuit, covering the Taj Mahal, Amber Fort, and the sights of the capital.',
      4,
      16000,
      ARRAY['AC Sedan with driver', 'Fuel & toll charges', 'Driver allowance'],
      ARRAY['Hotel accommodation', 'Entry tickets & guide fees', 'Meals']
    )
    RETURNING id INTO pkg_id;

    INSERT INTO tour_package_itinerary (package_id, day_number, title, description) VALUES
      (pkg_id, 1, 'Delhi Arrival & Local Sightseeing', 'Pickup from Delhi airport/hotel. Visit India Gate, Qutub Minar, and Humayun''s Tomb. Overnight in Delhi.'),
      (pkg_id, 2, 'Delhi to Agra', 'Drive to Agra (approx. 230 km, 4 hrs). Visit the Taj Mahal and Agra Fort. Overnight in Agra.'),
      (pkg_id, 3, 'Agra to Jaipur', 'Drive to Jaipur (approx. 240 km, 5 hrs) via Fatehpur Sikri. Evening at leisure in the Pink City.'),
      (pkg_id, 4, 'Jaipur Sightseeing & Return to Delhi', 'Visit Amber Fort, Hawa Mahal, and City Palace, then drive back to Delhi (approx. 280 km, 5 hrs), drop-off in the evening.');
  END IF;
END $$;

DO $$
DECLARE
  pkg_id INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tour_packages WHERE slug = 'shimla-manali-himachal-trail') THEN
    INSERT INTO tour_packages (title, slug, description, duration_days, price, inclusions, exclusions)
    VALUES (
      'Shimla Manali Himachal Trail',
      'shimla-manali-himachal-trail',
      'A scenic Himachal getaway through pine forests, valleys, and hill stations.',
      5,
      19500,
      ARRAY['AC vehicle with driver', 'Fuel & toll charges', 'Driver allowance & night halt'],
      ARRAY['Hotel stay', 'Meals', 'Entry tickets']
    )
    RETURNING id INTO pkg_id;

    INSERT INTO tour_package_itinerary (package_id, day_number, title, description) VALUES
      (pkg_id, 1, 'Delhi to Shimla', 'Drive to Shimla (approx. 340 km, 8-9 hrs). Evening walk on the Mall Road.'),
      (pkg_id, 2, 'Shimla Local Sightseeing', 'Visit Jakhu Temple, Kufri, and the Ridge.'),
      (pkg_id, 3, 'Shimla to Manali', 'Drive to Manali (approx. 250 km, 8 hrs) via scenic mountain roads.'),
      (pkg_id, 4, 'Manali Local Sightseeing', 'Visit Solang Valley, Hadimba Temple, and Old Manali.'),
      (pkg_id, 5, 'Manali to Delhi', 'Return drive to Delhi (approx. 540 km) — early morning start, drop-off in the late evening.');
  END IF;
END $$;

DO $$
DECLARE
  pkg_id INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tour_packages WHERE slug = 'haridwar-rishikesh-spiritual-getaway') THEN
    INSERT INTO tour_packages (title, slug, description, duration_days, price, inclusions, exclusions)
    VALUES (
      'Haridwar Rishikesh Spiritual Getaway',
      'haridwar-rishikesh-spiritual-getaway',
      'A short, peaceful trip to the spiritual towns on the banks of the Ganges.',
      3,
      9500,
      ARRAY['AC vehicle with driver', 'Fuel & toll charges'],
      ARRAY['Hotel stay', 'Meals', 'Aarti offerings/donations']
    )
    RETURNING id INTO pkg_id;

    INSERT INTO tour_package_itinerary (package_id, day_number, title, description) VALUES
      (pkg_id, 1, 'Delhi to Haridwar', 'Drive to Haridwar (approx. 215 km, 5 hrs). Evening Ganga Aarti at Har Ki Pauri.'),
      (pkg_id, 2, 'Rishikesh Sightseeing', 'Visit Lakshman Jhula, Ram Jhula, and the riverside cafes in Rishikesh.'),
      (pkg_id, 3, 'Return to Delhi', 'Morning at leisure, then drive back to Delhi (approx. 240 km).');
  END IF;
END $$;

DO $$
DECLARE
  pkg_id INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tour_packages WHERE slug = 'amritsar-dharamshala-heritage-tour') THEN
    INSERT INTO tour_packages (title, slug, description, duration_days, price, inclusions, exclusions)
    VALUES (
      'Amritsar Dharamshala Heritage Tour',
      'amritsar-dharamshala-heritage-tour',
      'From the Golden Temple to the hill town of Dharamshala.',
      4,
      14500,
      ARRAY['AC vehicle with driver', 'Fuel & toll charges', 'Driver allowance & night halt'],
      ARRAY['Hotel stay', 'Meals', 'Entry tickets']
    )
    RETURNING id INTO pkg_id;

    INSERT INTO tour_package_itinerary (package_id, day_number, title, description) VALUES
      (pkg_id, 1, 'Delhi to Amritsar', 'Drive to Amritsar (approx. 450 km, 8 hrs). Evening visit to the Golden Temple and the Wagah Border ceremony.'),
      (pkg_id, 2, 'Amritsar to Dharamshala', 'Drive to Dharamshala (approx. 200 km, 5 hrs) via Pathankot.'),
      (pkg_id, 3, 'Dharamshala Sightseeing', 'Visit McLeod Ganj and Bhagsu Waterfall.'),
      (pkg_id, 4, 'Return to Delhi', 'Long drive back to Delhi (approx. 470 km) — an early start is recommended.');
  END IF;
END $$;
