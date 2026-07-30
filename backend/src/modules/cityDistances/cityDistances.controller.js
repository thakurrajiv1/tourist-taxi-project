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

/**
 * Upserts a distance for a from/to pair. Only sets that one direction —
 * the admin form asks separately whether to also save the reverse
 * direction, since road distance is normally the same either way but
 * isn't forced to be.
 */
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

module.exports = { getAllDistances, upsertDistance };
