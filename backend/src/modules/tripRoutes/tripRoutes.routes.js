const express = require('express');
const router = express.Router();
const { getAllTripRoutes, getAllTripRoutesAdmin, createTripRoute, updateTripRoute, deactivateTripRoute } = require('./tripRoutes.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.get('/', getAllTripRoutes);
router.get('/admin', requireAuth, getAllTripRoutesAdmin);
router.post('/', requireAuth, createTripRoute);
router.put('/:id', requireAuth, updateTripRoute);
router.delete('/:id', requireAuth, deactivateTripRoute);

module.exports = router;
