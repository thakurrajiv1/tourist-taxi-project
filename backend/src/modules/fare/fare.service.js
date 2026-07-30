const pool = require('../../config/db');
const { isMapsEnabled } = require('../../config/maps.config');
const { getDrivingDistanceKm } = require('../maps/maps.service');

/**
 * Calculates the number of days for a round trip based on pickup/return dates.
 * Falls back to 1 day if no return date is given (one_way / local).
 */
function calculateDays(pickupDate, returnDate) {
  if (!returnDate) return 1;
  const start = new Date(pickupDate);
  const end = new Date(returnDate);
  const diffMs = end.getTime() - start.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days > 0 ? days + 1 : 1; // inclusive of start day
}

/**
 * Looks up a cached distance between two cities.
 * In a later step this can call Google Distance Matrix API and cache the result
 * here if no row exists yet.
 */
async function getDistanceKm(fromCityId, toCityId) {
  const result = await pool.query(
    `SELECT distance_km FROM city_distances
     WHERE from_city_id = $1 AND to_city_id = $2`,
    [fromCityId, toCityId]
  );

  if (result.rows.length === 0) {
    throw new Error(
      `No distance found for city pair (${fromCityId} -> ${toCityId}). ` +
      `Add a row to city_distances, or wire up a maps API call here.`
    );
  }

  return parseFloat(result.rows[0].distance_km);
}

/**
 * Shared fare-from-distance math, used by both the city-distance fallback
 * and the custom-location (Mapbox) path — same rate config, same rules,
 * just a different source for the distance number.
 */
function computeFareFromDistance(vehicle, distanceKm, tripType, pickupDate, returnDate) {
  const days = tripType === 'round_trip' ? calculateDays(pickupDate, returnDate) : 1;

  const distanceCost = distanceKm * parseFloat(vehicle.per_km_rate) * (tripType === 'round_trip' ? 2 : 1);
  const baseFare = parseFloat(vehicle.base_fare);
  const driverAllowance = parseFloat(vehicle.driver_allowance_per_day) * days;
  const nightHaltCharge = tripType === 'round_trip' && days > 1
    ? parseFloat(vehicle.night_halt_charge) * (days - 1)
    : 0;

  const totalFare = distanceCost + baseFare + driverAllowance + nightHaltCharge;

  return {
    fare: Math.round(totalFare),
    breakdown: {
      distance_cost: Math.round(distanceCost),
      base_fare: baseFare,
      driver_allowance: driverAllowance,
      night_halt_charge: nightHaltCharge,
      days_counted: days,
    },
  };
}

async function getVehicleOrThrow(vehicleTypeId) {
  const result = await pool.query(
    'SELECT * FROM vehicle_types WHERE id = $1 AND is_active = true',
    [vehicleTypeId]
  );
  if (result.rows.length === 0) {
    throw new Error('Vehicle type not found');
  }
  return result.rows[0];
}

/**
 * Main fare resolution function for city-to-city bookings.
 * 1. Check for an active fixed-price route match.
 * 2. If none, calculate from distance + vehicle rate config.
 */
async function getFare({ from_city_id, to_city_id, vehicle_type_id, trip_type, pickup_date, return_date }) {
  // Step 1: fixed route lookup
  const fixedRouteResult = await pool.query(
    `SELECT * FROM trip_routes
     WHERE from_city_id = $1 AND to_city_id = $2
       AND vehicle_type_id = $3 AND trip_type = $4
       AND is_active = true`,
    [from_city_id, to_city_id, vehicle_type_id, trip_type]
  );

  if (fixedRouteResult.rows.length > 0) {
    const route = fixedRouteResult.rows[0];
    return {
      source: 'fixed_route',
      fare: parseFloat(route.fixed_price),
      distance_km: route.distance_km ? parseFloat(route.distance_km) : null,
      breakdown: { fixed_price: parseFloat(route.fixed_price) },
    };
  }

  // Step 2: calculated fallback
  const vehicle = await getVehicleOrThrow(vehicle_type_id);
  const distanceKm = await getDistanceKm(from_city_id, to_city_id);
  const { fare, breakdown } = computeFareFromDistance(vehicle, distanceKm, trip_type, pickup_date, return_date);

  return { source: 'calculated', fare, distance_km: distanceKm, breakdown };
}

/**
 * Fare resolution for a custom (free-text) pickup/drop location that isn't
 * in the cities table at all. No fixed-route override is possible here —
 * every custom-location quote is calculated fresh via Mapbox.
 *
 * Degrades gracefully when Mapbox isn't configured yet, same "dormant
 * until configured" pattern as Razorpay in Module 4 — callers get a clear
 * mapsDisabled flag on the thrown error rather than a confusing 500.
 */
async function getFareForCustomLocation({ from_address, to_address, vehicle_type_id, trip_type, pickup_date, return_date }) {
  if (!isMapsEnabled) {
    const err = new Error(
      "Custom location pricing isn't available yet — please choose from our city list, " +
      'or contact us on WhatsApp for a manual quote.'
    );
    err.statusCode = 503;
    err.mapsDisabled = true;
    throw err;
  }

  const vehicle = await getVehicleOrThrow(vehicle_type_id);
  const { distance_km, from_resolved, to_resolved } = await getDrivingDistanceKm(from_address, to_address);
  const { fare, breakdown } = computeFareFromDistance(vehicle, distance_km, trip_type, pickup_date, return_date);

  return {
    source: 'custom_location',
    fare,
    distance_km,
    from_resolved,
    to_resolved,
    breakdown,
  };
}

module.exports = { getFare, getFareForCustomLocation, calculateDays, getDistanceKm };
