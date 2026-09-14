# Admin Image Upload (Cloudinary)

Replaces the "add a file to the repo, type its path" workflow with a
real **Upload Photo** button in the Tour Packages admin form — pick a
file, it uploads, the preview and URL fill in automatically.

## Verified before delivery

Ran the real upload endpoint end-to-end (Cloudinary's actual network call
intercepted so no real account was needed for testing, but every other
line — file parsing, validation, routing — is genuine, unmodified code):

- **Valid JPEG upload** → returns a proper Cloudinary-style URL
- **Wrong file type** (e.g. a `.txt` file) → rejected with a clear error,
  never reaches Cloudinary
- **No file provided** → clear 400 error
- **File over 5MB** → rejected before upload starts
- **Cloudinary not configured yet** → returns a clear "not set up yet"
  message (503) instead of crashing — same dormant-until-configured
  pattern as every other external service in this project

## Where every file goes

| File | Notes |
|---|---|
| `backend/src/config/cloudinary.config.js` | new |
| `backend/src/modules/uploads/uploads.controller.js` | new |
| `backend/src/modules/uploads/uploads.routes.js` | new |
| `frontend/components/admin/ImageUploadField.js` | new |
| `frontend/lib/adminApi.js` | replace (adds `uploadImage`) |
| `frontend/pages/admin/tour-packages.js` | replace (uses the new upload field) |

## One manual step: wire the route into `backend/src/app.js`

Same reason as before — I don't have your exact current `app.js` to
safely auto-replace. Add these two lines, in the same spots as your
other modules:

Near your other route imports:
```javascript
const uploadsRoutes = require('./modules/uploads/uploads.routes');
```

Near your other `app.use(...)` registrations:
```javascript
app.use('/api/uploads', uploadsRoutes);
```

## Two new dependencies

```bash
cd backend
npm install cloudinary multer
```

## Setting up Cloudinary (~5 minutes)

### 1. Create your account
[cloudinary.com](https://cloudinary.com) → sign up, free, no card required.

### 2. Get your credentials
Right on your Cloudinary dashboard homepage after signing up, you'll see
a **Product Environment Credentials** panel showing:
- **Cloud name**
- **API Key**
- **API Secret** (click "reveal" to see it)

### 3. Add them to Render
Backend service → **Environment** tab → add:

| Key | Value |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | *(from step 2)* |
| `CLOUDINARY_API_KEY` | *(from step 2)* |
| `CLOUDINARY_API_SECRET` | *(from step 2)* |

### 4. Deploy
```bash
git add -A
git commit -m "Add admin image upload via Cloudinary"
git push
```

## Try it

1. Log into `/admin/tour-packages`
2. In the Add/Edit form, click **Upload Photo**
3. Pick a JPEG/PNG/WEBP under 5MB
4. Confirm a preview appears and the image URL fills in automatically
   (no more copy-pasting a path)
5. Save the package, then check `/packages` on the public site — the
   photo should display there too

## A couple of details worth knowing

- **Images are automatically capped at 1600×1600px** on upload — keeps
  storage/bandwidth usage down without any visible quality loss for web
  display, since nothing on the site shows images larger than that
- **The manual "paste a URL" field is still there**, right below the
  upload button — useful if you ever want to reuse an image already
  hosted somewhere else, or if you're setting the Destinations section
  images (which still use the local-file approach in
  `frontend/public/images/destinations/`, since those aren't
  admin-editable content)
- **Free tier**: 25 credits/month (1 credit ≈ 1GB storage or bandwidth,
  or 1,000 transformations) — for a handful of tour package photos, this
  is far more than you'll need for a long time
