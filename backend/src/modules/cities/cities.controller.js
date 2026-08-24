const pool = require('../../config/db');

async function getAllCities(req, res) {
  try {
    const result = await pool.query('SELECT * FROM cities WHERE is_active = true ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
}

// Admin-only — includes deactivated cities too, so the admin panel can
// show and reactivate them, not just create new ones.
async function getAllCitiesAdmin(req, res) {
  try {
    const result = await pool.query('SELECT * FROM cities ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
}

async function createCity(req, res) {
  const { name, state, latitude, longitude } = req.body;
  if (!name) return res.status(400).json({ error: 'City name is required' });
  try {
    const result = await pool.query(
      `INSERT INTO cities (name, state, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, state || null, latitude || null, longitude || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create city' });
  }
}

async function updateCity(req, res) {
  const { name, state, latitude, longitude, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE cities SET
         name = COALESCE($1, name),
         state = COALESCE($2, state),
         latitude = COALESCE($3, latitude),
         longitude = COALESCE($4, longitude),
         is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [name ?? null, state ?? null, latitude ?? null, longitude ?? null, is_active ?? null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'City not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update city' });
  }
}

// Soft delete — cities are referenced by bookings, trip_routes, and
// city_distances, so an actual DELETE would either fail on the foreign
// key or silently orphan history. Deactivating hides it from customer-
// facing search while preserving every past booking's integrity.
async function deactivateCity(req, res) {
  try {
    const result = await pool.query(
      `UPDATE cities SET is_active = false WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'City not found' });
    res.json({ message: 'City deactivated', city: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate city' });
  }
}

module.exports = { getAllCities, getAllCitiesAdmin, createCity, updateCity, deactivateCity };
