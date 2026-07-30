const express = require('express');
const router = express.Router();
const { getAllDistances, upsertDistance } = require('./cityDistances.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.get('/', requireAuth, getAllDistances);
router.post('/', requireAuth, upsertDistance);

module.exports = router;
