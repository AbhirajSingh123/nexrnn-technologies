# NexRNN Technologies — Website + Admin Panel

Multi-page digital agency + courses website with a Supabase-backed admin panel for NexRNN Technology, Lucknow. Built with React 19, Vite, React Router, Tailwind CSS v4, Framer Motion, and Supabase.

## Getting Started

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key — see setup below
npm run dev
npm run build           # production build (outputs to dist/)
```

**Without a `.env` file configured, the public site still works** (it falls back to the
original static demo data), but the admin panel, lead capture, and CRUD will not function
until Supabase is set up.

---

## Supabase Setup (one-time, free tier)

1. Go to [supabase.com](https://supabase.com) → sign up (free, no card required) → **New Project**.
2. Once created, go to **SQL Editor** → **New query**, paste the entire contents of
   `supabase/schema.sql`, and click **Run**. This creates all tables, security policies, and
   the QR-code storage bucket.
3. Run **`supabase/seed.sql`** the same way (New query → paste → Run) to pre-fill your existing
   14 services and 3 courses so the admin panel isn't empty on day one.
4. Go to **Project Settings → API** and copy the **Project URL** and **anon public key** into
   your `.env` file (see `.env.example`).

### Creating your 4 admin users (3 admin + 1 super admin)

Supabase Auth users can't be created from the app itself for security reasons — create them
in the dashboard:

1. **Authentication → Users → Add user** — create each of your 4 logins (email + password).
2. For **each** user, go to **Table Editor → profiles → Insert row** and add:
   - `id`: paste the user's UUID from the Authentication → Users list
   - `full_name`: their name
   - `role`: `admin` for 3 of them, `super_admin` for the one who should manage other admins

That's it — those 4 logins can now sign in at `/admin/login`.

---

## Admin Panel

- **Login**: `/admin/login` (redirects to `/admin` once logged in)
- **Auto-logout**: after **30 minutes of inactivity**, the admin is automatically signed out
  and redirected to the login page (`src/hooks/useIdleTimeout.js`)
- **Dashboard**: `/admin` — quick counts of leads and catalog size
- **Leads** (each in its own tab, all timestamped automatically):
  - `/admin/leads/contact` — Contact Us page + homepage lead form submissions
  - `/admin/leads/services` — "Buy Now" service enquiry popup submissions
  - `/admin/leads/courses` — course enrollment popup submissions (includes payment reference number)
- **Manage Services** (`/admin/services`) — full CRUD, edits reflect live on the public site
- **Manage Courses** (`/admin/courses`) — full CRUD including QR code image upload, demo video
  URL, pricing/discount, curriculum, and a dynamic FAQ editor

## Popups / Lead Capture

- **Service "Buy Now"** button opens a popup: Name, Company (optional), City, Number, Email,
  Message, consent checkbox → saved to `leads_service`.
- **Course "Enroll Now"** button opens a popup: Name, Number, Email, the selected course
  (auto-filled), its price (set by admin), the QR code image (set by admin), a Payment
  Reference Number field, consent checkbox → saved to `leads_course`.
- All submission forms (Contact Us, homepage lead form, both popups) require a **consent
  checkbox**: *"By contacting us, you agree to our Terms of Service and Privacy Policy"*,
  linking to `/terms-and-conditions` and `/privacy-policy`.
- Every lead row is timestamped automatically (`created_at`) — visible in each admin leads tab.

## Payment Verification (current + future)

Right now, students enter a payment reference number after paying via the QR code, and your
team verifies manually against the payment app/bank. When you're ready to add Razorpay:
- The reference-number field and flow are already isolated in `CourseEnrollModal.jsx`, so
  swapping in a real payment gateway later won't require restructuring the rest of the form.

## Project Structure (new since last version)

```
supabase/
  schema.sql     Run once — tables, RLS policies, storage bucket
  seed.sql       Run once — pre-fills existing services/courses

