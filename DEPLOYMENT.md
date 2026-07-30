# Deploying Roaming Route — Free, No Card Required

This gets your project a real, shareable URL that stays online without your
PC running. Two services, both genuinely free:

- **Render** — hosts the backend (Node/Express) + a free Postgres database
- **Vercel** — hosts the frontend (Next.js)

**One tradeoff on the free tier**: Render's free web service "sleeps" after
15 minutes of no traffic. The first request after that takes about a
minute to wake back up — after that it's fast until it goes quiet again.
Totally fine for sharing progress with a few people; if you later want it
always-instant, Render's paid tier ($7/month) removes the sleep entirely.

## Prerequisites

1. A [GitHub](https://github.com) account
2. Your project pushed to a GitHub repo (see Step 0 below if you haven't
   done this yet)

---

## Step 0: Push your code to GitHub (skip if already done)

From your `tourist-taxi-project` folder in a terminal:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create a new repo on [github.com/new](https://github.com/new) (don't
initialize it with a README), and follow the "push an existing repository"
instructions it shows you — it'll look like:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 1: Create the database on Render

1. Sign up at [render.com](https://render.com) (no card required for free tier)
2. Dashboard → **New** → **PostgreSQL**
3. Name it (e.g. `roaming-route-db`), region closest to you, **Free** plan
4. Once created, open it and copy the **External Database URL** — you'll
   need this in Step 3

## Step 2: Load your schema and seed data into it

From your own machine, using the External Database URL from Step 1:

```bash
psql "YOUR_EXTERNAL_DATABASE_URL_HERE" -f backend/src/db/schema.sql
psql "YOUR_EXTERNAL_DATABASE_URL_HERE" -f backend/src/db/seeds/north_india_seed.sql
```

Then create your admin login the same way you did locally, but pointed at
this database — easiest way is to temporarily set `DATABASE_URL` in your
local `.env` to this same connection string and run:

```bash
node scripts/create-admin.js "you@yourcompany.com" "a-strong-password" "Your Name"
```

(Switch your local `.env` back afterward so local dev keeps using your
local database.)

## Step 3: Deploy the backend on Render

1. Dashboard → **New** → **Web Service**
2. Connect your GitHub repo
3. **Root Directory**: `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. **Free** plan
7. Add these environment variables (Render's dashboard has an "Environment"
   tab):
   ```
   DATABASE_URL=<paste the same External Database URL from Step 1>
   JWT_SECRET=<generate one: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
   PORT=4000
   ```
   Leave `RAZORPAY_*`, `ADVANCE_PAYMENT_PERCENTAGE`, and
   `MAPBOX_ACCESS_TOKEN` blank for now — everything stays in the same
   graceful "not live yet" state as it does locally.
8. Click **Create Web Service**. Render will build and deploy — this takes
   a few minutes the first time.
9. Once live, copy the URL Render gives you (something like
   `https://roaming-route-backend.onrender.com`)

## Step 4: Deploy the frontend on Vercel

1. Sign up at [vercel.com](https://vercel.com) (no card required)
2. **Add New** → **Project** → import the same GitHub repo
3. **Root Directory**: `frontend`
4. Add an environment variable:
   ```
   NEXT_PUBLIC_API_BASE_URL=<the Render backend URL from Step 3>
   ```
5. Click **Deploy**

Vercel gives you a URL like `https://your-project.vercel.app` — **this is
the link you share with others.**

## Step 5: Verify it actually works

Visit your Vercel URL and:
- Confirm the homepage loads and "Popular Routes" shows your seeded data
- Try a fare search
- Log into `/admin` with the admin account you created in Step 2

If the backend takes a moment to respond the first time, that's the
free-tier sleep waking up — normal, not a bug.

## Updating the live version later

Both Render and Vercel auto-redeploy on every `git push` to your main
branch — so once this is set up, sharing updated progress is just:

```bash
git add .
git commit -m "describe what changed"
git push
```

## What's NOT included in this guide

- A custom domain (both platforms support adding one later, free on Vercel,
  free on Render too)
- Removing the free-tier sleep (needs Render's paid tier)
- Production-hardening (rate limiting, monitoring, backups) — worth
  revisiting before this handles real customer traffic and payments
