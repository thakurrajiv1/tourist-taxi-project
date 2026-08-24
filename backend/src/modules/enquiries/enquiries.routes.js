const express = require('express');
const router = express.Router();
const { postEnquiry, listEnquiries, deleteEnquiry } = require('./enquiries.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

router.post('/', postEnquiry);
router.get('/', requireAuth, listEnquiries);
router.delete('/:id', requireAuth, deleteEnquiry);

module.exports = router;
