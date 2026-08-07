# Security Hardening & SEO — What Changed and Why

Everything below was written, then actually booted and tested against a
real Postgres instance and a real HTTP server in my sandbox — not just
reviewed by eye. Specific test results are noted per item.

## ⚠️ The most important fix: an IDOR vulnerability

**What it was:** `GET /api/bookings/:id` was public with no authentication.
Booking IDs are sequential integers (1, 2, 3...), so anyone could iterate
through them and read every customer's name, phone number, email, and
fare — no login needed. This has existed since Module 2.

**The fix:** that route now requires admin authentication, exactly like
the booking list endpoint already did. **Verified live**: a request to
`/api/bookings/1` without a token now returns `401`, where it previously
returned the full booking record.

This wasn't actively exploited by your own frontend (the booking
confirmation screen renders directly from the creation response, it never
re-fetches by ID), so closing it has zero effect on how your site works
today — it just closes a door that was standing open.

## Backend security changes

| Protection | What it does | Verified how |
|---|---|---|
| **Helmet** | Sets ~10 standard security headers (blocks MIME-sniffing, clickjacking via frames, hides the framework fingerprint, forces HTTPS via HSTS, etc.) | Booted the server, confirmed headers present via `curl -I` |
| **Rate limiting (general)** | 300 requests/15min per IP across the whole API | Confirmed `RateLimit-*` headers present on live responses |
| **Rate limiting (login)** | 10 attempts/15min — the classic brute-force target | Sent 12 rapid wrong-password attempts: first 10 got `401`, 11th and 12th got `429` |
| **Rate limiting (bookings)** | 20 booking creations/10min per IP | Prevents spam bookings / fare-engine hammering |
| **CORS restriction** | Only your real frontend URL(s) can call the API in production, via `FRONTEND_URL` | Falls back to permissive only when unset, for local dev |
| **JWT secret validation** | Server refuses to start if `JWT_SECRET` is missing or still the placeholder value | Confirmed: server crashed immediately with the placeholder, ran fine with a real secret |
| **Login timing-attack mitigation** | Runs a dummy password check even for non-existent emails, so response time can't reveal which emails have accounts | Code-level fix, standard practice |
| **Request body size limit** | JSON bodies capped at 200KB (webhook body at 100KB) | Blocks a trivial DoS vector |
| **Centralized error handler** | Any unhandled error returns a generic message, never a raw stack trace | Prevents accidental internal detail leaks |
| **`trust proxy` setting** | Correctly reads the real client IP behind Render's reverse proxy | Needed for rate limiting to work correctly in production |

**Already safe, confirmed by re-reading the code (no changes needed):**
- Every database query in the app uses parameterized queries (`$1`, `$2`,
  ...) — no SQL injection surface anywhere
- Every insert destructures specific expected fields from `req.body`
  rather than spreading the whole object — no mass-assignment risk
- Passwords are hashed with bcrypt, never stored or logged in plaintext
- The Razorpay webhook already verifies an HMAC signature against the raw
  request body — already correctly resistant to forged payment
  confirmations
- No file upload feature exists, so there's no upload-based attack surface
- Auth uses bearer tokens (not cookies), so CSRF — which specifically
  exploits ambient cookie credentials — doesn't apply here

**A known tradeoff, not fixed this round:** the admin JWT is stored in
`localStorage`, which is vulnerable to theft *if* an XSS vulnerability
existed elsewhere in the app. There currently isn't one (React escapes
all rendered content by default, and nothing in this codebase uses
`dangerouslySetInnerHTML` except the JSON-LD script tags, which only ever
receive code-generated data, never raw user input). Moving to httpOnly
cookies would remove this residual risk entirely but requires a real
backend session/CSRF-token redesign — worth doing before this handles
large transaction volumes, not urgent today.

## Where every backend file goes

