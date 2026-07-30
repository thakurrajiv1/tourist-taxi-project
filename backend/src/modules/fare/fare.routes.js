const express = require('express');
const router = express.Router();
const { getFareQuote, getCustomFareQuote } = require('./fare.controller');

router.post('/quote', getFareQuote);
router.post('/quote-custom', getCustomFareQuote);

module.exports = router;
