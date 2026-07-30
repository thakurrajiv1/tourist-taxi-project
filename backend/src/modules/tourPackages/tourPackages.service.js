const pool = require('../../config/db');

async function getAllPackages() {
  const result = await pool.query(
    `SELECT id, title, slug, description, duration_days, price, cover_image_url
     FROM tour_packages
     WHERE is_active = true
     ORDER BY created_at DESC`
  );
  return result.rows;
}

async function getPackageBySlug(slug) {
  const packageResult = await pool.query(
    `SELECT * FROM tour_packages WHERE slug = $1 AND is_active = true`,
    [slug]
  );

  if (packageResult.rows.length === 0) {
    return null;
  }

  const pkg = packageResult.rows[0];
  const itineraryResult = await pool.query(
    `SELECT day_number, title, description
     FROM tour_package_itinerary
     WHERE package_id = $1
     ORDER BY day_number ASC`,
    [pkg.id]
  );

  return { ...pkg, itinerary: itineraryResult.rows };
}

/**
 * Creates a package and its full day-by-day itinerary in a single
 * transaction — if any itinerary row fails to insert, the whole package
 * creation rolls back rather than leaving a package with a partial
 * itinerary.
 */
async function createPackage(payload) {
  const {
    title,
    slug,
    description,
    duration_days,
    price,
    cover_image_url,
    inclusions,
    exclusions,
    itinerary,
  } = payload;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pkgResult = await client.query(
      `INSERT INTO tour_packages
        (title, slug, description, duration_days, price, cover_image_url, inclusions, exclusions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        slug,
        description || null,
        duration_days,
        price,
        cover_image_url || null,
        inclusions && inclusions.length > 0 ? inclusions : null,
        exclusions && exclusions.length > 0 ? exclusions : null,
      ]
    );
    const pkg = pkgResult.rows[0];

    const days = Array.isArray(itinerary) ? itinerary : [];
    for (const day of days) {
      await client.query(
        `INSERT INTO tour_package_itinerary (package_id, day_number, title, description)
         VALUES ($1, $2, $3, $4)`,
        [pkg.id, day.day_number, day.title || null, day.description || null]
      );
    }

    await client.query('COMMIT');
    return { ...pkg, itinerary: days };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getAllPackages, getPackageBySlug, createPackage };
