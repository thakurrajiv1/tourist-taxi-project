const pool = require('../../config/db');

async function getAllTripRoutes(req, res) {
  try {
    const result = await pool.query(`
      SELECT tr.*, 
             fc.name AS from_city_name, 
             tc.name AS to_city_name,
             vt.name AS vehicle_type_name
      FROM trip_routes tr
      JOIN cities fc ON fc.id = tr.from_city_id
      JOIN cities tc ON tc.id = tr.to_city_id
      JOIN vehicle_types vt ON vt.id = tr.vehicle_type_id
      WHERE tr.is_active = true
      ORDER BY tr.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trip routes' });
  }
}

async function createTripRoute(req, res) {
  const {
    from_city_id,
    to_city_id,
    vehicle_type_id,
    trip_type,
    distance_km,
    fixed_price,
    seo_slug,
  } = req.body;

  if (!from_city_id || !to_city_id || !vehicle_type_id || !trip_type || !fixed_price) {
    return res.status(400).json({
      error: 'from_city_id, to_city_id, vehicle_type_id, trip_type and fixed_price are required',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO trip_routes
        (from_city_id, to_city_id, vehicle_type_id, trip_type, distance_km, fixed_price, seo_slug)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (from_city_id, to_city_id, vehicle_type_id, trip_type)
       DO UPDATE SET fixed_price = EXCLUDED.fixed_price, distance_km = EXCLUDED.distance_km
       RETURNING *`,
      [from_city_id, to_city_id, vehicle_type_id, trip_type, distance_km || null, fixed_price, seo_slug || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create trip route' });
  }
}

module.exports = { getAllTripRoutes, createTripRoute };
