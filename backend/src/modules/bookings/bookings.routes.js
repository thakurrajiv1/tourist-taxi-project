const express = require('express');
const router = express.Router();
const { postBooking, getBooking, listBookings, postConfirmBooking, postAssignDriver } = require('./bookings.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { bookingCreationLimiter } = require('../../middleware/rateLimit');

// Public — customers create bookings. Rate-limited more tightly than the
// general API limiter since this writes to the database and triggers a
// fare-engine call (and a Mapbox call, once that's live) per request.
router.post('/', bookingCreationLimiter, postBooking);

// Admin-only. GET /:id was previously public ("so a customer can view
// their own confirmation") but sequential integer IDs make that an IDOR
// vulnerability — anyone can enumerate 1, 2, 3... and read every
// customer's name, phone, and email with zero authentication. The
// current booking flow doesn't actually need this route (the
// confirmation screen renders directly from the POST response), so the
// safe fix is simply requiring admin auth here rather than building a
// whole unguessable-token system for a feature nothing currently uses.
// If a "look up my booking" public feature is wanted later, add a
// separate route keyed on a random booking_reference token, not the
// sequential id.
router.get('/:id', requireAuth, getBooking);
router.get('/', requireAuth, listBookings);
router.post('/:id/confirm', requireAuth, postConfirmBooking);
router.post('/:id/assign-driver', requireAuth, postAssignDriver);

module.exports = router;
