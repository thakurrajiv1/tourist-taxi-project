const express = require('express');
const router = express.Router();
const { postBooking, getBooking, listBookings, postConfirmBooking, postAssignDriver } = require('./bookings.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

// Public — customers create bookings, and can look up their own single
// booking by id for a confirmation page (they don't get a login)
router.post('/', postBooking);
router.get('/:id', getBooking);

// Admin-only — the full list exposes every customer's phone/email at once
router.get('/', requireAuth, listBookings);
router.post('/:id/confirm', requireAuth, postConfirmBooking);
router.post('/:id/assign-driver', requireAuth, postAssignDriver);

module.exports = router;
