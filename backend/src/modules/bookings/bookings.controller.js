const {
  validateBookingInput,
  createBooking,
  getBookingById,
  getAllBookings,
  confirmBooking,
  assignDriverToBooking,
} = require('./bookings.service');

async function postBooking(req, res) {
  const errors = validateBookingInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const result = await createBooking(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    // Fare engine errors (e.g. missing distance, maps not configured) carry
    // their own statusCode; default to 400 for anything else.
    res.status(err.statusCode || 400).json({ error: err.message });
  }
}

async function getBooking(req, res) {
  try {
    const booking = await getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
}

async function listBookings(req, res) {
  try {
    const bookings = await getAllBookings();
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

async function postAssignDriver(req, res) {
  const { driver_id } = req.body;

  if (!driver_id) {
    return res.status(400).json({ error: 'driver_id is required' });
  }

  try {
    const booking = await assignDriverToBooking(req.params.id, driver_id);
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function postConfirmBooking(req, res) {
  try {
    const booking = await confirmBooking(req.params.id);
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

module.exports = { postBooking, getBooking, listBookings, postConfirmBooking, postAssignDriver };
