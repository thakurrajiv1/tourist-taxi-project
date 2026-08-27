const express = require('express');
const router = express.Router();
const {
  postBooking, getBooking, trackBooking, listBookings, postConfirmBooking, postCancelBooking, postAssignDriver,
} = require('./bookings.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { bookingCreationLimiter } = require('../../middleware/rateLimit');

router.post('/', bookingCreationLimiter, postBooking);

// Public tracking by unguessable reference — covered by the global
// rate limiter already applied in app.js, no extra middleware needed
// here. The token space (12 random base64url chars) is far too large
// to brute-force within any reasonable rate limit anyway.
router.get('/track/:reference', trackBooking);

router.get('/:id', requireAuth, getBooking);
router.get('/', requireAuth, listBookings);
router.post('/:id/confirm', requireAuth, postConfirmBooking);
router.post('/:id/cancel', requireAuth, postCancelBooking);
router.post('/:id/assign-driver', requireAuth, postAssignDriver);

module.exports = router;
