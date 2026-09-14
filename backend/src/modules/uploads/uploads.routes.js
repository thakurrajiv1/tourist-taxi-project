const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadImage } = require('./uploads.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

// Memory storage, not disk — Render's filesystem is ephemeral anyway
// (wiped on every redeploy/restart), so there's no point writing the
// file to disk first. The buffer goes straight to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — generous for a photo, blocks abuse
});

// Admin-only — this is an authenticated content-management action, not
// a public endpoint. A wrapper around multer's own error (e.g. file too
// large) turns it into the same { error: "..." } shape as everything
// else in this API, rather than multer's default plain-text error.
router.post('/image', requireAuth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image must be under 5MB' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, uploadImage);

module.exports = router;
