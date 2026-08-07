const rateLimit = require('express-rate-limit');

// General limiter — applied to the whole API. Generous enough that a
// normal customer browsing/searching never notices it, tight enough to
// blunt scripted abuse or scraping.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a few minutes.' },
});

// Login gets its own much tighter limiter — this is the classic
// brute-force target (guessing an admin password). Counted per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Booking creation writes to the database and calls the fare engine (and
// Mapbox, once live) — worth limiting separately from general browsing
// traffic to prevent spam bookings or fare-engine hammering.
const bookingCreationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many booking attempts. Please try again shortly, or contact us on WhatsApp.' },
});

module.exports = { generalLimiter, loginLimiter, bookingCreationLimiter };