src/
  contexts/
    AdminAuthContext.jsx      Supabase auth session + role
    ServiceLeadContext.jsx    Controls the "Buy Now" popup
    CourseEnrollContext.jsx   Controls the "Enroll Now" popup
  hooks/
    useIdleTimeout.js         30-minute auto-logout
    useCatalog.js             Live services/courses fetching (Supabase, with static fallback)
  data/
    servicesRepo.js, coursesRepo.js, leadsRepo.js   Supabase read/write layer
  components/
    admin/          AdminTable, AdminProtectedRoute
    services/        ServiceLeadModal
    courses/          CourseEnrollModal
    shared/            ConsentCheckbox, Modal, DemoVideo, CertificateSample, LoadingSpinner
  layouts/
    AdminLayout.jsx   Sidebar nav + logout + idle-timeout wiring
  pages/admin/        Dashboard, 3 leads pages, Services CRUD, Courses CRUD, Login
```

## What's demo/placeholder content (unchanged from before)

Portfolio and testimonials are still demo-marked static content — not wired to Supabase in
this pass, since they weren't part of this round of changes.

## Deployment (nexrnntechnology.in)

Same as before — see `vercel.json` / `public/_redirects` for SPA routing. **Remember to add
your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in your
hosting provider's dashboard** (e.g. Vercel → Project Settings → Environment Variables) —
`.env` files are never deployed.

---

## Round 3 additions (SEO, Client Reviews, Portfolio, Testimonials, expanded lead/enrollment tracking)

### New Supabase migration to run

Run **`supabase/migration_3.sql`** once in the SQL Editor (after `migration_2.sql`). It adds:
- `client_reviews`, `portfolio`, `testimonials` tables (each with public read + admin CRUD policies)
- a `portfolio-assets` storage bucket for uploaded project images
- an `on_call` status option for Contact and Service leads
- new columns on `leads_course`: `batch_id`, `enrollment_status`, `call_status`, `email_status`, `payment_status`, `admin_notes`, `updated_at`

### Admin panel additions

- **What Our Clients Say** (`/nexrnn/master-nexrnn/admin/client-reviews`) — full CRUD for the video review slider on the Services page (YouTube link, client name, service name)
- **Manage Portfolio** (`.../admin/portfolio`) — full CRUD with direct image upload to Supabase Storage, category (Website/Ads/Branding/Other)
- **Manage Testimonials** (`.../admin/testimonials`) — full CRUD with a star-rating picker (review, rating, client name, company name)
- **Contact Leads / Service Leads** — status is now Pending / On Call / Done / Undone
- **Course Enrollments** — click **Manage** on any row to open a panel where you set: Batch ID (free text, e.g. `BATCH-2026-001`), Enrollment Status (Pending / On Call / Enrolled / Payment Received / Declined), Payment Status (Unpaid / Paid — tracked separately from Enrollment Status), Call Status (Done / Undone), Email Status (Sent / Not Sent), and Admin Notes. None of these fields are ever shown on the public enrollment form — admin-only, as requested.

All three new content types (client reviews, portfolio, testimonials) work the same way as Services/Courses did: the public site fetches live from Supabase, and falls back to the original static demo data if Supabase isn't configured or a table is empty.

### SEO

- **On-page**: canonical tags added on every page (fixes duplicate-content risk between `/` and `/Home`, and `/Contect-us` / `/contact-us`), `Course` and `Service` schema.org markup on detail pages, `FAQPage` schema on course detail pages (pulled from each course's existing FAQ data), `Organization` + `WebSite` schema with `sameAs` social links on the root page, `robots` meta tag.
- **GEO (Generative Engine Optimization)**: added `public/llms.txt` — a plain-text summary of the business, services, and courses following the emerging llms.txt convention that AI systems (ChatGPT, Perplexity, etc.) increasingly check when summarizing or recommending a site.
- **AEO (Answer Engine Optimization)**: the FAQPage schema above is the main lever here — it's what lets Google (and increasingly AI answer engines) surface your course FAQs directly as rich results/answers.
- **Off-page SEO**: this genuinely can't be "added" through code — it's backlinks, directory listings (Google Business Profile, Justdial, etc.), guest content, and social presence, all built over time outside the codebase. The technical foundation above (clean URLs, schema, canonical tags) makes off-page efforts more effective once you start them, but there's no on-site feature to toggle for it.

### One naming clarification made without asking

"Payment Status" (Section 7) was listed separately from "Enrollment Status" (Section 6, which already includes a "Payment Received" option). I implemented them as **two independent fields** — Enrollment Status tracks where the student is in the funnel, Payment Status is a simple Unpaid/Paid toggle that can change independently (e.g., a student can be "On Call" but already Paid). If you intended these to be the same field, let me know and I'll collapse them back into one.

---

## Round 4: Cashfree Payment Gateway Integration

### Why this needs Supabase Edge Functions

Cashfree's secret API key must **never** be shipped to the browser — anyone could open DevTools and steal it. So order creation, payment verification, and the webhook all run as **Supabase Edge Functions** (small serverless functions, same free Supabase project, no separate hosting needed).

### Step 1 — Get Cashfree credentials

1. Sign up / log in at [merchant.cashfree.com](https://merchant.cashfree.com).
2. Go to **Developers → API Keys**. Copy the **Test Mode** (sandbox) **Client ID** and **Client Secret** first — test everything here before going live. Production keys become available after KYC is approved.

### Step 2 — Install & link the Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```
`YOUR_PROJECT_REF` is the part after `/project/` in your Supabase dashboard URL.

