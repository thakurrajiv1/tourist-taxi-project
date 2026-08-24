const {
  getAllPackages,
  getAllPackagesAdmin,
  getPackageBySlug,
  getPackageByIdAdmin,
  createPackage,
  updatePackage,
  deactivatePackage,
} = require('./tourPackages.service');

async function listPackages(req, res) {
  try {
    res.json(await getAllPackages());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tour packages' });
  }
}

async function listPackagesAdmin(req, res) {
  try {
    res.json(await getAllPackagesAdmin());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tour packages' });
  }
}

async function getPackage(req, res) {
  try {
    const pkg = await getPackageBySlug(req.params.slug);
    if (!pkg) return res.status(404).json({ error: 'Tour package not found' });
    res.json(pkg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tour package' });
  }
}

async function getPackageAdmin(req, res) {
  try {
    const pkg = await getPackageByIdAdmin(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Tour package not found' });
    res.json(pkg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tour package' });
  }
}

async function postPackage(req, res) {
  const { title, slug, duration_days, price, itinerary } = req.body;
  if (!title || !slug || !duration_days || !price) {
    return res.status(400).json({ error: 'title, slug, duration_days, and price are required' });
  }
  if (!Array.isArray(itinerary) || itinerary.length === 0) {
    return res.status(400).json({ error: 'itinerary must be a non-empty array of { day_number, title, description }' });
  }
  try {
    const pkg = await createPackage(req.body);
    res.status(201).json(pkg);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'A tour package with this slug already exists' });
    res.status(500).json({ error: 'Failed to create tour package' });
  }
}

async function putPackage(req, res) {
  if (req.body.itinerary !== undefined && (!Array.isArray(req.body.itinerary) || req.body.itinerary.length === 0)) {
    return res.status(400).json({ error: 'itinerary, if provided, must be a non-empty array' });
  }
  try {
    const pkg = await updatePackage(req.params.id, req.body);
    if (!pkg) return res.status(404).json({ error: 'Tour package not found' });
    res.json(pkg);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'A tour package with this slug already exists' });
    res.status(500).json({ error: 'Failed to update tour package' });
  }
}

async function deletePackage(req, res) {
  try {
    const pkg = await deactivatePackage(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Tour package not found' });
    res.json({ message: 'Tour package deactivated', tour_package: pkg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate tour package' });
  }
}

module.exports = { listPackages, listPackagesAdmin, getPackage, getPackageAdmin, postPackage, putPackage, deletePackage };
