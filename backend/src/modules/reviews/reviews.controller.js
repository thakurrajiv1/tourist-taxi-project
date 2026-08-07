const { getBusinessReviews } = require('./reviews.service');

async function getReviews(req, res) {
  try {
    const reviews = await getBusinessReviews();
    res.json({ reviews_enabled: true, ...reviews });
  } catch (err) {
    if (err.reviewsDisabled) {
      return res.status(200).json({ reviews_enabled: false, message: err.message });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getReviews };
