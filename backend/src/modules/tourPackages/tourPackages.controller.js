const { getAllPackages, getPackageBySlug, createPackage } = require('./tourPackages.service');

async function listPackages(req, res) {
  try {
    const packages = await getAllPackages();
    res.json(packages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tour packages' });
  }
}

async function getPackage(req, res) {
  try {
    const pkg = await getPackageBySlug(req.params.slug);
    if (!pkg) {
      return res.status(404).json({ error: 'Tour package not found' });
    }
    res.json(pkg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tour package' });
  }
}

async function postPackage(req, res) {
  const { title, slug, duration_days, price, itinerary } = req.body;

  if (!title || !slug || !duration_days || !price) {
    return res
      .status(400)
      .json({ error: 'title, slug, duration_days, and price are required' });
  }
  if (!Array.isArray(itinerary) || itinerary.length === 0) {
    return res.status(400).json({
      error: 'itinerary must be a non-empty array of { day_number, title, description }',
    });
  }

  try {
    const pkg = await createPackage(req.body);
    res.status(201).json(pkg);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      // Postgres unique_violation — almost certainly the slug
      return res.status(409).json({ error: 'A tour package with this slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create tour package' });
  }
}

module.exports = { listPackages, getPackage, postPackage };
