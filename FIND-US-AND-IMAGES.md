# Find Us Section, Reviews, Instagram & Package Images

## What's new

1. **Google Maps embed** on the homepage — works today, no API key needed
2. **Google Reviews** — built dormant like Razorpay/Mapbox; shows a
   "Read Reviews on Google" link button today, upgrades to live star
   ratings + review snippets once you add API credentials
3. **Instagram** — a follow link/button on the homepage
4. **Destinations photo section** — a new homepage section, separate from
   the hero, that only shows photos you've actually added
5. **Tour package cover images** — package cards and detail pages now
   display `cover_image_url` (already existed in your database from
   Module 8, just wasn't shown anywhere until now)

## Where every file goes

**Backend:**

| File | Destination |
|---|---|
| `backend/src/config/googlePlaces.config.js` | same path (new) |
| `backend/src/modules/reviews/` (3 files) | same path (new) |
| `backend/.env.example` | replace |

**Frontend:**

| File | Destination |
|---|---|
| `frontend/next.config.js` | replace |
| `frontend/.env.local.example` | replace |
| `frontend/components/FindUsSection.js` | new |
| `frontend/components/DestinationsSection.js` | new |
| `frontend/lib/destinationImages.js` | new |
| `frontend/pages/index.js` | replace |
| `frontend/pages/packages/index.js` | replace |
| `frontend/pages/packages/[slug].js` | replace |
| `frontend/public/images/packages/README.md` | new |
| `frontend/public/images/destinations/README.md` | new |

## One manual edit needed: `backend/src/app.js`

I can't safely auto-replace your whole `app.js` (I don't have your exact
current version to diff against), so add these two lines by hand —
they follow the exact same pattern as every other module:

Near your other route imports at the top:
```javascript
const reviewsRoutes = require('./modules/reviews/reviews.routes');
```

Near your other `app.use(...)` route registrations:
```javascript
app.use('/api/reviews', reviewsRoutes);
```

That's it — drop these in wherever the other `require`/`app.use` pairs
for your existing modules (cities, bookings, drivers, etc.) already live.

## Setting it up

### 1. Google Maps (works immediately, no account needed)
In `frontend/.env.local`:
```
NEXT_PUBLIC_BUSINESS_ADDRESS=Your full business address here
```

### 2. Google Reviews — quick version (works immediately)
Get your Google Business Profile share link (search your business on
Google Maps → Share → Copy link), then in `frontend/.env.local`:
```
NEXT_PUBLIC_GOOGLE_REVIEWS_URL=https://your-copied-link
```
This shows a "Read Reviews on Google" button right away.

### 3. Google Reviews — live version (needs a Google Cloud billing account)
Same tradeoff as Mapbox — Google requires billing enabled even though
there's a free usage tier. When you're ready:
1. [console.cloud.google.com](https://console.cloud.google.com) → create/select
   a project → enable **Places API** → set up billing
2. Create an API key under **APIs & Services → Credentials**
3. Find your Place ID at
   [developers.google.com/maps/documentation/places/web-service/place-id](https://developers.google.com/maps/documentation/places/web-service/place-id)
   (search your business name)
4. In `backend/.env`:
   ```
   GOOGLE_PLACES_API_KEY=your_key
   GOOGLE_PLACE_ID=your_place_id
   ```
5. Restart the backend — live star ratings and review snippets activate
   automatically, no code changes needed

### 4. Instagram (works immediately)
In `frontend/.env.local`:
```
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/your_handle
```

### 5. Images — the workflow, explained

**Storage decision:** images live in `frontend/public/`, deployed via
Vercel's own CDN — no separate image hosting service (Cloudinary, S3,
etc.) needed. You already have this infrastructure through your existing
Vercel deployment.

**For tour packages:** see `frontend/public/images/packages/README.md`
— short version: download a free-license photo from Unsplash/Pexels,
save it into that folder, reference it as `/images/packages/filename.jpg`
in the admin panel's Cover Image URL field.

**For the homepage Destinations section:** see
`frontend/public/images/destinations/README.md` — save photos using
specific filenames (`delhi.jpg`, `manali.jpg`, etc.) and the section
automatically shows whichever ones exist. Add none, and it shows a
placeholder instead of anything broken.

## Testing locally before deploying

Everything not yet configured shows a clean placeholder rather than an
error — you can run this right now with zero setup and see the dormant
states, then fill in each piece as you get the real details.
