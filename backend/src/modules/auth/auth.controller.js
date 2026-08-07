const { findAdminByEmail, verifyPassword, generateToken } = require('./auth.service');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const admin = await findAdminByEmail(email.toLowerCase().trim());

    // Same generic error whether the email doesn't exist or the password
    // is wrong — don't let a response-timing or message difference reveal
    // which emails are valid admin accounts.
    if (!admin || !admin.is_active) {
      // Still run a bcrypt compare against a dummy hash even when the
      // account doesn't exist, so this code path takes roughly the same
      // time either way (a cheap, worthwhile defense against timing-based
      // user enumeration).
      await verifyPassword(password, '$2a$10$CwTycUXWue0Thq9StjUM0uJ8vC9UgSaEeH/z1U2LhUFqIYPqhX1H2');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await verifyPassword(password, admin.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(admin);
    res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
}

module.exports = { login };
