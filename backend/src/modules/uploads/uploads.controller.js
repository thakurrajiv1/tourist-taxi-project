const cloudinary = require('cloudinary').v2;
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  isCloudinaryEnabled,
} = require('../../config/cloudinary.config');

if (isCloudinaryEnabled) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Accepts a single image file (already parsed into memory by multer —
 * see uploads.routes.js) and streams it to Cloudinary, returning the
 * hosted URL. That URL is exactly what already goes into
 * tour_packages.cover_image_url — this replaces the manual "add a file
 * to the repo, type its path" workflow with a real upload button.
 */
async function uploadImage(req, res) {
  if (!isCloudinaryEnabled) {
    return res.status(503).json({
      error:
        'Image uploads are not configured yet. Add CLOUDINARY_CLOUD_NAME, ' +
        'CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET — see the setup guide.',
    });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No image file was uploaded' });
  }

  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Only JPEG, PNG, and WEBP images are allowed' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'roaming-route',
          // Keeps a reasonable cap on stored resolution — most tour
          // package/destination photos never need to exceed this, and
          // it saves storage credits over time.
          transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.status(201).json({ url: result.secure_url });
  } catch (err) {
    console.error('[uploads] Cloudinary upload failed:', err.message);
    res.status(500).json({ error: 'Image upload failed. Please try again.' });
  }
}

module.exports = { uploadImage };
