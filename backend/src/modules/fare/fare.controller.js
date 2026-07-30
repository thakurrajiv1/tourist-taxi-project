const { getFare, getFareForCustomLocation } = require('./fare.service');

async function getFareQuote(req, res) {
  const { from_city_id, to_city_id, vehicle_type_id, trip_type, pickup_date, return_date } = req.body;

  if (!from_city_id || !to_city_id || !vehicle_type_id || !trip_type || !pickup_date) {
    return res.status(400).json({
      error: 'from_city_id, to_city_id, vehicle_type_id, trip_type and pickup_date are required',
    });
  }

  if (!['one_way', 'round_trip', 'local'].includes(trip_type)) {
    return res.status(400).json({ error: 'trip_type must be one_way, round_trip, or local' });
  }

  try {
    const quote = await getFare({
      from_city_id,
      to_city_id,
      vehicle_type_id,
      trip_type,
      pickup_date,
      return_date,
    });
    res.json(quote);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

async function getCustomFareQuote(req, res) {
  const { from_address, to_address, vehicle_type_id, trip_type, pickup_date, return_date } = req.body;

  if (!from_address || !to_address || !vehicle_type_id || !trip_type || !pickup_date) {
    return res.status(400).json({
      error: 'from_address, to_address, vehicle_type_id, trip_type and pickup_date are required',
    });
  }

  if (!['one_way', 'round_trip', 'local'].includes(trip_type)) {
    return res.status(400).json({ error: 'trip_type must be one_way, round_trip, or local' });
  }

  try {
    const quote = await getFareForCustomLocation({
      from_address,
      to_address,
      vehicle_type_id,
      trip_type,
      pickup_date,
      return_date,
    });
    res.json(quote);
  } catch (err) {
    console.error(err);
    if (err.mapsDisabled) {
      // Graceful, not an error state the frontend needs to alarm about —
      // same shape as the payments "not live yet" response in Module 4.
      return res.status(200).json({
        maps_enabled: false,
        message: err.message,
      });
    }
    res.status(err.statusCode || 400).json({ error: err.message });
  }
}

module.exports = { getFareQuote, getCustomFareQuote };