| File | Destination |
|---|---|
| `backend/package.json` | replace (adds `helmet`, `express-rate-limit`) |
| `backend/src/app.js` | replace |
| `backend/src/middleware/rateLimit.js` | new |
| `backend/src/modules/auth/auth.service.js` | replace |
| `backend/src/modules/auth/auth.controller.js` | replace |
| `backend/src/modules/auth/auth.routes.js` | replace |
| `backend/src/modules/bookings/bookings.routes.js` | replace |
| `backend/.env.example` | replace |

**After applying:** run `npm install` (two new packages), set a real
`FRONTEND_URL` in your `.env` on Render, and redeploy.

## SEO changes

| Addition | What it does |
|---|---|
| **`/robots.txt`** (dynamic) | Allows crawling of public pages, blocks `/admin` and `/booking`, points to your sitemap |
| **`/sitemap.xml`** (dynamic) | Auto-lists every static page, every fixed route (`/taxi/...`), and every tour package (`/packages/...`) — pulled live from your database, so it never goes stale |
| **Open Graph + Twitter Card tags** | Every page now generates proper preview cards when shared on WhatsApp, Facebook, Twitter/X, LinkedIn |
| **Canonical URLs** | Every page declares its canonical URL, preventing duplicate-content issues |
| **JSON-LD structured data** | Homepage gets a `TaxiService` schema (with live review ratings once Google Reviews is connected); each route page gets a `Service`/`Offer` schema with its actual price; each package page gets a `TouristTrip` schema with its itinerary — this is what lets Google show rich results (price, rating) directly in search listings |
| **`noindex` on admin** | Two layers: `robots.txt` disallows `/admin`, and every admin page also carries a `noindex` meta tag as backup (robots.txt is only a polite request; the meta tag is enforced even if a crawler ignores it or a page gets linked from elsewhere) |

**Verified live** (booted the built site and checked the actual HTML):
JSON-LD renders correctly in the page source, Open Graph tags are
present, canonical URLs are correct, and both `/robots.txt` and
`/sitemap.xml` serve valid output — including gracefully falling back to
just the static pages if the API is briefly unreachable, rather than
crashing.

## Where every frontend file goes

| File | Destination |
|---|---|
| `frontend/pages/robots.txt.js` | new — **delete** any existing `frontend/public/robots.txt` first, or the static file will take precedence over this dynamic one |
| `frontend/pages/sitemap.xml.js` | new |
| `frontend/components/Layout.js` | replace |
| `frontend/components/admin/AdminLayout.js` | replace |
| `frontend/pages/index.js` | replace |
| `frontend/pages/taxi/[slug].js` | replace |
| `frontend/pages/packages/[slug].js` | replace |
| `frontend/.env.local.example` | replace |

## One image you still need to add: `og-default.jpg`

`Layout.js` references `/og-default.jpg` as the fallback share-preview
image for any page without its own (tour packages use their cover photo
instead). Add a 1200×630px image at `frontend/public/og-default.jpg` —
your logo on the highway-green background works well. Same
copyright-free sourcing rules apply as the other image guides in this
project (`frontend/public/images/packages/README.md`).

## Setting the two new required env vars

**`frontend/.env.local`:**
```
NEXT_PUBLIC_SITE_URL=https://your-real-domain.com
```

**Render (backend) environment variables:**
```
FRONTEND_URL=https://your-real-domain.com
```

Both need your actual live Vercel/custom domain — the sitemap, robots.txt,
canonical URLs, Open Graph tags, and CORS restriction all depend on this
being correct.

## Recommended (not code — things to do yourself)

- Run `npm audit` in both `backend/` and `frontend/` periodically, and
  after adding any new dependency
- Confirm `.env` and `.env.local` are in your `.gitignore` (they should
  already be, but worth double-checking — never commit real secrets)
- Once you have real traffic, consider Render/Vercel's built-in DDoS
  protections and logging/monitoring add-ons
- After deploying, submit your sitemap URL to Google Search Console —
  this is what actually gets your pages crawled and indexed quickly
  rather than waiting for organic discovery
