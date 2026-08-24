const pool = require('../../config/db');

async function getAllVehicleTypes(req, res) {
  try {
    const result = await pool.query('SELECT * FROM vehicle_types WHERE is_active = true ORDER BY per_km_rate ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicle types' });
  }
}

async function getAllVehicleTypesAdmin(req, res) {
  try {
    const result = await pool.query('SELECT * FROM vehicle_types ORDER BY per_km_rate ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicle types' });
  }
}

async function createVehicleType(req, res) {
  const { name, seater_capacity, per_km_rate, base_fare, driver_allowance_per_day, night_halt_charge, image_url } = req.body;
  if (!name || per_km_rate === undefined) {
    return res.status(400).json({ error: 'name and per_km_rate are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO vehicle_types (name, seater_capacity, per_km_rate, base_fare, driver_allowance_per_day, night_halt_charge, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, seater_capacity || null, per_km_rate, base_fare || 0, driver_allowance_per_day || 0, night_halt_charge || 0, image_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vehicle type' });
  }
}

async function updateVehicleType(req, res) {
  const { name, seater_capacity, per_km_rate, base_fare, driver_allowance_per_day, night_halt_charge, image_url, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vehicle_types SET
         name = COALESCE($1, name),
         seater_capacity = COALESCE($2, seater_capacity),
         per_km_rate = COALESCE($3, per_km_rate),
         base_fare = COALESCE($4, base_fare),
         driver_allowance_per_day = COALESCE($5, driver_allowance_per_day),
         night_halt_charge = COALESCE($6, night_halt_charge),
         image_url = COALESCE($7, image_url),
         is_active = COALESCE($8, is_active)
       WHERE id = $9
       RETURNING *`,
      [name ?? null, seater_capacity ?? null, per_km_rate ?? null, base_fare ?? null,
       driver_allowance_per_day ?? null, night_halt_charge ?? null, image_url ?? null, is_active ?? null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle type not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update vehicle type' });
  }
}

// Soft delete — vehicle types are referenced by bookings, trip_routes,
// and drivers. Deactivating removes it from customer-facing selection
// without breaking any historical record that points to it.
async function deactivateVehicleType(req, res) {
  try {
    const result = await pool.query(
      `UPDATE vehicle_types SET is_active = false WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle type not found' });
    res.json({ message: 'Vehicle type deactivated', vehicle_type: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate vehicle type' });
  }
}

module.exports = { getAllVehicleTypes, getAllVehicleTypesAdmin, createVehicleType, updateVehicleType, deactivateVehicleType };
