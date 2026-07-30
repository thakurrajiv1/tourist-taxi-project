const express = require('express');
const router = express.Router();
const { getAllVehicleTypes, createVehicleType } = require('./vehicleTypes.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.get('/', getAllVehicleTypes);
router.post('/', requireAuth, createVehicleType);

module.exports = router;
