# Images Guide — Roaming Route

## The strategy: local files, served by Vercel's CDN

All images live inside `frontend/public/images/` and are referenced with
a simple path like `/images/packages/golden-triangle.jpg`. No third-party
image host, no API key, no monthly cost.

**Why this instead of a CDN service like Cloudinary?** Vercel already
serves everything in `public/` through its own global CDN automatically
— that's what "static hosting" means. Adding a separate image CDN service
on top would be extra complexity and often extra cost, for a benefit
you're already getting for free at this scale. If the site's traffic ever
gets large enough that on-the-fly image resizing/optimization becomes
worth it, revisit this with `next/image` + a paid image service — not
needed today.

## Folder structure

```
frontend/public/images/
├── packages/     ← one photo per tour package
└── hero/         ← the homepage photo showcase section
```

## Finding copyright-free photos

Use **[unsplash.com](https://unsplash.com)** or **[pexels.com](https://pexels.com)**
— both are free for commercial use, no attribution legally required
(though appreciated if you want to credit the photographer).

**Do not** right-click-save images from Google Image Search results, blog
posts, or other travel sites — those belong to someone else and using
them without a license is a real legal risk for a commercial site.

## Adding a tour package image

1. Find a photo on Unsplash/Pexels matching the package (e.g. search
   "Taj Mahal" for the Golden Triangle Tour)
2. Download it (a width around 1600px is plenty — no need for anything
   larger, it'll just slow down page loads)
3. Rename it something clear, e.g. `golden-triangle-tour.jpg`
4. Place it in `frontend/public/images/packages/`
5. In `/admin/tour-packages`, set the package's **Cover Image URL** field to:
   ```
   /images/packages/golden-triangle-tour.jpg
   ```
6. Save — the image now appears on the homepage package cards, the
   `/packages` listing, and the package's own detail page

**Until you add a real photo**, packages show an on-brand placeholder
graphic (a route-line motif, not a broken-image icon) — nothing looks
unfinished in the meantime.

## Adding the homepage photo showcase

1. Find/prepare one strong wide photo (ideally 1920×1080 or similar,
   landscape orientation — a mountain road, a hill station, whatever best
   represents the brand)
2. Save it as exactly: `frontend/public/images/hero/showcase.jpg`
   (the filename matters — the component looks for this exact path)
3. That's it — no admin panel step needed for this one, since it's a
   single fixed section rather than per-record data

**Until you add this file**, the section shows an on-brand gradient
placeholder instead of a broken image.

## A note on the illustrated hero

The animated route-map illustration at the very top of the homepage
(`RouteMapHero.js`) is intentionally NOT a photo — it's hand-drawn SVG,
part of the site's visual signature. That one doesn't need an image file;
it's real code, not a placeholder.
