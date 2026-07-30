const pool = require('../../config/db');

async function getAllDrivers(req, res) {
  const { vehicle_type_id, is_active } = req.query;

  const conditions = [];
  const values = [];

  if (vehicle_type_id) {
    values.push(vehicle_type_id);
    conditions.push(`vehicle_type_id = $${values.length}`);
  }
  if (is_active !== undefined) {
    values.push(is_active === 'true');
    conditions.push(`is_active = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT d.*, vt.name AS vehicle_type_name
       FROM drivers d
       LEFT JOIN vehicle_types vt ON vt.id = d.vehicle_type_id
       ${whereClause}
       ORDER BY d.name ASC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
}

async function createDriver(req, res) {
  const { name, phone, vehicle_number, vehicle_type_id } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO drivers (name, phone, vehicle_number, vehicle_type_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), phone.trim(), vehicle_number || null, vehicle_type_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create driver' });
  }
}

module.exports = { getAllDrivers, createDriver };
