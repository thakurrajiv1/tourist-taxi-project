require('dotenv').config();

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || null;
const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID || null;

// Inline star-rating + review snippets stay off until both of these are
// set — same "dormant until configured" pattern as Razorpay (Module 4)
// and Mapbox (custom locations). The "Read Reviews on Google" link button
// works today regardless, since it's just a URL — see
// NEXT_PUBLIC_GOOGLE_REVIEWS_URL in the frontend .env.local.
const isReviewsEnabled = Boolean(GOOGLE_PLACES_API_KEY && GOOGLE_PLACE_ID);

module.exports = { GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID, isReviewsEnabled };
