const express = require('express');
const router = express.Router();
const { getAllDistances, upsertDistance, deleteDistance } = require('./cityDistances.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.get('/', requireAuth, getAllDistances);
router.post('/', requireAuth, upsertDistance);
router.delete('/:id', requireAuth, deleteDistance);

module.exports = router;
