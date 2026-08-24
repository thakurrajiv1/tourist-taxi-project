const pool = require('../../config/db');
const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;

async function postEnquiry(req, res) {
  const { name, phone, message, source_page } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  if (!phone || !PHONE_REGEX.test(phone.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'phone must be a valid 10-digit Indian mobile number' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO enquiries (name, phone, message, source_page) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), phone.replace(/\s/g, ''), message || null, source_page || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save enquiry' });
  }
}

async function listEnquiries(req, res) {
  try {
    const result = await pool.query('SELECT * FROM enquiries ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
}

// Hard delete — enquiries are just leads with no downstream references,
// so removing one (e.g. spam, or a handled/stale enquiry) is safe.
async function deleteEnquiry(req, res) {
  try {
    const result = await pool.query('DELETE FROM enquiries WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ message: 'Enquiry deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
}

module.exports = { postEnquiry, listEnquiries, deleteEnquiry };
