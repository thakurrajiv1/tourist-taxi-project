const {
  validateBookingInput,
  createBooking,
  getBookingById,
  getAllBookings,
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
    // Fare engine errors (e.g. missing distance) surface as 400s, not 500s
    res.status(400).json({ error: err.message });
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

module.exports = { postBooking, getBooking, listBookings };
