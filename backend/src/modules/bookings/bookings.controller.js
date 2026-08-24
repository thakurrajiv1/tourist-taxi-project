const {
  validateBookingInput,
  createBooking,
  getBookingById,
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
    const booking = await cancelBooking(req.params.id, req.body.reason);
    res.json(booking);
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

module.exports = { postBooking, getBooking, listBookings, postConfirmBooking, postCancelBooking, postAssignDriver };
