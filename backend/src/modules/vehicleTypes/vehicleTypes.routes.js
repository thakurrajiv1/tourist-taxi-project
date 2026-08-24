const express = require('express');
const router = express.Router();
const { getAllVehicleTypes, getAllVehicleTypesAdmin, createVehicleType, updateVehicleType, deactivateVehicleType } = require('./vehicleTypes.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.get('/', getAllVehicleTypes);
router.get('/admin', requireAuth, getAllVehicleTypesAdmin);
router.post('/', requireAuth, createVehicleType);
router.put('/:id', requireAuth, updateVehicleType);
router.delete('/:id', requireAuth, deactivateVehicleType);

module.exports = router;
