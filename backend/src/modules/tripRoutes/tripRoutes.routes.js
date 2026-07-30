const express = require('express');
const router = express.Router();
const { getAllTripRoutes, createTripRoute } = require('./tripRoutes.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.get('/', getAllTripRoutes);
router.post('/', requireAuth, createTripRoute);

module.exports = router;
