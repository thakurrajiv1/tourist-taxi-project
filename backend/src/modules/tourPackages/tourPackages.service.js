const pool = require('../../config/db');

async function getAllPackages() {
  const result = await pool.query(
    `SELECT id, title, slug, description, duration_days, price, cover_image_url
     FROM tour_packages WHERE is_active = true ORDER BY created_at DESC`
  );
  return result.rows;
}

async function getAllPackagesAdmin() {
  const result = await pool.query(
    `SELECT * FROM tour_packages ORDER BY created_at DESC`
  );
  return result.rows;
}

async function getPackageBySlug(slug) {
  const packageResult = await pool.query(`SELECT * FROM tour_packages WHERE slug = $1 AND is_active = true`, [slug]);
  if (packageResult.rows.length === 0) return null;
  const pkg = packageResult.rows[0];
  const itineraryResult = await pool.query(
    `SELECT day_number, title, description FROM tour_package_itinerary WHERE package_id = $1 ORDER BY day_number ASC`,
    [pkg.id]
  );
  return { ...pkg, itinerary: itineraryResult.rows };
}

async function getPackageByIdAdmin(id) {
  const packageResult = await pool.query(`SELECT * FROM tour_packages WHERE id = $1`, [id]);
  if (packageResult.rows.length === 0) return null;
  const pkg = packageResult.rows[0];
  const itineraryResult = await pool.query(
    `SELECT day_number, title, description FROM tour_package_itinerary WHERE package_id = $1 ORDER BY day_number ASC`,
    [pkg.id]
  );
  return { ...pkg, itinerary: itineraryResult.rows };
}

async function createPackage(payload) {
  const { title, slug, description, duration_days, price, cover_image_url, inclusions, exclusions, itinerary } = payload;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pkgResult = await client.query(
      `INSERT INTO tour_packages (title, slug, description, duration_days, price, cover_image_url, inclusions, exclusions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, slug, description || null, duration_days, price, cover_image_url || null,
       inclusions && inclusions.length > 0 ? inclusions : null, exclusions && exclusions.length > 0 ? exclusions : null]
    );
    const pkg = pkgResult.rows[0];
    const days = Array.isArray(itinerary) ? itinerary : [];
    for (const day of days) {
      await client.query(
        `INSERT INTO tour_package_itinerary (package_id, day_number, title, description) VALUES ($1, $2, $3, $4)`,
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

/**
 * Updates a package's fields and, if a new itinerary array is provided,
 * replaces the entire itinerary (delete-then-reinsert) in the same
 * transaction. This is simpler and less error-prone than trying to diff
 * old vs new day rows, and itineraries are short enough (a handful of
 * rows) that this is cheap.
 */
async function updatePackage(id, payload) {
  const { title, slug, description, duration_days, price, cover_image_url, inclusions, exclusions, itinerary, is_active } = payload;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pkgResult = await client.query(
      `UPDATE tour_packages SET
         title = COALESCE($1, title),
         slug = COALESCE($2, slug),
         description = COALESCE($3, description),
         duration_days = COALESCE($4, duration_days),
         price = COALESCE($5, price),
         cover_image_url = COALESCE($6, cover_image_url),
         inclusions = COALESCE($7, inclusions),
         exclusions = COALESCE($8, exclusions),
         is_active = COALESCE($9, is_active)
       WHERE id = $10
       RETURNING *`,
      [
        title ?? null, slug ?? null, description ?? null, duration_days ?? null, price ?? null,
        cover_image_url ?? null,
        inclusions && inclusions.length > 0 ? inclusions : null,
        exclusions && exclusions.length > 0 ? exclusions : null,
        is_active ?? null,
        id,
      ]
    );

    if (pkgResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    if (Array.isArray(itinerary)) {
      await client.query(`DELETE FROM tour_package_itinerary WHERE package_id = $1`, [id]);
      for (const day of itinerary) {
        await client.query(
          `INSERT INTO tour_package_itinerary (package_id, day_number, title, description) VALUES ($1, $2, $3, $4)`,
          [id, day.day_number, day.title || null, day.description || null]
        );
      }
    }

    await client.query('COMMIT');
    return await getPackageByIdAdmin(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deactivatePackage(id) {
  const result = await pool.query(
    `UPDATE tour_packages SET is_active = false WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = {
  getAllPackages,
  getAllPackagesAdmin,
  getPackageBySlug,
  getPackageByIdAdmin,
  createPackage,
  updatePackage,
  deactivatePackage,
};
