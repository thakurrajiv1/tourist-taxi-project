require('dotenv').config();

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || null;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || null;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || null;

// Image uploads stay inactive until all three are set — see
// uploads.controller.js for the clear error shown to the admin while
// it's off, same dormant-until-configured pattern used throughout this
// project (Razorpay, Mapbox, Google Reviews, Resend).
const isCloudinaryEnabled = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

module.exports = {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  isCloudinaryEnabled,
};
