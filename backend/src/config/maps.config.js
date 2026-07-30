require('dotenv').config();

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || null;

// Custom-location pricing stays inactive until this token is set — see
// maps.service.js and fare.service.js for how the app degrades gracefully
// while it's off, same pattern as the Razorpay config in Module 4.
const isMapsEnabled = Boolean(MAPBOX_ACCESS_TOKEN);

module.exports = { MAPBOX_ACCESS_TOKEN, isMapsEnabled };
