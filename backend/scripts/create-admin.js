/**
 * Usage:
 *   node scripts/create-admin.js "admin@yourcompany.com" "yourpassword" "Your Name"
 *
 * There is no public signup route on purpose — admins are created manually
 * by whoever controls the server, which is standard for an internal panel.
 */
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function createAdmin() {
  const [, , email, password, name] = process.argv;

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password> [name]');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO admins (email, password_hash, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email, name`,
      [email.toLowerCase().trim(), passwordHash, name || null]
    );
    console.log('Admin created/updated:', result.rows[0]);
  } catch (err) {
    console.error('Failed to create admin:', err.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
