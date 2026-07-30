const express = require('express');
const cors = require('cors');

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

const app = express();

app.use(cors());

// The Razorpay webhook needs the raw, unparsed request body to verify the
// HMAC signature, so it's wired up BEFORE the global express.json()
// middleware below (which would otherwise consume and parse the body first).
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body; // raw Buffer, used for signature verification
    try {
      req.body = JSON.parse(req.body.toString('utf8'));
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    next();
  },
  postWebhook
);

app.use(express.json());

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

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
