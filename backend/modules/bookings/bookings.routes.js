const express = require('express');
const router = express.Router();
const { postBooking, getBooking, listBookings } = require('./bookings.controller');

router.post('/', postBooking);
router.get('/', listBookings);
router.get('/:id', getBooking);

module.exports = router;
