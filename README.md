# Tourist Taxi Booking Platform — Project Base

A multi-city, tourist-focused taxi booking website (outstation, round-trip, local
sightseeing, and multi-day tour packages). Not a real-time dispatch app like
Ola/Uber — booking + admin-assigned trips model.

## Module List (build order)

| # | Module | Status | Description |
|---|--------|--------|--------------|
| 1 | **Core data + Fare Engine** | ✅ Built | Cities, vehicle types, fixed routes, distance-based fallback fare calculation |
| 2 | **Bookings** | ✅ Built | Customer booking creation (server-side fare lock), pay now / pay later choice |
| 3 | **Admin Auth** | ✅ Built | JWT login, protected write/admin endpoints, single admin role |
| 4 | **Payments (Razorpay)** | ✅ Built, dormant | Advance payment order creation + webhook, gracefully inactive until Razorpay keys are added |
| 5 | **Driver Assignment** | ✅ Built | Assign driver/vehicle to a confirmed booking, with overlap-conflict protection |
| 6 | **Frontend (Next.js)** | ✅ Built | Home search + fare quote, booking flow, SEO route landing pages, admin dashboard |
| 7 | **WhatsApp Enquiry Integration** | ✅ Built | Floating enquiry widget, lead capture, admin enquiries screen |
| 8 | **Tour Packages Module** | ✅ Built | Multi-day itineraries, public browsing + detail pages, admin builder |

We're building **one module at a time**, fully working, before moving to the next.

## Module 1 — What's Included

**Database schema** (`backend/src/db/schema.sql`)
- `cities` — master list of serviceable cities
- `vehicle_types` — Sedan / SUV / Tempo Traveller etc. with rate config
- `trip_routes` — fixed-price popular routes (e.g. Delhi → Manali)
- `city_distances` — cached distance lookups for the calculated-fare fallback
- `bookings` — placeholder table for Module 2
- `drivers` — placeholder table for Module 5

**API (Express + PostgreSQL)**
- `GET /api/cities` — list active cities
- `POST /api/cities` — add a city (admin use, no auth yet — added in Module 3)
- `GET /api/vehicle-types` — list vehicle categories
- `POST /api/vehicle-types` — add a vehicle category
- `GET /api/trip-routes` — list fixed routes
- `POST /api/trip-routes` — add a fixed route
- `POST /api/fare/quote` — **the core endpoint**: given from/to city, vehicle type,
  trip type, and dates, returns a fare — checking fixed routes first, falling
  back to distance-based calculation

## Running It

```bash
cd backend
cp .env.example .env       # fill in your Postgres credentials
npm install
psql -U youruser -d yourdb -f src/db/schema.sql
npm run dev                 # starts on http://localhost:4000
```

## Test the Fare Engine

```bash
# Add a city, a vehicle type, then request a quote:
curl -X POST http://localhost:4000/api/fare/quote \
  -H "Content-Type: application/json" \
  -d '{
    "from_city_id": 1,
    "to_city_id": 2,
    "vehicle_type_id": 1,
    "trip_type": "one_way",
    "pickup_date": "2026-08-01"
  }'
```

## Module 2 — Bookings

**If you already ran `schema.sql` before this module was added**, run the
migration to add the new column:

```bash
psql -U postgres -d tourist_taxi -f src/db/migrations/001_add_payment_preference.sql
```

(If you're setting up fresh, `schema.sql` already includes this column —
skip the migration.)

**New endpoint:**
- `POST /api/bookings` — create a booking. Fare is always recalculated
  server-side using Module 1's fare engine — the client cannot submit its
  own price.
- `GET /api/bookings` — list all bookings (no auth yet — added in Module 3)
- `GET /api/bookings/:id` — fetch a single booking

**Request body example:**
```json
{
  "from_city_id": 1,
  "to_city_id": 2,
  "vehicle_type_id": 1,
  "trip_type": "one_way",
  "pickup_date": "2026-08-01",
  "customer_name": "Rohit Sharma",
  "customer_phone": "9876543210",
  "customer_email": "rohit@example.com",
  "payment_preference": "pay_later"
}
```

**Booking status logic:**
- `payment_preference: "pay_later"` → `booking_status = "pending"` (your ops
  team calls to confirm and collect advance manually)