### Step 3 — Set secrets (these never appear in frontend code)

```bash
supabase secrets set CASHFREE_CLIENT_ID=your_test_client_id
supabase secrets set CASHFREE_CLIENT_SECRET=your_test_client_secret
supabase secrets set CASHFREE_ENV=sandbox
supabase secrets set SITE_URL=https://nexrnntechnology.in
```
(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to every Edge Function — you don't need to set those yourself.)

### Step 4 — Run the database migration

Run **`supabase/migration_4.sql`** once in the SQL Editor (after migrations 2 and 3). It adds the `payments` table and a `cashfree_order_id` column on `leads_course`.

### Step 5 — Deploy the three Edge Functions

```bash
supabase functions deploy create-cashfree-order
supabase functions deploy verify-cashfree-payment
supabase functions deploy cashfree-webhook --no-verify-jwt
```
The `--no-verify-jwt` flag on the webhook is required — Cashfree's servers call it directly with no Supabase login, so it can't require a Supabase auth token like the other two.

### Step 6 — Set up the webhook in Cashfree

1. In the Cashfree dashboard: **Developers → Webhooks → Add Webhook**.
2. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/cashfree-webhook`
3. Select the `PAYMENT_SUCCESS_WEBHOOK` and `PAYMENT_FAILED_WEBHOOK` events (or "all events").
4. Cashfree will show you a **Webhook Secret** — copy it and set:
   ```bash
   supabase secrets set CASHFREE_WEBHOOK_SECRET=the_webhook_secret
   ```

### Step 7 — Set the frontend mode

In your `.env` (and in your hosting provider's environment variables — e.g. Vercel):
```
VITE_CASHFREE_MODE=sandbox
```

### Step 8 — Test end-to-end in sandbox

1. Run the site, click **Enroll Now** on a course, fill the form, click **Proceed to Payment**.
2. You'll land on Cashfree's sandbox checkout — use their [test card/UPI details](https://www.cashfree.com/docs/payments/test-integration) to simulate a payment.
3. After payment, you should land back on `/enrollment-payment-status`, which verifies the payment and redirects to the success page.
4. Check **Admin → Course Enrollments → Manage** on that record — you should see the payment attempt logged, with status `paid`, and Payment Status auto-updated.
5. Check **Admin → Payments** for the full payment log.

### Step 9 — Go live

Once sandbox testing passes and Cashfree KYC is approved:
```bash
supabase secrets set CASHFREE_CLIENT_ID=your_production_client_id
supabase secrets set CASHFREE_CLIENT_SECRET=your_production_client_secret
supabase secrets set CASHFREE_ENV=production
```
And update `VITE_CASHFREE_MODE=production` in your hosting provider's env vars, then redeploy the frontend. Also add a **second, separate webhook** in Cashfree's dashboard for Production mode pointing to the same URL, and set its production webhook secret the same way.

### What changed in the enrollment flow

- The old QR-code image and optional "Payment Reference Number" field are **removed** from the enrollment popup — payment is now handled entirely through Cashfree's checkout.
- "Submit Enrollment" is now **"Proceed to Payment"** — clicking it saves the enrollment record, creates a Cashfree order, and immediately redirects to Cashfree's hosted payment page.
- A new **`/enrollment-payment-status`** page handles the return from Cashfree: it re-verifies the payment status directly with Cashfree's server (never trusts the redirect URL alone), updates the database, and then shows the existing success page — or a clear "payment not completed" screen with your contact details if it failed.
- Cashfree's webhook keeps payment status in sync in the background as a second, more reliable layer (in case the user closes the tab right after paying, before the redirect completes).
- New **Admin → Payments** page lists every payment attempt (order ID, amount, method, Cashfree payment ID, status) with search/filter, and each order's payment history is also visible inside the **Manage** panel on that specific enrollment.

---

## Round 5: Bug fix, Workshops, Payment Success page, Site Display Settings, Report-a-Bug

### 1. Bug fixed — "Course not found" after payment

Root cause: the `SITE_URL` secret in Supabase almost certainly has an extra `/course` (or similar) segment in it, so Cashfree's `return_url` became `https://your-domain/course/enrollment-payment-status?...`, which matched the `/course/:slug` route instead of the dedicated status page.

**Please check** your `SITE_URL` secret (Supabase → Edge Functions → Secrets) and make sure it's just the bare domain with no trailing path, e.g.:
```
SITE_URL=https://nexrnntechnology.in
```
(or your Vercel preview domain if that's what you're testing on, again with no trailing path).

As a safety net, this update also adds a few extra routes (`/course/enrollment-payment-status`, `/workshop/enrollment-payment-status`, etc.) that resolve to the same page regardless — so even if this happens again, the site itself won't break.

**⚠️ You must redeploy all 3 Edge Functions again** (paste the new code from `supabase/functions/*/index.ts` into the dashboard editor as before) — they were generalized in this round to support both course and workshop payments through the same functions.

### 2. Payment Success Page — now admin-editable

Run `supabase/migration_5.sql` — adds a `site_settings` table with an editable heading + message body for the payment-success page. Edit it at **Admin → Site Settings**. Use `{name}` and `{title}` as placeholders in the message — they get replaced with the student's name and the course/workshop title automatically.

Each course/workshop now also has a **WhatsApp Group Link** field (in its admin edit form) — if set, a "Join WhatsApp Group" button appears on the payment success page after that specific course/workshop is paid for.

### 3. Workshops — a full new content type, parallel to Courses

- Public pages: `/workshop` (listing) and `/workshop/:slug` (detail — banner, date/time, registration deadline, details, FAQs, certificate sample, workshop video, pricing)
- Registration popup (same pattern as course enrollment) → Cashfree checkout → same payment-success flow
- Admin: **Manage Workshops** (full CRUD, banner image upload) and **Workshop Registrations** (search/filter, Manage panel with Batch ID + all 4 statuses + admin notes — identical to how Course Enrollments works)
- Workshop payments show up in the same **Payments** admin page as courses, with a Type column distinguishing them

### 4. Site Display Control

At **Admin → Site Settings**, toggle whether **Services**, **Courses**, and **Workshops** each show on the public site — this hides the nav link, the homepage preview section, and shows a friendly "temporarily unavailable" message if someone visits the page directly while it's off. Individual item-level `active` toggles (e.g. hiding just one course) still work exactly as before — this is a separate, whole-section switch.

### 5. Report a Bug button

Added to both the 404 page and the general error screen (shown if something crashes) — it links to `/Contect-us?subject=bug-report`, which now pre-fills the Contact Us form's service dropdown and message field so bug reports arrive as a normal, identifiable Contact Lead. A new "Report a Bug / Website Issue" option was also added to the service dropdown for anyone who selects it manually.

### New Supabase migration to run

Run **`supabase/migration_5.sql`** once (after migrations 2, 3, and 4). It adds:
- `site_settings` table (display toggles + payment success template)
- `whatsapp_group_link` column on `courses`
- `workshops` table (full CRUD content type)
- `leads_workshop` table (registrations, same status fields as `leads_course`)
- generalizes `payments` to support both `lead_type: 'course'` and `lead_type: 'workshop'`
- a new `workshop-assets` storage bucket for banner uploads
