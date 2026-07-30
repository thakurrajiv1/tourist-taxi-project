const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

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
