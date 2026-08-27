# Email Header Banner Image

Every booking email uses this image as its header banner (600px wide,
displays at roughly 600×200px — a wide, short banner works best).

## Add your image

1. Source a copyright-free photo — same approach as the site's other
   images: [unsplash.com](https://unsplash.com) or
   [pexels.com](https://pexels.com), both free for commercial use
2. Good subject matter: a scenic North India road/mountain shot (e.g. a
   Himachal mountain road, or a collage-style composition of your key
   destinations), OR simply your logo on the brand-green background if
   you'd rather keep it simple and on-brand
3. Recommended size: 1200×400px (renders at 600×200 in most inboxes,
   double resolution keeps it crisp on high-DPI phone screens)
4. Save it as: `frontend/public/images/email/header.jpg`

## Why this file, specifically

The email templates reference `${SITE_URL}/images/email/header.jpg` —
that's your own live site's URL, not an attachment. This means:
- The image loads from your own domain (better deliverability — some
  spam filters penalize emails with only attached/embedded images)
- You can update it anytime by replacing the file and redeploying, with
  no need to touch the email code or resend anything
- No email attachment size bloat

## Important: this requires `NEXT_PUBLIC_SITE_URL` to be set correctly

The backend builds this image URL using the same `NEXT_PUBLIC_SITE_URL`
(or `SITE_URL`) environment variable used for your sitemap and canonical
URLs. If that's not set to your real domain, emails will reference a
broken image path. Double-check it's set on **both** Vercel (frontend)
and Render (backend) to your actual live domain, e.g.
`https://roamingroute.in`.

## Testing

Until you add this file, emails will still send correctly — the banner
area will just show a broken-image icon in the recipient's inbox rather
than blocking anything. Add the real image whenever you're ready; no
code changes needed afterward.
