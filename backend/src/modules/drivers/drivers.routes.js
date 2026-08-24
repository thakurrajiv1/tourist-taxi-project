const express = require('express');
const router = express.Router();
const { getAllDrivers, createDriver, updateDriver, deactivateDriver } = require('./drivers.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.get('/', requireAuth, getAllDrivers);
router.post('/', requireAuth, createDriver);
router.put('/:id', requireAuth, updateDriver);
router.delete('/:id', requireAuth, deactivateDriver);

module.exports = router;
