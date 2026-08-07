import fs from 'fs';
import path from 'path';

// Only used inside getServerSideProps — Next.js strips this out of the
// client bundle automatically since `fs` never appears in component code,
// only in server-side data-fetching functions.

const DESTINATIONS = [
  { slug: 'delhi', label: 'Delhi' },
  { slug: 'agra', label: 'Agra' },
  { slug: 'jaipur', label: 'Jaipur' },
  { slug: 'manali', label: 'Manali' },
  { slug: 'shimla', label: 'Shimla' },
  { slug: 'amritsar', label: 'Amritsar' },
  { slug: 'dharamshala', label: 'Dharamshala' },
  { slug: 'haridwar-rishikesh', label: 'Haridwar & Rishikesh' },
];

const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/**
 * Checks public/images/destinations/ for each expected filename and only
 * returns the ones that actually exist — so the homepage gracefully shows
 * nothing (or a placeholder) instead of broken image icons until photos
 * are added.
 */
export function getAvailableDestinationImages() {
  const dir = path.join(process.cwd(), 'public', 'images', 'destinations');
  const found = [];

  for (const dest of DESTINATIONS) {
    for (const ext of EXTENSIONS) {
      const filePath = path.join(dir, `${dest.slug}.${ext}`);
      if (fs.existsSync(filePath)) {
        found.push({ ...dest, src: `/images/destinations/${dest.slug}.${ext}` });
        break;
      }
    }
  }

  return found;
}
