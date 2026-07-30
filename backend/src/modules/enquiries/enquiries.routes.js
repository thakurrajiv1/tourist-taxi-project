const express = require('express');
const router = express.Router();
const { postEnquiry, listEnquiries } = require('./enquiries.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

// Public — anyone using the site's enquiry widget hits this
router.post('/', postEnquiry);

// Admin-only — exposes customer names/phone numbers in bulk
router.get('/', requireAuth, listEnquiries);

module.exports = router;
