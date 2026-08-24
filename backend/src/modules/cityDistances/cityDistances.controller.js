const pool = require('../../config/db');

async function getAllDistances(req, res) {
  try {
    const result = await pool.query(
      `SELECT cd.*, c1.name AS from_city_name, c2.name AS to_city_name
       FROM city_distances cd
       JOIN cities c1 ON c1.id = cd.from_city_id
       JOIN cities c2 ON c2.id = cd.to_city_id
       ORDER BY c1.name ASC, c2.name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch city distances' });
  }
}

async function upsertDistance(req, res) {
  const { from_city_id, to_city_id, distance_km, duration_minutes, also_reverse } = req.body;
  if (!from_city_id || !to_city_id || !distance_km) {
    return res.status(400).json({ error: 'from_city_id, to_city_id, and distance_km are required' });
  }
  if (from_city_id === to_city_id) {
    return res.status(400).json({ error: 'from_city_id and to_city_id cannot be the same' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO city_distances (from_city_id, to_city_id, distance_km, duration_minutes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (from_city_id, to_city_id)
       DO UPDATE SET distance_km = EXCLUDED.distance_km, duration_minutes = EXCLUDED.duration_minutes
       RETURNING *`,
      [from_city_id, to_city_id, distance_km, duration_minutes || null]
    );
    if (also_reverse) {
      await pool.query(
        `INSERT INTO city_distances (from_city_id, to_city_id, distance_km, duration_minutes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (from_city_id, to_city_id)
         DO UPDATE SET distance_km = EXCLUDED.distance_km, duration_minutes = EXCLUDED.duration_minutes`,
        [to_city_id, from_city_id, distance_km, duration_minutes || null]
      );
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save city distance' });
  }
}

// Hard delete is safe here — no other table references city_distances
// rows, so removing one can never orphan a booking or route.
async function deleteDistance(req, res) {
  try {
    const result = await pool.query(`DELETE FROM city_distances WHERE id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Distance not found' });
    res.json({ message: 'Distance deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete distance' });
  }
}

module.exports = { getAllDistances, upsertDistance, deleteDistance };
