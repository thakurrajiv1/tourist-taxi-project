const express = require('express');
const router = express.Router();
const { postCreateOrder } = require('./payments.controller');

// Public — the customer's browser calls this right after creating a
// pay_now booking, before they've logged in as anyone.
router.post('/create-order/:bookingId', postCreateOrder);

module.exports = router;
