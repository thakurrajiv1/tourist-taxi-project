const express = require('express');
const router = express.Router();
const { listPackages, getPackage, postPackage } = require('./tourPackages.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

// Public — browsing packages needs no login
router.get('/', listPackages);
router.get('/:slug', getPackage);

// Admin-only — creating a package
router.post('/', requireAuth, postPackage);

module.exports = router;
