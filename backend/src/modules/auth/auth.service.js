const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

// Fail fast and loud rather than silently signing tokens with `undefined`
// (which jsonwebtoken actually allows, and which anyone could then forge).
// The placeholder from .env.example is also rejected, so an accidental
// copy-paste without generating a real secret doesn't slip into production.
if (!JWT_SECRET || JWT_SECRET === 'replace_this_with_a_long_random_string') {
  throw new Error(
    'JWT_SECRET is missing or still set to the placeholder value. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))" ' +
      'and set it in your .env file before starting the server.'
  );
}

async function findAdminByEmail(email) {
  const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

function generateToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { findAdminByEmail, verifyPassword, generateToken, verifyToken };
