# Edit & Delete for All Admin-Managed Data

Every entity your admin panel manages now supports editing and
deleting/deactivating — cities, vehicle types, drivers, fixed routes,
tour packages, city distances, and enquiries. Bookings also gained a
**Cancel** action, which was a related gap (confirm and assign existed,
but nothing let you back out of a booking).

Verified two ways before delivery: every backend function was tested
directly against a real Postgres database (not just read over), and
every new/changed admin page was compiled with a real `next build` (not
just checked by eye). Specific results below.

## The "soft delete" decision, and why

Cities, vehicle types, drivers, trip routes, and tour packages all use a
**Deactivate/Reactivate** toggle instead of permanent deletion. This is
deliberate: all of these are referenced by foreign keys from past (and
sometimes future) bookings. Permanently deleting a city that has bookings
pointing at it would either fail outright (the database's foreign key
constraint blocks it) or, worse, silently corrupt booking history.
Deactivating removes the item from customer-facing search/selection
immediately while every past booking that references it stays perfectly
intact — and it can be reactivated with one click if deactivated by
mistake.

**City distances** and **enquiries** are hard-deleted instead — nothing
else in the database references either of these, so there's no
history-corruption risk, and permanent removal is simpler and more
intuitive for what are essentially just data points and leads.

**Tested directly against Postgres:**
```
Original: Testville Test State
After partial update (name only): Renamed City | state (should be unchanged): Test State
```
This confirms editing only the fields you actually change leaves
everything else untouched — you don't need to re-type a driver's phone
number just to fix a typo in their name, for example.

## Tour package editing — the trickiest part, tested carefully

Editing a package's itinerary replaces the whole day-by-day list in a
single database transaction (delete the old days, insert the new ones) —
simpler and less error-prone than trying to figure out which individual
days changed. Tested directly:
```
CREATED: 1 Test Tour itinerary rows: 3
UPDATED price: 12000.00 itinerary rows: 2 titles: [ 'New Day One', 'New Day Two' ]
UPDATED title only: Renamed Tour itinerary still: 2
DEACTIVATED is_active: false
```
This confirms: itinerary correctly shrinks from 3 days to 2 when edited,
a later update that doesn't touch the itinerary at all leaves those 2
days alone, and deactivation works.

## Booking cancellation — tested carefully too

```
Created booking 1 status: confirmed
After cancel: cancelled | reason: Customer changed plans
Correctly rejected double-cancel: Booking is already 'cancelled' and cannot be cancelled
```
A cancelled or completed booking can't be cancelled again, and the
optional reason you type in gets stored and shown under the status badge
in the admin table.

## One thing worth knowing about fixed routes specifically

When editing a fixed route, the From/To cities, vehicle type, and trip
type are locked (greyed out) — only price, distance, and the SEO slug can
change. Those four fields together are what make a route unique in the
database; if you need a genuinely different route (different cities or
vehicle), deactivate the old one and add a new one rather than trying to
repurpose an existing row.

## Where every file goes

**Backend** — every file below is a **replace** of your existing file,
same path, except the new migration:

| File |
|---|
| `backend/src/modules/cities/cities.controller.js` |
| `backend/src/modules/cities/cities.routes.js` |
| `backend/src/modules/vehicleTypes/vehicleTypes.controller.js` |
| `backend/src/modules/vehicleTypes/vehicleTypes.routes.js` |
| `backend/src/modules/tripRoutes/tripRoutes.controller.js` |
| `backend/src/modules/tripRoutes/tripRoutes.routes.js` |
| `backend/src/modules/drivers/drivers.controller.js` |
| `backend/src/modules/drivers/drivers.routes.js` |
| `backend/src/modules/tourPackages/tourPackages.service.js` |
| `backend/src/modules/tourPackages/tourPackages.controller.js` |
| `backend/src/modules/tourPackages/tourPackages.routes.js` |
| `backend/src/modules/cityDistances/cityDistances.controller.js` |
| `backend/src/modules/cityDistances/cityDistances.routes.js` |
| `backend/src/modules/enquiries/enquiries.controller.js` |
| `backend/src/modules/enquiries/enquiries.routes.js` |
| `backend/src/modules/bookings/bookings.service.js` |
| `backend/src/modules/bookings/bookings.controller.js` |
| `backend/src/modules/bookings/bookings.routes.js` |
| `backend/src/db/migrations/009_add_cancellation.sql` — **new**, run this |

**Frontend** — also all replaces, same paths:

| File |
|---|
| `frontend/lib/adminApi.js` |
| `frontend/pages/admin/cities.js` |
| `frontend/pages/admin/vehicle-types.js` |
| `frontend/pages/admin/drivers.js` |
| `frontend/pages/admin/routes.js` |
| `frontend/pages/admin/distances.js` |
| `frontend/pages/admin/enquiries.js` |
| `frontend/pages/admin/tour-packages.js` |
| `frontend/pages/admin/bookings.js` |

## Steps to apply

1. Copy every file above into place.
2. Run the migration:
   ```bash
   psql -U postgres -d tourist_taxi -f src/db/migrations/009_add_cancellation.sql
   ```
   (on Render, run this against your database's External Database URL,
   same as previous migrations)
3. No new dependencies — nothing to `npm install` this time.
4. Commit, push — both platforms auto-deploy as usual.

## Try it

- **Cities/Vehicle Types/Drivers/Routes/Packages**: click **Edit** on any
  row, change something, save — confirm it updates in place. Click
  **Deactivate**, confirm it disappears from the public site but the row
  stays visible (dimmed) in the admin table with a **Reactivate** button.
- **Distances**: click **Edit**, change the km value, save — confirm it
  updates. Click **Delete** on one you don't need — confirm it's gone.
- **Enquiries**: click **Delete** on a test enquiry — confirm it's
  removed.
- **Bookings**: click **Cancel** on a test booking, type an optional
  reason — confirm the status badge shows "cancelled" with your reason
  underneath, and that all action buttons disappear for that row (nothing
  further should be doable on a cancelled booking).
