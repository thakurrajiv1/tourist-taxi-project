const { GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID, isReviewsEnabled } = require('../../config/reviews.config');

/**
 * Fetches the business's aggregate rating and a handful of review
 * snippets from the Google Places API (Place Details endpoint).
 * Degrades gracefully when not configured — see reviews.controller.js —
 * same shape as the payments and custom-location "not live yet" states.
 */
async function getBusinessReviews() {
  if (!isReviewsEnabled) {
    const err = new Error(
      "Reviews aren't connected yet — showing our Google Business Profile link instead."
    );
    err.reviewsDisabled = true;
    throw err;
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${GOOGLE_PLACE_ID}` +
    `&fields=name,rating,user_ratings_total,reviews` +
    `&key=${GOOGLE_PLACES_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Google Places API returned an error. Please try again shortly.');
  }
  const data = await res.json();

  if (data.status !== 'OK') {
    throw new Error(`Google Places API error: ${data.status}`);
  }

  const result = data.result;
  return {
    name: result.name,
    rating: result.rating,
    total_ratings: result.user_ratings_total,
    // Cap at 5 — Google returns up to 5 sorted by relevance, this just
    // future-proofs against an API change returning more.
    reviews: (result.reviews || []).slice(0, 5).map((r) => ({
      author_name: r.author_name,
      rating: r.rating,
      text: r.text,
      relative_time_description: r.relative_time_description,
    })),
  };
}

module.exports = { getBusinessReviews };
