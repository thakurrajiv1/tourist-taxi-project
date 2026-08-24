const express = require('express');
const router = express.Router();
const { getAllCities, getAllCitiesAdmin, createCity, updateCity, deactivateCity } = require('./cities.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.get('/', getAllCities);
router.get('/admin', requireAuth, getAllCitiesAdmin);
router.post('/', requireAuth, createCity);
router.put('/:id', requireAuth, updateCity);
router.delete('/:id', requireAuth, deactivateCity);

module.exports = router;
