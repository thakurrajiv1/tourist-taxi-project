const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const citiesRoutes = require('./modules/cities/cities.routes');
const vehicleTypesRoutes = require('./modules/vehicleTypes/vehicleTypes.routes');
const tripRoutesRoutes = require('./modules/tripRoutes/tripRoutes.routes');
const fareRoutes = require('./modules/fare/fare.routes');
const bookingsRoutes = require('./modules/bookings/bookings.routes');
const authRoutes = require('./modules/auth/auth.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const { postWebhook } = require('./modules/payments/payments.controller');
const driversRoutes = require('./modules/drivers/drivers.routes');
const enquiriesRoutes = require('./modules/enquiries/enquiries.routes');
const tourPackagesRoutes = require('./modules/tourPackages/tourPackages.routes');
const cityDistancesRoutes = require('./modules/cityDistances/cityDistances.routes');
const reviewsRoutes = require('./modules/reviews/reviews.routes');
const { generalLimiter } = require('./middleware/rateLimit');

const app = express();

// Render/Vercel/most PaaS providers sit behind a reverse proxy — without
// this, express-rate-limit (and anything else keying off req.ip) sees the
// proxy's IP for every request instead of the real client IP.
app.set('trust proxy', 1);

// Sets a battery of standard security headers (X-Content-Type-Options,
// X-Frame-Options, Strict-Transport-Security, hides X-Powered-By, etc).
// Defaults are tuned for HTML-serving apps; since this is a pure JSON
// API, the default Content-Security-Policy header is unnecessary and
// occasionally confuses API clients, so it's disabled here specifically.
app.use(helmet({ contentSecurityPolicy: false }));

// Restrict cross-origin requests to known frontend origins in production.
// FRONTEND_URL should be your Vercel deployment URL (and custom domain,
// if you add one — comma-separate multiple origins). Falls back to
// allowing any origin only when FRONTEND_URL isn't set, which is fine for
// local development but should always be set in production.
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
  : null;

app.use(
  cors(
    allowedOrigins
      ? {
          origin: (origin, callback) => {
            // Allow non-browser requests (curl, server-to-server) which
            // send no Origin header at all.
            if (!origin || allowedOrigins.includes(origin)) {
              return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
          },
        }
      : {}
  )
);

app.use(generalLimiter);

// The Razorpay webhook needs the raw, unparsed request body to verify the
// HMAC signature, so it's wired up BEFORE the global express.json()
// middleware below (which would otherwise consume and parse the body first).
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json', limit: '100kb' }),
  (req, res, next) => {
    req.rawBody = req.body;
    try {
      req.body = JSON.parse(req.body.toString('utf8'));
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    next();
  },
  postWebhook
);

// A cap on JSON body size — well above anything a legitimate request
// needs (the largest payload in this app is a tour package with a full
// itinerary), but blocks a trivial DoS vector of sending huge bodies.
app.use(express.json({ limit: '200kb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/cities', citiesRoutes);
app.use('/api/vehicle-types', vehicleTypesRoutes);
app.use('/api/trip-routes', tripRoutesRoutes);
app.use('/api/fare', fareRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/enquiries', enquiriesRoutes);
app.use('/api/tour-packages', tourPackagesRoutes);
app.use('/api/city-distances', cityDistancesRoutes);
app.use('/api/reviews', reviewsRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler — catches anything thrown/passed to next()
// that individual route handlers didn't already handle, so a bug never
// leaks a raw stack trace or internal error detail to the client.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

module.exports = app;
