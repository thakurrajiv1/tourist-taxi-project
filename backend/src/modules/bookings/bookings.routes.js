const express = require('express');
const router = express.Router();
const {
  postBooking, getBooking, listBookings, postConfirmBooking, postCancelBooking, postAssignDriver,
} = require('./bookings.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { bookingCreationLimiter } = require('../../middleware/rateLimit');

router.post('/', bookingCreationLimiter, postBooking);
router.get('/:id', requireAuth, getBooking);
router.get('/', requireAuth, listBookings);
router.post('/:id/confirm', requireAuth, postConfirmBooking);
router.post('/:id/cancel', requireAuth, postCancelBooking);
router.post('/:id/assign-driver', requireAuth, postAssignDriver);

module.exports = router;
