# Tour Package Images

## How to add a photo for a tour package

1. Find a copyright-free photo:
   - [unsplash.com](https://unsplash.com) or [pexels.com](https://pexels.com) —
     both are free for commercial use, no attribution legally required
   - Search for your destination (e.g. "Taj Mahal", "Manali mountains")
   - Download a reasonably wide version (~1600px)

2. Save the file into this folder (`frontend/public/images/packages/`),
   e.g. `golden-triangle.jpg`

3. In the admin panel, go to **Tour Packages** and set the **Cover Image
   URL** field to:
   ```
   /images/packages/golden-triangle.jpg
   ```
   (note the leading `/` — this is a site-relative path, not a full URL)

4. Commit the image file along with your code and push — it deploys
   automatically through Vercel's CDN, same as everything else in
   `public/`.

## Why local files instead of a URL from search results

Photos found via a search engine are hosted by whoever's site they came
from — embedding them directly means relying on someone else's server
staying up, and on rights you don't actually have clearance for. Unsplash
and Pexels photos are explicitly licensed for exactly this kind of use
and become part of your own project once downloaded, so nothing can break
or get taken down later.

## Alternative: pasting an external URL directly

If you'd rather not download files, you can also paste a direct Unsplash
or Pexels image URL straight into the Cover Image URL field (their CDN
domains are already whitelisted in `next.config.js`). The tradeoff:
you're depending on that URL staying valid, and any changes to Unsplash's
CDN structure over time could break it. Local files are the more durable
choice for a long-lived business site.
