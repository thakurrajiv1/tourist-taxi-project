const {
  validateBookingInput,
  createBooking,
  getBookingById,
  getBookingByReference,
  getAllBookings,
  confirmBooking,
  cancelBooking,
  assignDriverToBooking,
} = require('./bookings.service');

async function postBooking(req, res) {
  const errors = validateBookingInput(req.body);
  if (errors.length > 0) return res.status(400).json({ errors });
  try {
    const result = await createBooking(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 400).json({ error: err.message });
  }
}

async function getBooking(req, res) {
  try {
    const booking = await getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
}

/**
 * Public — the whole point of the reference token is that anyone who has
 * it (the customer, because we emailed it to them) can check status
 * without logging in. Its unguessability is the security boundary here,
 * same as e.g. a shipment tracking number.
 */
async function trackBooking(req, res) {
  try {
    const booking = await getBookingByReference(req.params.reference);
    if (!booking) return res.status(404).json({ error: 'No booking found for that reference. Double-check the code from your confirmation email.' });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booking status' });
  }
}

async function listBookings(req, res) {
  try {
    res.json(await getAllBookings());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

async function postConfirmBooking(req, res) {
  try {
    res.json(await confirmBooking(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function postCancelBooking(req, res) {
  try {
    res.json(await cancelBooking(req.params.id, req.body.reason));
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function postAssignDriver(req, res) {
  const { driver_id } = req.body;
  if (!driver_id) return res.status(400).json({ error: 'driver_id is required' });
  try {
    res.json(await assignDriverToBooking(req.params.id, driver_id));
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

module.exports = {
  postBooking, getBooking, trackBooking, listBookings, postConfirmBooking, postCancelBooking, postAssignDriver,
};
