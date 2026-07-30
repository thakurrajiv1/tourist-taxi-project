const { Pool, types } = require('pg');
require('dotenv').config();

// Without this, node-postgres converts DATE columns into JS Date objects
// using the server's local timezone, then re-serializes them as UTC —
// which can shift the displayed date by a day (e.g. 2026-08-01 becoming
// 2026-07-31T18:30:00.000Z for IST). Since pickup_date/return_date are
// pure calendar dates with no time component, we return them as plain
// 'YYYY-MM-DD' strings instead.
const DATE_OID = 1082;
types.setTypeParser(DATE_OID, (val) => val);

// Hosted providers (Render, Railway, etc.) give you a single connection
// string instead of separate host/port/user/password vars, and require
// SSL for external connections. Falls back to the individual vars for
// local development, where neither of those things is true.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

module.exports = pool;
