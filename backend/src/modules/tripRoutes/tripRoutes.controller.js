const pool = require('../../config/db');

const SELECT_WITH_JOINS = `
  SELECT tr.*, fc.name AS from_city_name, tc.name AS to_city_name, vt.name AS vehicle_type_name
  FROM trip_routes tr
  JOIN cities fc ON fc.id = tr.from_city_id
  JOIN cities tc ON tc.id = tr.to_city_id
  JOIN vehicle_types vt ON vt.id = tr.vehicle_type_id
`;

async function getAllTripRoutes(req, res) {
  try {
    const result = await pool.query(`${SELECT_WITH_JOINS} WHERE tr.is_active = true ORDER BY tr.created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trip routes' });
  }
}

async function getAllTripRoutesAdmin(req, res) {
  try {
    const result = await pool.query(`${SELECT_WITH_JOINS} ORDER BY tr.created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trip routes' });
  }
}

async function createTripRoute(req, res) {
  const { from_city_id, to_city_id, vehicle_type_id, trip_type, distance_km, fixed_price, seo_slug } = req.body;
  if (!from_city_id || !to_city_id || !vehicle_type_id || !trip_type || !fixed_price) {
    return res.status(400).json({ error: 'from_city_id, to_city_id, vehicle_type_id, trip_type and fixed_price are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO trip_routes (from_city_id, to_city_id, vehicle_type_id, trip_type, distance_km, fixed_price, seo_slug)
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

async function updateTripRoute(req, res) {
  const { distance_km, fixed_price, seo_slug, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE trip_routes SET
         distance_km = COALESCE($1, distance_km),
         fixed_price = COALESCE($2, fixed_price),
         seo_slug = COALESCE($3, seo_slug),
         is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [distance_km ?? null, fixed_price ?? null, seo_slug ?? null, is_active ?? null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trip route not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update trip route' });
  }
}

async function deactivateTripRoute(req, res) {
  try {
    const result = await pool.query(
      `UPDATE trip_routes SET is_active = false WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trip route not found' });
    res.json({ message: 'Trip route deactivated', trip_route: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate trip route' });
  }
}

module.exports = { getAllTripRoutes, getAllTripRoutesAdmin, createTripRoute, updateTripRoute, deactivateTripRoute };
