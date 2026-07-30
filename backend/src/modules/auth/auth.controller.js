const { findAdminByEmail, verifyPassword, generateToken } = require('./auth.service');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const admin = await findAdminByEmail(email.toLowerCase().trim());

    // Same error for "no such admin" and "wrong password" — don't leak
    // which one it was, that's an enumeration risk.
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await verifyPassword(password, admin.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(admin);

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
}

module.exports = { login };
