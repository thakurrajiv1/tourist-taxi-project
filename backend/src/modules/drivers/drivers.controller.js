const pool = require('../../config/db');

async function getAllDrivers(req, res) {
  const { vehicle_type_id, is_active } = req.query;
  const conditions = [];
  const values = [];
  if (vehicle_type_id) { values.push(vehicle_type_id); conditions.push(`vehicle_type_id = $${values.length}`); }
  if (is_active !== undefined) { values.push(is_active === 'true'); conditions.push(`is_active = $${values.length}`); }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const result = await pool.query(
      `SELECT d.*, vt.name AS vehicle_type_name FROM drivers d
       LEFT JOIN vehicle_types vt ON vt.id = d.vehicle_type_id
       ${whereClause} ORDER BY d.name ASC`,
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
  if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });
  try {
    const result = await pool.query(
      `INSERT INTO drivers (name, phone, vehicle_number, vehicle_type_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), phone.trim(), vehicle_number || null, vehicle_type_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create driver' });
  }
}

async function updateDriver(req, res) {
  const { name, phone, vehicle_number, vehicle_type_id, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE drivers SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         vehicle_number = COALESCE($3, vehicle_number),
         vehicle_type_id = COALESCE($4, vehicle_type_id),
         is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [name ?? null, phone ?? null, vehicle_number ?? null, vehicle_type_id ?? null, is_active ?? null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update driver' });
  }
}

// Soft delete — a driver may be linked to past (and future confirmed)
// bookings via assigned_driver_id. Deactivating removes them from the
// assignment dropdown without breaking any booking history.
async function deactivateDriver(req, res) {
  try {
    const result = await pool.query(
      `UPDATE drivers SET is_active = false WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json({ message: 'Driver deactivated', driver: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate driver' });
  }
}

module.exports = { getAllDrivers, createDriver, updateDriver, deactivateDriver };