- `payment_preference: "pay_now"` → `booking_status = "awaiting_payment"`
  (the response includes `payment_required: true` — Module 4 will wire this
  to an actual Razorpay order; for now it's a placeholder flag your frontend
  can use to redirect to a "coming soon" or manual payment step)

Validation included: Indian phone number format, no past-dated pickups,
`return_date` required for round trips, valid email format if provided.

## Module 3 — Admin Auth

**If your database already exists**, run the new migration:

```bash
psql -U postgres -d tourist_taxi -f src/db/migrations/002_create_admins.sql
```

**Install the new dependencies:**

```bash
npm install
```

**Set a real JWT secret** in your `.env` (don't leave the placeholder):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy that output into `JWT_SECRET=` in your `.env` file.

**Create your first admin user** (no public signup route — this is by
design, admins are created manually):

```bash
node scripts/create-admin.js "you@yourcompany.com" "a-strong-password" "Your Name"
```

**New endpoint:**
- `POST /api/auth/login` → `{ "email": "...", "password": "..." }` returns
  `{ token, admin }`. The token is a JWT valid for 7 days.

**What's now protected** (requires `Authorization: Bearer <token>` header):
- `POST /api/cities`
- `POST /api/vehicle-types`
- `POST /api/trip-routes`
- `GET /api/bookings` (the full list — exposes every customer's contact info)

**What's still public** (customers need these without logging in):
- All `GET` endpoints for cities/vehicle-types/trip-routes
- `POST /api/fare/quote`
- `POST /api/bookings` (creating a booking)
- `GET /api/bookings/:id` (a customer looking up their own single booking
  by id, e.g. for a confirmation page — this is intentionally not
  admin-only)

## Module 4 — Payments (Razorpay), Built Dormant

You don't have a Razorpay account yet, so this module ships **fully built
but inactive**. Nothing changes in how the app behaves today — it just
becomes ready to go live the moment you add two things to `.env`.

**If your database already exists**, run the new migration:

```bash
psql -U postgres -d tourist_taxi -f src/db/migrations/003_add_payment_fields.sql
```

**New endpoints:**
- `POST /api/payments/create-order/:bookingId` — call this after creating
  a `pay_now` booking. Public (no login needed — it's part of the customer
  flow), but only works on bookings marked `pay_now`.
- `POST /api/payments/webhook` — Razorpay calls this directly once a
  payment completes. Not meant to be called manually.

**Current behavior (no Razorpay keys set):**
```json
{
  "payment_gateway_enabled": false,
  "message": "Online payment isn't live yet. Our team will contact you shortly to arrange the advance payment.",
  "booking_id": 2,
  "quoted_fare": 7500
}
```
This is intentional — the booking still gets created, your ops team just
follows up manually, exactly like the `pay_later` flow.

**To go live later**, once you've talked to finance and have a Razorpay
account:
1. Run `npm install` (pulls in the `razorpay` package, already in
   `package.json`)
2. Get your Key ID and Key Secret from Razorpay Dashboard → Settings → API
   Keys, and your Webhook Secret from Settings → Webhooks (when you create
   the webhook pointing at `https://yourdomain.com/api/payments/webhook`)
3. Fill in `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
   `RAZORPAY_WEBHOOK_SECRET`, and `ADVANCE_PAYMENT_PERCENTAGE` in `.env`
4. Restart the server — no code changes needed, it activates automatically

**Testing it now (still in the dormant state):**
```bash
curl -X POST http://localhost:4000/api/payments/create-order/2
```
(assuming booking id `2` is a `pay_now` booking from Module 2 testing)

## Module 5 — Driver Assignment

**If your database already exists**, run the new migration:

```bash
psql -U postgres -d tourist_taxi -f src/db/migrations/004_driver_assignment.sql
```

**New endpoints:**
- `POST /api/bookings/:id/confirm` — manually confirm a `pending`
  (`pay_later`) booking, flipping it to `confirmed`. This is the ops-team
  equivalent of what Module 4's webhook does automatically once a
  `pay_now` payment is captured.
- `POST /api/drivers` — add a driver (admin only)
- `GET /api/drivers` — list drivers, optionally filter with
  `?vehicle_type_id=1` and/or `?is_active=true` (admin only)
- `POST /api/bookings/:id/assign-driver` — assign a driver to a booking
  (admin only), body: `{ "driver_id": 3 }`

**Guardrails enforced on assignment:**
- Booking must be in `confirmed` status — you can't assign a driver to a
  booking that's still `pending`/`awaiting_payment`, since that risks
  committing a driver to a trip that might not happen
- Driver's `vehicle_type_id` must match the booking's requested vehicle
  type — no assigning a Sedan driver to an SUV booking
- **Overlap protection**: the driver can't already be assigned to another
  trip whose dates overlap this one. A one-way/local trip occupies just the
  `pickup_date`; a round trip occupies the full `pickup_date` →
  `return_date` range. A conflict returns a `409` naming the clashing
  booking.

Successful assignment flips `booking_status` from `confirmed` to
`assigned`.

**Example flow for a pay_later booking:**
```bash
# 1. Confirm the booking (ops team called the customer, advance arranged)
curl -X POST http://localhost:4000/api/bookings/1/confirm \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Add a driver
curl -X POST http://localhost:4000/api/drivers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Suresh Kumar", "phone": "9812345678", "vehicle_number": "HP-01-AB-1234", "vehicle_type_id": 1}'

# 3. Assign that driver to the booking
curl -X POST http://localhost:4000/api/bookings/1/assign-driver \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"driver_id": 1}'
```

## Module 6 — Frontend (Next.js)

A working customer-facing site, verified with a real `npm run build` (not
just eyeballed) — three pages, all calling the backend built in Modules
1-5.

**Pages:**
- `/` — hero search form (from/to city, vehicle, trip type, date) → shows
  a live fare quote from `/api/fare/quote` → "Popular Routes" section
  pulling your fixed routes as SEO-friendly cards linking to `/taxi/[slug]`
- `/booking` — reads the search params from the URL, re-fetches the fare
  (never trusts a client-held price), collects customer details, submits
  to `POST /api/bookings`, then shows a confirmation screen. Handles both
  `pay_later` and `pay_now` — for `pay_now` it calls the Module 4 payments
  endpoint and shows the graceful "not live yet" message since Razorpay
  isn't configured
- `/taxi/[slug]` — SEO landing page per fixed route (e.g.
  `/taxi/delhi-to-manali-taxi`), server-rendered with `getServerSideProps`
  so search engines see real content, not a client-side loading spinner

**Design:** navy/gold color scheme, plain CSS (no framework dependency to
keep things simple to modify) — see `styles/globals.css` for the palette
if you want to adjust it.

## Running the Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Visit `http://localhost:3000`. Make sure the backend (Module 1-5) is
running on `http://localhost:4000` at the same time — the frontend calls
it directly.

**Try it:**
1. On the homepage, search Delhi → Manali, Sedan, One Way, any date — you
   should see the fixed ₹7500 fare appear
2. Click "Book This Cab" → fill in your name/phone → submit → see the
   confirmation screen
3. Visit `/taxi/delhi-to-manali-taxi` directly (assuming that's the
   `seo_slug` you used when creating the fixed route in Module 1) and
   confirm the route page renders with real data

## Admin Dashboard — Built On Top of Module 6

No new backend endpoints — this is a UI on top of what Modules 3-5 already
expose. Verified with a real `npm run build`, same as the public site.

**Pages:**
- `/admin/login` — admin email/password login, stores the JWT in
  `localStorage`
- `/admin/bookings` — full booking list with inline actions:
  - **Confirm** button on `pending` bookings → calls
    `POST /api/bookings/:id/confirm`
  - **Assign Driver** on `confirmed` bookings → a dropdown filtered to
    drivers matching that booking's vehicle type, calling
    `POST /api/bookings/:id/assign-driver`. If the driver's already busy
    that day, Module 5's overlap-conflict error shows inline on that row.
- `/admin/drivers` — add-driver form + full driver list

**Auth handling:** every admin API call goes through `lib/adminApi.js`,
which attaches the JWT automatically and throws a distinct
`UnauthorizedError` on a 401 — each page catches that and redirects to
`/admin/login`, so an expired/missing token never shows a blank or broken
page.

**Try it:**
```
http://localhost:3000/admin
```
Log in with the admin account you created in Module 3
(`node scripts/create-admin.js ...`). You should land on the bookings
table with your existing test bookings from earlier — try confirming a
`pending` one and assigning a driver directly from the UI.

## Branding

The site is branded as **Roaming Route** (legal name: **Roaming Route
Travel and Transport**) across the header, footer, page titles, and admin
dashboard.

## Admin Screens — Cities, Vehicle Types, Fixed Routes

Rounds out the admin dashboard so pricing and master data can be managed
entirely through the UI — no curl needed for day-to-day operations.

**Pages:**
- `/admin/cities` — add a city (name, state, optional lat/lng), see the
  full list
- `/admin/vehicle-types` — add a vehicle category with its full rate
  config (per-km rate, base fare, driver allowance/day, night halt
  charge), see all configured types
- `/admin/routes` — add a fixed-price route (the override layer from
  Module 1's fare engine), with dropdowns for city/vehicle so you can't
  typo an ID. This is the screen your team will use most for adding new
  popular routes as they come up.

All three reuse the public `GET` endpoints for listing (no auth needed to
read) and call the admin-protected `POST` endpoints to create, same
pattern as Drivers.

## Module 7 — WhatsApp Enquiry Integration

No WhatsApp Business API account needed — this works entirely off
`wa.me` deep links plus your own database, so it's fully functional today
and can be upgraded to a true API integration later without changing the
customer-facing behavior.

**If your database already exists**, run the new migration:

```bash
psql -U postgres -d tourist_taxi -f src/db/migrations/005_create_enquiries.sql
```

**New backend endpoints:**
- `POST /api/enquiries` — public, saves a lead (name, phone, optional
  message, and which page they were on)
- `GET /api/enquiries` — admin only, lists all captured leads

**New frontend pieces:**
- A floating 💬 button on every page (`components/EnquiryButton.js`,
  wired into `Layout.js`) — opens a small form, saves the lead via the API
  **and** opens a real WhatsApp chat with the message pre-filled
- `/admin/enquiries` — see every captured lead, with a one-click "Reply on
  WhatsApp" button per row
- The header's "WhatsApp Us" button and the enquiry widget now share one
  config: `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local`

**Set your real WhatsApp number:**
```
NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX
```
(country code + number, no `+` or spaces)

**Why save the lead before opening WhatsApp:** if a customer opens
WhatsApp but never actually hits send (closes the tab, changes their
mind), you'd otherwise lose that lead entirely. Saving it first means
your team can follow up either way.

**Upgrading to a real WhatsApp Business API later** (optional, once you
have that set up): the enquiry-saving logic in `enquiries.controller.js`
would stay the same — you'd just add a call to send the message
server-side via the API instead of (or alongside) the `wa.me` link, the
same "dormant until configured" pattern used for Razorpay in Module 4.

## Module 8 — Tour Packages

Multi-day itineraries (e.g. a 5-day Golden Triangle tour) are a distinct
product from the route-based bookings in Modules 1-2 — one fixed price
for the whole trip, a day-by-day plan, and inclusions/exclusions, rather
than a from/to fare calculation. Enquiries go through the WhatsApp widget
from Module 7 rather than the booking flow, since group size, exact dates,
and customization typically need a conversation first.

**If your database already exists**, run the new migration:

```bash
psql -U postgres -d tourist_taxi -f src/db/migrations/006_create_tour_packages.sql
```

**New backend endpoints:**
- `GET /api/tour-packages` — public, list of active packages (summary
  fields only)
- `GET /api/tour-packages/:slug` — public, full detail including the
  day-by-day itinerary
- `POST /api/tour-packages` — admin only. Creates the package and its
  itinerary days in a single database transaction, so a failure partway
  through never leaves a package with a partial itinerary.

**New public pages:**
- `/packages` — grid of all packages with duration and price
- `/packages/[slug]` — full detail: itinerary day-by-day, inclusions,
  exclusions, and an "Enquire on WhatsApp" button pre-filled with the
  package name

**New admin page:**
- `/admin/tour-packages` — a form with a dynamic itinerary builder (add/
  remove day rows freely), comma-separated inclusions/exclusions fields,
  and a list of existing packages

**Try it:** log into `/admin/tour-packages`, create a package (e.g. title
"Golden Triangle Tour", slug `golden-triangle-tour`, price `18000`, and a
few itinerary days), then visit `/packages` and `/packages/golden-triangle-tour`
on the public site to see it rendered.

## North India Launch Seed Data

A ready-to-run seed script covering 13 North India cities, all 3 vehicle
types, fixed pricing on 14 popular routes, distance data for 29 city pairs
(58 directional rows) to power the calculated-fare fallback, and 4 full
tour packages with day-by-day itineraries.

**Verified by actually running it** against a real Postgres instance
(not just written and assumed correct) — including the exact scenario of
re-running it against a database that already has your test data
(Delhi, Manali, Sedan) from earlier in this project. Confirmed:
idempotent (every insert checks first, so re-running is always safe),
no duplicate cities/vehicle types, existing fixed routes update cleanly
rather than erroring.

**Cities:** Delhi, Agra, Jaipur, Chandigarh, Shimla, Manali, Dharamshala,
Amritsar, Haridwar, Rishikesh, Dehradun, Mussoorie, Nainital

**Vehicle Types:** Sedan (₹12/km), SUV (₹17/km), Tempo Traveller (₹22/km)
— rates are a reasonable starting point based on typical North India
outstation pricing; adjust in `/admin/vehicle-types` once you know your
actual costs.

**Fixed Routes (14):** Delhi↔Agra, Delhi↔Jaipur, Agra↔Jaipur,
Delhi↔Manali (Sedan + SUV), Delhi↔Shimla, Chandigarh↔Manali,
Chandigarh↔Shimla, Delhi↔Amritsar, Delhi↔Haridwar, Delhi↔Rishikesh,
Delhi↔Nainital, Delhi↔Dharamshala

**Tour Packages (4):** Golden Triangle Tour (4 days), Shimla Manali
Himachal Trail (5 days), Haridwar Rishikesh Spiritual Getaway (3 days),
Amritsar Dharamshala Heritage Tour (4 days)

**Important:** distances are approximate standard highway distances (km)
— verify against your actual driver routes before relying on them for
pricing decisions, especially for hill routes where travel time matters
more than distance alone.

**Run it:**
```bash
cd backend
psql -U postgres -d tourist_taxi -f src/db/seeds/north_india_seed.sql
```

Safe to re-run any time — it won't create duplicates or overwrite data
you've since customized in ways that would break things (it only updates
`fixed_price`/`distance_km` on routes and `distance_km` on city pairs if
re-run with the same names).

## Admin Distances Screen (fixes the "no distance found" gap)

If a customer searches a route with no fixed price and no saved distance,
the fare engine correctly refuses to guess — but until now there was no
way to add a missing distance except raw SQL. Fixed:

**New backend endpoints** (both admin-only, since this is operational
data):
- `GET /api/city-distances` — list every saved distance pair
- `POST /api/city-distances` — add or update a distance. Optionally
  saves the reverse direction (`To → From`) in the same request, since
  road distance is normally the same either way but isn't forced to be.

**New admin page:** `/admin/distances` — pick From/To cities, enter the
distance, and save. If a customer ever hits a "no distance found" error
on the public site, this is where you fill the gap, no SQL needed.

**Seed data also expanded**: the seed script's distance table grew from
58 to 78 rows, adding plausible cross-region routes (e.g. Rishikesh ↔
Manali, Chandigarh ↔ Haridwar) that weren't covered before since they
cross between the Golden Triangle / Himachal / Uttarakhand clusters. If
you already ran the seed script once, just re-run it — it's still
idempotent — to pick up the new rows:

```bash
psql -U postgres -d tourist_taxi -f src/db/seeds/north_india_seed.sql
```

Re-verified end to end against a real Postgres instance after this
change, including confirming the Rishikesh → Manali pair specifically
resolves now.

## Custom Location Pricing (Mapbox), Built Dormant

Same "built dormant" pattern as Razorpay in Module 4 — you don't have a
Mapbox key yet (it also asks for a payment method), so this ships fully
working in code but inactive until a token is added. Verified end-to-end
against a real Postgres instance, including simulating a migration on top
of your actual existing booking data.

**What it adds:** customers can now type ANY pickup/drop location (not
just your 13 seeded cities) via a "Enter Custom Location" toggle next to
the city dropdowns. Distance comes from Mapbox's Directions API; the fare
is calculated using the same per-km rate config as everywhere else — no
fixed-route override is possible for custom locations since they aren't
in your routes table.

**If your database already exists**, run the new migration:

```bash
psql -U postgres -d tourist_taxi -f src/db/migrations/007_custom_locations.sql
```

This makes `from_city_id`/`to_city_id` optional and adds `from_address`,
`to_address`, `distance_km` columns, plus a database-level check
constraint requiring either a city pair or an address pair — verified by
directly trying to insert a booking with neither, which the database
correctly rejected.

**New backend endpoint:**
- `POST /api/fare/quote-custom` — public, body:
  `{ from_address, to_address, vehicle_type_id, trip_type, pickup_date, return_date }`.
  Returns the same shape as `/api/fare/quote` when Mapbox is configured,
  or `{ maps_enabled: false, message: "..." }` when it isn't — same
  graceful-degradation shape as the payments endpoint.

**Frontend:** the homepage search form now has a toggle — "Choose from
Cities" (unchanged) vs "Enter Custom Location" (two free-text fields).
The booking page detects which mode was used from the URL and calls the
right quote endpoint automatically. The admin bookings table shows
"Custom location" under the route for these bookings, since there's no
city name to display.

**To go live later**, once you're ready to add a payment method to
Mapbox:
1. Sign up at [mapbox.com](https://www.mapbox.com), grab your access
   token from Account → Tokens
2. Add it to `.env`: `MAPBOX_ACCESS_TOKEN=your_token_here`
3. Restart the server — no code changes needed, it activates
   automatically, exactly like Razorpay

**Testing it now (still in the dormant state):**
```bash
curl -X POST http://localhost:4000/api/fare/quote-custom \
  -H "Content-Type: application/json" \
  -d '{"from_address":"XYZ Resort, Manali","to_address":"ABC Homestay, Kasol","vehicle_type_id":1,"trip_type":"one_way","pickup_date":"2026-08-01"}'
```
You should get back the graceful "not available yet" message rather than
an error.

## Visual Design Overhaul

A full design pass on the frontend, grounded in the actual subject matter
(India's highway network) rather than generic travel-site or SaaS
defaults. Verified with a real `npm run build` (isolating the one step —
Google Fonts fetching — that only fails in my sandbox's restricted
network, not on a real machine or on Vercel).

**Design system:**
- **Color** — deep highway-signage green (`#1F4A38`) as primary, a muted
  brick-sandstone red (`#B14A2A`) as a sparing secondary, marigold-mustard
  (`#D9A234`) for calls to action, and a pale sage-stone background —
  deliberately not navy-SaaS-blue or the cream+terracotta combination that
  reads as AI-generated-by-default
- **Type** — three Google Fonts, each with a specific job: **Big Shoulders
  Display** (modeled on city/highway signage lettering) for headlines,
  **Public Sans** (built for civic/road-sign legibility) for body text,
  **IBM Plex Mono** for every fare, distance, and date — a deliberate
  "digital odometer" treatment for numeric data. Loaded via `next/font/google`
  for performance (self-hosted at build time, no render-blocking request).
- **Signature element** — a hand-drawn dashed "route line" (`RouteDivider.js`)
  that draws itself in on scroll, standing in for plain section dividers.
  It's not decorative — the product being sold is literally priced routes
  between places, so the line makes that visible.
- **Hero** — `RouteMapHero.js` replaces a generic banner image with an
  illustrated, animated map of a real seeded route (Delhi → Chandigarh →
  Shimla → Manali) drawing itself in on page load, with the actual 540 km
  distance shown as a milestone tag.
- **Landmark icons** — `LandmarkIcons.js` are hand-drawn line-art icons
  (Taj Mahal, a palace facade, hill-station mountains, a temple dome, river
  ghats, a monument gate) used on route/package cards instead of stock
  photography. This was a deliberate choice, not a shortcut: hotlinking
  photos found via search would mean embedding third-party-hosted images
  with no license clearance into your commercial site — a real risk. The
  line-art also ties visually back to the route-line signature.
- **Motion** — Framer Motion powers one orchestrated hero sequence (route
  drawing in, waypoints appearing in order) plus restrained scroll-reveals
  on cards and the process section. `prefers-reduced-motion` is respected
  globally.
- **"How It Works"** — now genuinely justified as a numbered sequence
  (search → book → travel really is an ordered process), styled as
  kilometer-stone markers rather than generic numbered cards.
- **New homepage section**: Tour Packages are now featured on the
  homepage itself (previously only reachable via the nav), each package
  displayed on the homepage now.

**What changed under the hood:**
- All color CSS variables were renamed from `--color-navy`/`--color-gold`
  to `--color-primary`/`--color-accent` (an AI-tell-adjacent name for what
  is now a green, cleaned up project-wide)
- `framer-motion` added as a dependency
- Fixed a leftover `routemitra.example` placeholder email in the footer
  from before the Roaming Route rebrand

## Applying This Update

This pass touched nearly every frontend file, so it's packaged as a full
replacement of the `frontend/` folder rather than a file-by-file delta.

1. **Back up your `.env.local`** (or just note its contents) — it's inside
   `frontend/`, so don't lose it.
2. Delete your existing `frontend/` folder entirely, replace it with the
   one from `frontend-design-overhaul.zip`.
3. Restore your `.env.local` (or recreate it from `.env.local.example`).
4. `npm install` (pulls in `framer-motion`)
5. `npm run dev`

Since font loading happens at build time and needs internet access (which
my sandbox doesn't have but your machine does), this is one part you'll
be verifying for the first time — if `npm run build` or `npm run dev`
throws a font-fetch error, it very likely means your machine itself is
offline or behind a restrictive proxy at that moment; retry once you have
a normal connection.

## Find Us Section — Map, Reviews, Instagram

Three things, each handled the right way for what it needs:

- **Google Maps embed** — works today, zero setup. Just a URL query, no
  API key. Set your real address in `NEXT_PUBLIC_GOOGLE_MAPS_QUERY`.
- **Instagram follow button** — works today, just a link. Set your real
  profile in `NEXT_PUBLIC_INSTAGRAM_URL`. (An embedded live feed would
  need a paid third-party service in 2026 — a well-designed link-out is
  the better trade for now.)
- **Google Reviews** — built dormant, same pattern as Razorpay (Module 4)
  and Mapbox (custom locations). Inline star ratings and review snippets
  need the Google Places API, which requires a billing-enabled Google
  Cloud project. Until that's connected, the site shows an honest empty
  state (no fabricated testimonials) plus a **"Read Reviews on Google"**
  button that works immediately via `NEXT_PUBLIC_GOOGLE_REVIEWS_URL`.

**To go live with inline reviews later:**
1. Set up a Google Cloud project, enable the Places API, enable billing
2. Find your Place ID: search your business at
   [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
3. Add to `backend/.env`: `GOOGLE_PLACES_API_KEY=...` and `GOOGLE_PLACE_ID=...`
4. Restart the backend — activates automatically, no code changes

**New backend endpoint:** `GET /api/reviews` — public, returns
`{ reviews_enabled: false, message }` when not configured, or
`{ reviews_enabled: true, rating, total_ratings, reviews }` once it is.

## Images — Tour Packages, Homepage Showcase

Full guide at `IMAGES.md` in the project root. Short version: images live
locally in `frontend/public/images/` (served by Vercel's own CDN — no
separate image-hosting account needed), sourced from Unsplash/Pexels
(genuinely free for commercial use), never hotlinked from search results
(that's someone else's hosted content with no license clearance).

- **Tour packages**: add a photo to `frontend/public/images/packages/`,
  reference it via the existing **Cover Image URL** field in
  `/admin/tour-packages` as `/images/packages/your-file.jpg`. Shows an
  on-brand placeholder graphic until you do.
- **Homepage photo showcase**: save a photo as exactly
  `frontend/public/images/hero/showcase.jpg` — no admin step needed, it's
  a single fixed section. Shows an on-brand gradient placeholder until
  the file exists.
- **The illustrated hero** (`RouteMapHero.js`) is separate — hand-drawn
  SVG, not a photo, per the "keep the illustration, add a photo section
  elsewhere" decision.

## Next Step

Every module from the original roadmap is now built. From here, natural
next steps are: deploying this to a real server (currently everything
assumes `localhost`), further design/content polish, or adding real data
for your actual routes, drivers, and packages before going live.
