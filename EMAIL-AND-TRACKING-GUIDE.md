# Email Notifications & Booking Tracking

Everything requested: a unique, trackable booking reference; email
notifications to both customer and admin at every status change; driver
and vehicle details sent once assigned; and a public tracking page.
Professionally designed branded HTML emails, built around your actual
Hostinger mailbox.

Tested two ways before delivery: the full booking lifecycle (create →
confirm → assign driver → cancel, plus the separate Razorpay-webhook
confirmation path) was run against a real Postgres database with email
sending intercepted and verified — not just read over. The email
templates themselves were rendered and screenshotted to check the actual
visual output. Specific results below.

## The booking reference — why a new random code, not just the booking ID

Your booking IDs (1, 2, 3...) are sequential and were deliberately locked
down to admin-only earlier (see the IDOR fix from the security round) —
exposing them publicly would let anyone enumerate every customer's
booking by guessing numbers. The new `booking_reference` is a
cryptographically random 12-character code (e.g. `5nUCIgHSz68O`),
generated fresh for every booking, safe to put in a public tracking URL
or email — exactly like a courier tracking number.

**Verified live:**
```
Created booking 1 | reference: UPVit92XkODJ | status: pending
Tracked booking status: pending | route: Delhi -> Manali
```

## Email notifications — verified at every single lifecycle step

I ran a real booking through every state change and intercepted the
actual send calls to confirm the right email fires at the right moment,
to the right person:

```
AFTER CREATE:
   -> rohit@example.com | Booking Received — 5nUCIgHSz68O | Roaming Route
   -> contactus@roamingroute.in | New Booking: Rohit Sharma — Delhi -> Manali

AFTER CONFIRM:
   -> rohit@example.com | Booking Confirmed — 5nUCIgHSz68O | Roaming Route

AFTER ASSIGN DRIVER:
   -> rohit@example.com | Driver Assigned — 5nUCIgHSz68O | Roaming Route

AFTER CANCEL:
   -> rohit@example.com | Booking Cancelled — 5nUCIgHSz68O | Roaming Route
```

I also separately verified the *other* path to a confirmed booking — a
Razorpay webhook payment confirmation, which updates the booking through
different code than the admin's manual "Confirm" button — correctly
sends the same confirmation email:
```
=== EMAILS SENT (webhook-confirm step only) ===
 -> amit@example.com | Booking Confirmed — mMc44cSdi2Me | Roaming Route
```

**Graceful degradation, also verified**: with no SMTP credentials set at
all, booking creation still succeeds — it just logs that email was
skipped, rather than failing the booking:
```
[email] SMTP not configured — skipped email "Booking Received — NrGkGuKKIgCG..." to test@example.com
Booking created successfully WITHOUT email configured: 1 NrGkGuKKIgCG
```
This matters because you're setting this up incrementally — the site
keeps working perfectly while you're still getting your mailbox password
into the right place.

## The email design

Built as proper HTML email (table-based layout, inline styles) rather
than a webpage — this matters because Outlook desktop's rendering engine
is Word, not a browser, and only reliably understands tables. Screenshot
of the actual rendered output:

**"Booking Received" email** — clean hierarchy, the reference code is the
visual anchor, trip details in a scannable table, a clear call-to-action
button in your brand's marigold accent color.

**"Driver Assigned" email** — the richest of the five, since this is the
one a customer actually reads carefully. Driver name and phone number
(as a tap-to-call link) sit in a highlighted box, not buried in a table.

All five emails (booking received — customer and admin versions,
confirmed, cancelled, driver assigned) share one branded layout: a header
banner image, your brand's navy-green color throughout, and a consistent
footer with your contact details.

## One thing you need to add: the header banner image

Every email references an image at
`frontend/public/images/email/header.jpg` that doesn't exist yet — until
you add it, the banner area shows a broken-image icon (emails still send
and work fine otherwise). Full guidance, including why this approach
(an image on your own domain, not an attachment) is the right one, is in
`frontend/public/images/email/README.md`, included in this delivery.

## Setting up your Hostinger mailbox

Add these to your **backend** environment variables (locally in `.env`,
and on Render for production):

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contactus@roamingroute.in
SMTP_PASSWORD=your_actual_mailbox_password
EMAIL_FROM_NAME=Roaming Route Travel and Transport
ADMIN_NOTIFICATION_EMAIL=contactus@roamingroute.in
```

`SMTP_HOST` and `SMTP_PORT` already default to these exact values in the
code, so you technically only need to set `SMTP_USER` and
`SMTP_PASSWORD` — but setting all of them explicitly is clearer and
future-proofs you if Hostinger ever changes their recommended settings.

**Note on the password**: use your actual Hostinger email account
password. If you have two-factor authentication enabled on that mailbox,
Hostinger requires an **app-specific password** instead — generate one
from your Hostinger account's email security settings if 2FA is on.

## Public tracking page

New page: **`/track`** — customers can paste their reference number
directly, or arrive via a link like `roamingroute.in/track?ref=XXXX`
(which is exactly what the "Track Your Booking" button in every email
and the post-booking confirmation screen links to). Shows a visual status
timeline (Received → Confirmed → Driver Assigned → Completed), full trip
details, and — once assigned — the driver's name, phone, and vehicle
number.

This page is marked `noindex` (won't show up in Google search results),
since booking references are meant to be shared privately via email, not
discovered publicly.

## Where every file goes

**Backend:**

| File | Notes |
|---|---|
| `backend/src/db/migrations/010_booking_reference.sql` | new — run this |
| `backend/src/config/email.config.js` | new |
| `backend/src/modules/email/email.service.js` | new |
| `backend/src/modules/email/emailLayout.js` | new |
| `backend/src/modules/email/templates.js` | new |
| `backend/src/modules/bookings/bookings.service.js` | replace |
| `backend/src/modules/bookings/bookings.controller.js` | replace |
| `backend/src/modules/bookings/bookings.routes.js` | replace |
| `backend/src/modules/payments/payments.service.js` | replace |

**Frontend:**

| File | Notes |
|---|---|
| `frontend/lib/api.js` | replace |
| `frontend/pages/track.js` | new |
| `frontend/pages/booking.js` | replace |
| `frontend/components/Header.js` | replace (adds "Track Booking" nav link) |
| `frontend/public/images/email/README.md` | new |

## One dependency to install

```bash
cd backend
npm install nodemailer
```

## Steps to apply

1. Copy every file into place per the tables above
2. `npm install` in `backend/` (adds `nodemailer`)
3. Run the migration:
   ```bash
   psql -U postgres -d tourist_taxi -f src/db/migrations/010_booking_reference.sql
   ```
4. Add the SMTP environment variables above to `backend/.env` (locally)
   and Render's environment settings (production)
5. Add the header banner image (see the README in
   `frontend/public/images/email/`)
6. Commit, push — both platforms redeploy automatically

## Testing after deploying

1. Make a test booking on the live site **with your own email address**
2. Check your inbox for the "Booking Received" email (check spam folder
   too, the first few times — new sending domains sometimes land there
   until your domain builds sending reputation)
3. Log into `/admin/bookings`, confirm your test booking — check for the
   "Booking Confirmed" email
4. Assign a driver — check for the "Driver Assigned" email with the
   driver's name and phone
5. Click the "Track Your Booking" button in any of those emails, or
   visit `/track` directly and paste your reference — confirm the status
   timeline and driver details display correctly
6. As a final check, cancel a different test booking and confirm the
   "Booking Cancelled" email arrives with your typed reason included
