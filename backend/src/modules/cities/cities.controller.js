const pool = require('../../config/db');

async function getAllCities(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM cities WHERE is_active = true ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
}

async function createCity(req, res) {
  const { name, state, latitude, longitude } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'City name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO cities (name, state, latitude, longitude)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, state || null, latitude || null, longitude || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create city' });
  }
}

module.exports = { getAllCities, createCity };
