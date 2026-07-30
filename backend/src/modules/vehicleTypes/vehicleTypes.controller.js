const pool = require('../../config/db');

async function getAllVehicleTypes(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM vehicle_types WHERE is_active = true ORDER BY per_km_rate ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicle types' });
  }
}

async function createVehicleType(req, res) {
  const {
    name,
    seater_capacity,
    per_km_rate,
    base_fare,
    driver_allowance_per_day,
    night_halt_charge,
    image_url,
  } = req.body;

  if (!name || per_km_rate === undefined) {
    return res.status(400).json({ error: 'name and per_km_rate are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO vehicle_types
        (name, seater_capacity, per_km_rate, base_fare, driver_allowance_per_day, night_halt_charge, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        name,
        seater_capacity || null,
        per_km_rate,
        base_fare || 0,
        driver_allowance_per_day || 0,
        night_halt_charge || 0,
        image_url || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vehicle type' });
  }
}

module.exports = { getAllVehicleTypes, createVehicleType };
