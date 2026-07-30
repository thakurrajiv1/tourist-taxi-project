const {
  createPaymentOrder,
  verifyWebhookSignature,
  handlePaymentCaptured,
  handlePaymentFailed,
} = require('./payments.service');

async function postCreateOrder(req, res) {
  try {
    const result = await createPaymentOrder(req.params.bookingId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

/**
 * Razorpay calls this URL directly (not the browser), so there's no admin
 * JWT to check here — trust is established entirely via the HMAC signature
 * in the x-razorpay-signature header, verified against the raw request body.
 */
async function postWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];

  let isValid;
  try {
    isValid = verifyWebhookSignature(req.rawBody, signature);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const { event, payload } = req.body;

  try {
    if (event === 'payment.captured') {
      const orderId = payload.payment.entity.order_id;
      const paymentId = payload.payment.entity.id;
      await handlePaymentCaptured(orderId, paymentId);
    } else if (event === 'payment.failed') {
      const orderId = payload.payment.entity.order_id;
      await handlePaymentFailed(orderId);
    }
    // Any other event type: acknowledge without action, so Razorpay
    // doesn't keep retrying an event we don't care about.
    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

module.exports = { postCreateOrder, postWebhook };
