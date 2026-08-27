const {
  SITE_URL,
  buildLayout,
  ctaButton,
  referenceBox,
  detailRow,
  detailTable,
  infoBox,
  infoRow,
  heading,
  paragraph,
  mutedParagraph,
} = require('./emailLayout');

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function routeLabel(booking) {
  const from = booking.from_city_name || booking.from_address;
  const to = booking.to_city_name || booking.to_address;
  return `${from} &rarr; ${to}`;
}

function tripDetailRows(booking) {
  return [
    detailRow('Route', routeLabel(booking)),
    detailRow('Trip Type', booking.trip_type === 'one_way' ? 'One Way' : booking.trip_type === 'round_trip' ? 'Round Trip' : 'Local / Full Day'),
    detailRow('Pickup Date', formatDate(booking.pickup_date)),
    booking.return_date ? detailRow('Return Date', formatDate(booking.return_date)) : '',
    detailRow('Vehicle', booking.vehicle_type_name),
    detailRow('Fare', `&#8377;${parseFloat(booking.quoted_fare).toLocaleString('en-IN')}`),
  ].filter(Boolean);
}

const trackUrl = (reference) => `${SITE_URL}/track?ref=${reference}`;

/**
 * Sent to the customer immediately after a booking is created — for both
 * pay_now and pay_later, since either way this is the "we've got it"
 * confirmation the customer expects right away. Whether it's actually
 * *confirmed* (vs pending review) is called out explicitly rather than
 * implied, since "booking received" and "booking confirmed" are
 * genuinely different states and conflating them would be misleading.
 */
function bookingReceivedCustomerEmail(booking) {
  const isPending = booking.booking_status === 'pending' || booking.booking_status === 'awaiting_payment';
  const bodyHtml = `
    ${heading(`Thanks, ${booking.customer_name.split(' ')[0]}!`)}
    ${paragraph("We've received your booking request. Here are the details:")}
    ${referenceBox(booking.booking_reference)}
    ${detailTable(tripDetailRows(booking))}
    ${isPending
      ? paragraph('Our team will review and confirm your trip shortly — you\'ll get another email the moment it\'s confirmed.')
      : paragraph('Your trip is confirmed. We\'ll email you again once a driver is assigned.')}
    ${ctaButton('Track Your Booking', trackUrl(booking.booking_reference))}
    ${mutedParagraph('Save this email or bookmark the tracking link above — you can check your booking\'s status anytime using your reference number.')}
  `;
  return {
    subject: `Booking Received — ${booking.booking_reference} | Roaming Route`,
    html: buildLayout({ preheader: `We've received your booking from ${booking.from_city_name || booking.from_address} to ${booking.to_city_name || booking.to_address}.`, bodyHtml }),
  };
}

/**
 * Sent to the admin mailbox on every new booking — deliberately plainer
 * and more functional than the customer emails (no need for a hero
 * image or marketing tone here, just the facts and a link to act on it).
 */
function bookingReceivedAdminEmail(booking) {
  const bodyHtml = `
    ${heading('New Booking Received')}
    ${paragraph(`<strong>${booking.customer_name}</strong> (${booking.customer_phone}${booking.customer_email ? `, ${booking.customer_email}` : ''}) just submitted a booking.`)}
    ${referenceBox(booking.booking_reference)}
    ${detailTable(tripDetailRows(booking))}
    ${detailTable([
      detailRow('Payment Preference', booking.payment_preference === 'pay_now' ? 'Pay Now' : 'Pay Later'),
      detailRow('Status', booking.booking_status),
    ])}
    ${ctaButton('Open Admin Panel', `${SITE_URL}/admin/bookings`)}
  `;
  return {
    subject: `New Booking: ${booking.customer_name} — ${routeLabel(booking).replace('&rarr;', '->')}`,
    html: buildLayout({ preheader: `New booking from ${booking.customer_name}`, bodyHtml }),
  };
}

function bookingConfirmedEmail(booking) {
  const bodyHtml = `
    ${heading('Your Booking is Confirmed! ✓')}
    ${paragraph(`Good news, ${booking.customer_name.split(' ')[0]} — your trip is confirmed.`)}
    ${referenceBox(booking.booking_reference)}
    ${detailTable(tripDetailRows(booking))}
    ${paragraph("We'll email you again with your driver and vehicle details closer to your pickup date.")}
    ${ctaButton('Track Your Booking', trackUrl(booking.booking_reference))}
  `;
  return {
    subject: `Booking Confirmed — ${booking.booking_reference} | Roaming Route`,
    html: buildLayout({ preheader: 'Your trip is confirmed — details inside.', bodyHtml }),
  };
}

function bookingCancelledEmail(booking) {
  const bodyHtml = `
    ${heading('Your Booking Has Been Cancelled')}
    ${paragraph(`Hi ${booking.customer_name.split(' ')[0]}, this confirms your booking has been cancelled.`)}
    ${referenceBox(booking.booking_reference)}
    ${booking.cancellation_reason ? paragraph(`<strong>Reason:</strong> ${booking.cancellation_reason}`) : ''}
    ${detailTable(tripDetailRows(booking))}
    ${paragraph('If this was a mistake, or you\'d like to make a new booking, just reply to this email or reach us on WhatsApp.')}
  `;
  return {
    subject: `Booking Cancelled — ${booking.booking_reference} | Roaming Route`,
    html: buildLayout({ preheader: 'Your booking has been cancelled.', bodyHtml }),
  };
}

/**
 * The richest of the five — this is the email a customer actually reads
 * closely, since it tells them who's picking them up. Driver contact
 * info is front and center rather than buried in a table.
 */
function driverAssignedEmail(booking, driver) {
  const bodyHtml = `
    ${heading('Your Driver is Assigned! 🚗')}
    ${paragraph(`Hi ${booking.customer_name.split(' ')[0]}, here's who'll be driving you:`)}
    ${infoBox({
      title: 'Driver & Vehicle',
      rows: [
        infoRow('Driver Name', driver.name),
        infoRow('Contact Number', `<a href="tel:${driver.phone}" style="color:#16241d;">${driver.phone}</a>`),
        infoRow('Vehicle Type', driver.vehicle_type_name),
        infoRow('Vehicle Number', driver.vehicle_number),
      ],
    })}
    ${detailTable(tripDetailRows(booking))}
    ${paragraph('Please save the driver\'s number — they\'ll contact you closer to pickup time to confirm the exact meeting point.')}
    ${ctaButton('Track Your Booking', trackUrl(booking.booking_reference))}
  `;
  return {
    subject: `Driver Assigned — ${booking.booking_reference} | Roaming Route`,
    html: buildLayout({ preheader: `${driver.name} will be your driver — contact details inside.`, bodyHtml }),
  };
}

module.exports = {
  bookingReceivedCustomerEmail,
  bookingReceivedAdminEmail,
  bookingConfirmedEmail,
  bookingCancelledEmail,
  driverAssignedEmail,
};
