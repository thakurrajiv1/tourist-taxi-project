const express = require('express');
const router = express.Router();
const {
  listPackages, listPackagesAdmin, getPackage, getPackageAdmin, postPackage, putPackage, deletePackage,
} = require('./tourPackages.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.get('/', listPackages);
router.get('/admin', requireAuth, listPackagesAdmin);
router.get('/admin/:id', requireAuth, getPackageAdmin);
router.get('/:slug', getPackage);
router.post('/', requireAuth, postPackage);
router.put('/:id', requireAuth, putPackage);
router.delete('/:id', requireAuth, deletePackage);

module.exports = router;
