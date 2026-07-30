const express = require('express');
const router = express.Router();
const { getAllCities, createCity } = require('./cities.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.get('/', getAllCities);
router.post('/', requireAuth, createCity);

module.exports = router;
