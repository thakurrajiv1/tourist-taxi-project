# Switching Email Delivery to Resend

Only two files change. Everything else — the five email templates, the
branded layout, and every trigger point in `bookings.service.js` and
`payments.service.js` — stays exactly as it was, since they only ever
called `sendEmail({ to, subject, html })` and that function's signature
hasn't changed.

## Verified before delivery

- Intercepted the actual Resend API call to confirm the payload is
  correctly formatted:
  ```json
  {
    "from": "Roaming Route Travel and Transport <contactus@roamingroute.in>",
    "to": "rohit@example.com",
    "subject": "Booking Received — abc123 | Roaming Route",
    "html": "<p>Test email body</p>"
  }
  ```
- Confirmed booking creation still succeeds cleanly with no API key set
  (logs a skip message, doesn't crash)
- Confirmed a Resend-side error (e.g. an unverified domain) is caught
  and logged clearly rather than crashing the booking operation

## Where each file goes

| File | Notes |
|---|---|
| `backend/src/config/email.config.js` | replace |
| `backend/src/modules/email/email.service.js` | replace |

## Set up Resend (takes about 10 minutes)

### 1. Create your account
Go to [resend.com](https://resend.com) and sign up — free, no card required.

### 2. Verify your domain
1. In the Resend dashboard: **Domains** → **Add Domain** → enter `roamingroute.in`
2. Resend gives you 3-4 DNS records to add (usually a couple of `TXT`
   records for domain verification/DKIM, and an `MX` or `CNAME` record)
3. Go to **Hostinger hPanel** → **Domains** → `roamingroute.in` → **DNS / Nameservers**
4. Add each record Resend showed you, exactly as given (name, type, value)
5. Back in Resend, click **Verify** — this can take a few minutes to a
   few hours depending on DNS propagation; Resend will show a green
   "Verified" badge once it's done

### 3. Get your API key
In the Resend dashboard: **API Keys** → **Create API Key** → give it a
name like "Roaming Route Production" → copy the key (starts with `re_`)
— you won't be able to see it again after leaving the page, so save it
somewhere safe immediately.

### 4. Update your dependencies
```bash
cd backend
npm uninstall nodemailer
npm install resend
```

### 5. Update environment variables on Render
Go to your backend service → **Environment** tab, and:
- **Remove**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- **Add**:
  | Key | Value |
  |---|---|
  | `RESEND_API_KEY` | *(the `re_...` key from step 3)* |
  | `FROM_EMAIL` | `contactus@roamingroute.in` |
  | `EMAIL_FROM_NAME` | `Roaming Route Travel and Transport` |
  | `ADMIN_NOTIFICATION_EMAIL` | `contactus@roamingroute.in` |

### 6. Deploy
```bash
git add -A
git commit -m "Switch email delivery to Resend (Render free tier blocks outbound SMTP)"
git push
```

## Testing after deploying

1. Make a test booking with your own email address
2. Check Render's logs — you should see no `[email]` error lines this time
3. Check your inbox (and spam folder for the first send or two)
4. If something's off, check the **Resend dashboard → Logs** — it shows
   every send attempt with full delivery status, which is more visibility
   than raw SMTP ever gave you

## Note on the free tier limits

3,000 emails/month, 100/day. Each booking triggers 2 emails immediately
(customer + admin) plus 1 more at each status change (confirmed,
assigned, cancelled) — so budget roughly 3-5 emails per completed
booking. At 100/day that's comfortably 20-30 bookings/day before you'd
need to think about Resend's paid tier, which is far beyond what a
new business needs to worry about right now.
