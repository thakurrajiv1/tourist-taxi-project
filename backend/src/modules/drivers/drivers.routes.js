const express = require('express');
const router = express.Router();
const { getAllDrivers, createDriver } = require('./drivers.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.get('/', requireAuth, getAllDrivers);
router.post('/', requireAuth, createDriver);

module.exports = router;
