# NexRNN Technologies — Website + Admin Panel + Mentor Panel

Multi-page digital agency + courses website with a Supabase-backed **admin panel** and a full **Mentor Panel** (mentor network, commissions, wallet & withdrawal payments) for NexRNN Technology, Lucknow. Built with React 19, Vite, React Router, Tailwind CSS v4, Framer Motion, and Supabase.

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
4. Run **every numbered migration in order** (`supabase/migration_2.sql` up to
   `supabase/migration_28_mentor_withdrawals_commissions.sql`) — New query → paste → Run for each.
   These add blog, careers, mentors, analytics, payments and withdrawal tables + triggers.
5. Deploy the **two edge functions** (Dashboard → Edge Functions → Create → copy file → Deploy):
   - `supabase/functions/mentor-login/index.ts` — mentor login (Mentor ID + mobile, HMAC token)
   - `supabase/functions/mentor-data/index.ts` — all mentor panel data/actions
   Re-deploy BOTH after every update to these files, then hard-refresh (Ctrl+Shift+R).
6. Create the **storage bucket** `mentor-issues` (private) for mentor issue attachments.
7. Go to **Project Settings → API** and copy the **Project URL** and **anon public key** into
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

---

## Round 6: Free/Paid pricing, unique reference IDs, workshop mentors, admin layout, pagination, popup offers

### New Supabase migration to run

Run **`supabase/migration_6.sql`** once (after migrations 2–5). It adds:
- `is_free` on `courses` and `workshops`
- `mentor_name` / `mentor_intro` on `workshops`
- `price` / `original_price` / `discount_percent` on `services` (previously had no pricing at all)
- `reference_id` (unique) on `leads_course` and `leads_workshop`
- `'free'` as a valid `payment_status` value alongside `unpaid`/`paid`
- `popup_enabled` / `popup_image_url` / `popup_link` on `site_settings`
- a new `site-assets` storage bucket (for the popup image)

**⚠️ No Edge Function redeploy needed this round** — the Free/Paid logic is handled entirely on the frontend (free enrollments skip calling the payment functions altogether).

### 1–2. Pricing, ₹ sign, Free/Paid

- Courses, Workshops, and now **Services too** show pricing on their cards and detail pages.
- `formatINR()` (`src/utils/format.js`) always renders a consistent `₹` + comma-grouped number no matter what's stored — it strips any stray symbols/commas before formatting, so the ₹ sign can never go missing or get duplicated.
- Each course/workshop's admin edit form now has a **Free / Paid** toggle. Free items hide the pricing fields entirely and show a green "FREE" badge everywhere on the site instead. A ₹0 (or free) item **never calls the payment gateway** — the enrollment completes immediately and redirects straight to the success page.
- Services have a **Price** field too now (optional) — if left blank, the site shows "Contact for Pricing" instead of ₹0.

### 3. Unique Reference ID per enrollment

Every course/workshop enrollment (free or paid) now gets a unique reference ID (e.g. `NRN-CRS-M2K3P9-X7Q1`), generated the moment the form is submitted. It's shown prominently on the success page, and appears as its own column in **Course Enrollments** / **Workshop Registrations**, plus inside each enrollment's **Manage** panel.

### 4. Admin panel layout

- The sidebar is now fixed and scrolls independently from the main content area (both now use their own internal scrollbars instead of the whole page scrolling together) — this also fixes the sidebar nav getting cut off now that there are many more sections.
- **Pagination**: every admin list (leads, payments, services, courses, workshops, client reviews, portfolio, testimonials) now shows a maximum of 10 records at a time with a **Load More** button underneath ("Showing X of Y").

### 5. Workshop Mentor section

Each workshop's admin form now has a **Mentor Section** (Mentor Name + Short Introduction). If a mentor name is set, a "Your Mentor" section automatically appears on that workshop's public page. Leave the name blank to hide it.

### 6. Popup Offers

**Admin → Site Settings → Popup Offers**: toggle on/off, upload a popup image, and optionally set a link (the whole image becomes clickable and opens that link in a new tab). Behavior on the live site:
- Appears 5 seconds after a visitor lands on any page
- Auto-closes after 10 seconds if the visitor doesn't close it manually
- Closeable anytime via the × button or by clicking outside it

---

## Mentor Network & Mentor Panel (R23 – R27+)

Mentors are managed **only from the admin panel** — there is no public mentor signup.

### Admin → Mentors (`/nexrnn/master-nexrnn/admin/mentors`)
- Add/Edit mentors: name, email, phone, location, gender, type (course/workshop/both), date of joining.
- **Unique Mentor ID `NX-MEN-XXXXXXXX`** is generated by the database (admin cannot edit it).
- **Split commissions**: separate **Course Commission %** and **Workshop Commission %** (existing mentors
  are back-filled from the old single rate automatically).
- **Block / Unblock** a mentor — a blocked mentor cannot log in; the login screen shows
  *"You are blocked By Nexrnn Admin. If this is any error so pls Contect Admin."* with a **Go to Contact Us** link.
- **PDF downloads** per mentor: Offer Letter, LOR, Full Profile (jspdf, always dynamic import).
- **Payout details** (bank / UPI) saved from the mentor's latest withdrawal request are shown in the Manage modal.
- Assign courses/workshops to a mentor (single-select per item on course/workshop editors too).

### Mentor login
- Login with **Mentor ID + mobile number** (server-validated via `mentor-login` edge function, HMAC token, no passwords).
- Unauthenticated `/nexrnn/master-nexrnn/mentor` → login screen; logout invalidates the session.
- Mentor A can never access Mentor B's data — scoping happens **server-side** in the edge function.

### Mentor panel pages
- **Dashboard** — **Wallet balance** (available to withdraw), total earned / withdrawn, today's earnings,
  split commission rates, assigned programs, pending-withdrawal notice.
- **Course / Workshop Registrations** — view-only. ⚠️ **Student email & mobile are hidden from mentors**
  (removed from the API response too — server-side privacy).
- **Manage Courses / Workshops** — mentors can **add new** and **edit** their assigned programs
  (delete is forbidden everywhere: UI + edge + DB policy). Batch ID is static and sourced from the catalog.
- **Mentor Details** — profile incl. gender, both commission rates (read-only), assigned programs.
- **Commission** — earning records + daily chart, computed from real `paid` payments only, split rates per kind.
- **My Blogs** — mentors write/edit **only their own** blog posts (`mentor_uuid` scoped server-side);
  published posts appear on the public blog with `NX-B-…` IDs and view counters.
- **Withdrawal Payment** — see below.
- **Contact Us** — Email / WhatsApp / Phone with mentor details auto-attached (see below).
- **Report an Issue** — with optional attachment (server-validated type/size, stored in `mentor-issues` bucket).

---

## Withdrawal Payment System (Wallet)

### Mentor side — `Withdrawal Payment` page
- **Wallet** = total earned commission − withdrawn − pending requests. Pending amounts are blocked so a
  mentor can never request more than the wallet balance (validated in the form **and again on the server**).
- Request form: amount (₹) + method **UPI** (UPI ID) or **Bank** (Account No, Account Holder Name, IFSC).
  Details are validated (IFSC/UPI format) and saved to the mentor's profile for the admin.
- **Withdrawal History** table: Payment ID `NX-W-XXXXXXXX` (DB-generated), amount, method, status
  (**Created / In progress / Payment Done**), requested time, admin's Payment Ref No and message.
- Per request: **Download Slip** (official PDF payment slip with logo, all details, digital sign note,
  website URL) and **Mail NexRNN** (opens the mail app to `nexrnntechnologies@gmail.com` with the
  payment's full info pre-filled + "Your message :-").

### Admin side — `Mentor Payments` page
- Two tabs: **Requested Payments** (Created / In progress) and **Payment History** (Payment Done).
- Open a request: mentor's important details are **auto-fetched** (name, Mentor ID, email, phone from the
  mentors table), payout details, and both timings — **when the mentor requested** and **when the admin processed**.
- Admin fills: **Status**, **Ref No (Payment)** (required before marking Payment Done — that also stamps the
  processed time) and a **message** visible to the mentor.
- Per request: **Download Slip** (same PDF) and **Mail to Mentor** (opens the mail app addressed to the
  **mentor's email** with status/ref/timings/message pre-filled).
- Full CSV export, search, mobile-friendly.

---

## Traffic & Analytics

- Events recorded from the public site (`analytics_events` table): `page_view`, `whatsapp_click`,
  `phone_click`, `generate_lead` (contact + service forms), `blog_read` (per blog title, once per session),
  `cta_click` (primary/secondary buttons).
- Admin page shows stat cards, daily page-view chart, top pages, **Most Read Blog Posts**
  (falls back to the per-post views counter until blog_read events exist).
- **Fixes**: Supabase's 1000-row per-request limit was silently truncating counts — now fully paginated;
  chart follows the selected range (7/30/**90** days); header shows the exact data window
  (*"Showing data from X to Y • Tracking live since Z"*).
- GA4 (`G-K4SNP45ELV`) + Microsoft Clarity (`y9xutlx9sj`) also integrated.

---

## Mentor Contact — auto details + WhatsApp

- Mentor panel **Contact Us** has **Email**, **WhatsApp Us** (+91 75204 24645) and Phone options.
- The mentor's details (name, Mentor ID, email, phone) are **auto-attached** to both Email and WhatsApp
  messages, followed by **"Your message :-"** and whatever the mentor types in the on-page message box.

---

## Documentation note

This README is updated **every time a task/feature is completed** — newest work lands at the top of this
"latest" block. Recent completed work:

- ✅ Withdrawal Payment system (wallet + NX-W- IDs + statuses + slip PDF + mail on both sides)
- ✅ Payment Slip fixes: mentor name/ID now included (server + session fallback), admin message
  section always visible, and the mentor's email/phone printed on the slip
- ✅ **₹ symbol fixed in ALL downloadable PDFs** — jsPDF's standard fonts don't support the ₹ glyph
  (it printed as a garbage character), so every PDF now uses `Rs.` formatting (payment slip,
  enrollment receipt, application forms), and any admin-typed ₹ in labels/messages is auto-converted
- ✅ Share option on course & workshop detail pages (native share / WhatsApp / copy link)
- ✅ **Careers gate hardened**: application forms (job/internship) can NEVER open without a real,
  live opening — demo data no longer unlocks the form, and a failed database fetch now defaults to
  "not hiring" instead of sample openings
- ✅ **Sitemap cleaned for launch**: `/internship` and `/job` removed from sitemap.xml and the on-site
  sitemap page; `<lastmod>` added; admin/mentor panels stay hidden (`Disallow: /nexrnn/` in robots.txt
  + `noindex, nofollow` on both layouts)
- ✅ **Payment Confirmation Popup + Promo Codes (new)**: before any Cashfree checkout
  (course / workshop / job), a popup shows Course/Workshop/Job Fee, **Platform Fees** (admin-managed
  amount + show/hide in Site Settings), optional **Promo Code** box (admin show/hide) with server-side
  Apply validation, **Total Pay** and Pay Now. Free items skip the popup as before
- ✅ **Admin → Promo Codes page**: create codes with percent or flat discount, scope them to
  all / courses-only / workshops-only / jobs-only, optionally pin to ONE specific course, workshop or
  opening, set max uses, and **Activate / Deactivate / Delete** anytime (usage counter included)
- ✅ Server-side money math: the `create-cashfree-order` edge function recalculates discount
  (from `promo_codes`) + platform fee (from `site_settings`) — frontend numbers are never trusted;
  `payments` rows now store base_amount / discount_amount / promo_code / platform_fee; new
  `validate-promo` edge function powers the popup's Apply button
- ✅ **NexRNN Sales Panel (new)**: sales team `/nexrnn/panel/sales/login` (Sales ID + mobile,
  same HMAC-token auth as mentors) — Dashboard, Services catalog (with service commission),
  **Service Leads** (full access + WhatsApp chat links), **Refer & Earn** (permanent unique
  7-digit referral code, copy/share), Sales Details, Withdrawal Payment (wallet NX-SW-… IDs,
  slip download), Contact Us, Report an Issue. Blocked members see the standard block message
- ✅ **Admin → Sales Team / Sales Team Payments / Sales Team Issues** (same UX as mentor pages):
  members are added from admin only — Sales ID `NX-SAL-XXXXXXXX` and the 7-digit referral code are
  **DB-generated (unique, permanent, not editable)**; commission % for course / workshop / service
  set by admin; payments page accepts withdrawal requests (ref no + message + slip + mail);
  issues page responds to member-raised tickets (sales-issues private bucket)
- ✅ **Referral Code (optional) field** on every public form — service enquiry, course enroll,
  workshop enroll, career/internship application. The code is saved on the lead row and copied
  server-side onto the payments row by `create-cashfree-order` (client values never trusted);
  sales wallet commission = paid payments carrying the member's referral code × their rate
  for that lead type (course / workshop / service)
- ✅ Migration **30** (`migration_30_sales_team.sql`): sales_members (IDs + referral trigger),
  sales_withdrawals, sales_issues + sales-issues bucket, referral_code columns on
  leads_course / leads_workshop / leads_service / internship_applications / payments
- ✅ **Universal referral links (`?ref=CODE`)**: any site URL with `?ref=` (or `?referral=`)
  captures the code before render, stores it locally and cleans the URL — then EVERY public
  form (service enquiry, course enroll, workshop enroll, career apply) auto-fills the referral
  code. So one normal link attributes everything the visitor submits or buys
- ✅ Sales **Services page = shareable catalog** (Services / Courses / Workshops tabs): clicking
  any item opens a share modal with the member's referral link (Copy / WhatsApp / More Apps / Open)
- ✅ Sales **My Enrollments**: course/workshop enrollments through the member's referral code,
  with a WhatsApp "Offer" button that pre-fills a greeting + the member's referral code
- ✅ Sales members can **Add a Lead** from the panel (gets their referral code automatically)
  and download **Offer Letter + Full Profile PDFs** from Sales Details (admin can download them
  from Admin → Sales Team → View / Edit too)
- ✅ **Service Leads manage (admin)**: new Manage modal — user's submitted data stays read-only;
  admin edits Referral Code, Status, Amount (deal value, migration 31) and Message; WhatsApp +
  Email quick-contact buttons on each lead; Referral Code and Amount columns added to the table,
  search now covers referral codes
- ✅ Migration **31** (`migration_31_service_lead_manage.sql`): leads_service.amount + admin
  UPDATE policy
- ✅ **Visibility pass (R27)**: sales panel shows money everywhere it matters — service leads
  show Amount (deal value) + estimated commission, My Enrollments shows course/workshop price +
  estimated commission, Refer & Earn shows lead value, dashboard adds a "Potential Commission"
  card (my service deals value x my service %). Admin side: Referral Code now visible on course
  enrollments, workshop enrollments, internship applications and Payments (also in search +
  Excel/PDF/CSV exports); new **Promo Usage** admin page lists every payment that used a promo
  code (promo-code filter, total discount given, revenue received, full export)
- ✅ Friendly-message sweep: remaining setup-style errors (login, payments, submissions,
  catalogs) never show backend/setup details
- ✅ Migration **32** (`migration_32_offline_payments.sql`): payments.commission_eligible +
  offline_method + offline_note, leads_service.updated_at
- ✅ **Offline Payments (admin)**: Course/Workshop enrollment Manage modal and Career
  application modal get "Mark as Paid — Offline" — method (Cash / Direct UPI / Bank Transfer /
  Other), amount and a mandatory note; server-side edge `admin-offline-payment` (admin token
  verified) creates a paid payment record (OFF-… reference, offline method + note), expires any
  stuck online order and flips the enrollment/application to Paid (+ Enrolled). Commission
  checkbox decides whether the referral member earns on it (untick = attribution stays but no
  commission). Admin Payments shows an Offline badge + note and a Source filter (Online
  Cashfree / Offline). Deploy check: the admin-offline-payment function code must start with
  the comment mentioning 'admin-offline-payment' — if it mentions Cashfree, the wrong file was
  pasted (create-cashfree-order's code) and marking will fail with its validation error.
  If a "schema is out of sync" message appears after running migrations, run
  `NOTIFY pgrst, 'reload schema';` in the SQL Editor (refreshes Supabase's API schema cache);
  the offline insert no longer needs the new columns at all — method/note/commission flag are
  stored in the old raw_response (jsonb) column and unticking commission clears the referral
  code, so marking works even if the API schema cache is stale
- ✅ ~~Live sidebar badges~~ **REMOVED (R34, user request)**: sidebar count badges caused
  more noise than help — they are fully removed from all three panels (component + hooks
  deleted, layouts reverted clean); the `badges` actions were also removed from
  sales-data / mentor-data
- ✅ **Admin → Important Links**: new section under Dashboard listing every public page of the
  website (home, services, courses, workshops, blog, case studies, careers/internship/job,
  application status, contact, FAQs, sitemap) plus all three panel logins — every link opens
  in a new tab
- ✅ Sales dashboard breakdown: My Referrals shows counts by type (Courses · Workshops ·
  Services) and a new "Earnings Breakdown" row shows earned from Courses / Workshops /
  Services separately; Refer & Earn "Earned Commission" records now show the Referred
  Person's name (from the linked lead/application)
- ✅ Fix: course/workshop leads store price as formatted text ("₹5,999") — sales-data now
  parses it safely so Price / Est. Commission / Value show correctly for course & workshop
  referrals too (service deals were already fine)
- ✅ Sales panel polish: sidebar section renamed to **Services & Programs**; the green
  "Your … Commission: X%" box now shows for all three tabs (Service / Course / Workshop —
  rates come from the sales-data services action)
- ✅ **Service deal commission now pays out**: when admin sets Amount + Status "Done" on a
  service lead (migration 31 + 32), the member's service commission flows into Total Earned,
  Wallet (available to withdraw), dashboard today/month earnings and the Refer & Earn
  "Earned Commission" records (shown as "Service (Deal)") — withdrawal works on it like
  other earnings
- ✅ Popup crash-proofing: the course/workshop enroll modals snapshot the item title/id into
  state while open and render the payment popup with fully null-safe props — the popup can never
  read from a closed modal's context, so page load never crashes (real-browser tested: every
  public page + the full enroll → confirm-payment → Pay Now flow, zero console errors)
- ✅ Admin Payments upgrades: new **Promo Code** column (code shown per payment), search now
  matches promo codes too, and exports (CSV / Excel / PDF) include the full fee breakdown —
  Total Pay, base_amount, discount_amount, promo_code, platform_fee — alongside the existing fields
- ✅ **Payment Slip download** in Admin Payments: per-row "Download" button generates a
  certificate-style PDF receipt (logo + double blue border + digital note + website URL) with the
  complete payment info — item fee, promo code + discount, platform fees, total pay, student
  details, reference ID, order/payment IDs, method and date. Old payments (no base_amount) show
  Item Fee = Total Pay. jspdf stays dynamic; PDF uses `Rs.` (never ₹)
- ✅ RSS fully removed from the visible UI (footer Quick Links, footer bottom bar, Sitemap page
  card — all gone, user request): raw XML was ugly to open and no mainstream site shows RSS links
  in UI. The feed still works "in the background" — rss.xml is generated on every build and stays
  discoverable by machines (invisible auto-discovery `<link>` in index.html, robots/sitemap) for
  follow.it, feed readers and search engines
- ✅ follow.it subscription form removed (user request); RSS Feed link (with RSS icon) lives
  in the footer Quick Links → site's own rss.xml
- ✅ **follow.it subscription on the blog**: official follow.it **email subscription form embedded**
  in the blog hero (email field + Subscribe button, POSTs straight to follow.it) — the plain follow-link
  was erroring ("didn't get a valid rss feed"), the form is their supported on-site method. A small
  "or follow via RSS" link points to the site's own rss.xml
  in the blog hero — readers get an automatic notification (email/RSS) of every new article via
  follow.it (free newsletter service, powered by the site's rss.xml)
- ✅ RSS link relocated: off the blog hero → now a discreet "RSS" link in the footer bottom bar
  and a "Data Feeds" card on the Sitemap page (with sitemap.xml)
- ✅ **User-friendly error screens (no technical details shown)**: file/chunk load failures
  never reveal file paths — the error boundary and a global guard auto-reload once (loop-safe),
  then show a simple "We're making some updates / Something went wrong" screen with Reload + Contact Us.
  Mentor-facing service error messages simplified too. All remaining setup-style errors
  (admin/mentor/sales login, payments, lead submissions, catalog repos) now show friendly
  "temporarily unavailable — please try again / contact us" messages — never backend/setup details
- ✅ **Dynamic Sitemap + RSS (SEO core)**: `npm run build` now generates `public/sitemap.xml`
  (static pages + all published blogs, live courses/workshops, services, case studies with real lastmod
  dates) and `public/rss.xml` (latest 30 posts) straight from Supabase. Safe fallbacks: no env / DB
  unreachable → existing sitemap preserved, build never fails. RSS subscribe button on the blog,
  auto-discovery link in index.html, llms.txt updated. After publishing content: redeploy (sitemap
  refreshes) + Google Search Console "Request Indexing" for instant pickup
- ✅ **Mentor type enforcement hardened (round 2)**: the edge function now BLOCKS `item_create`
  for the wrong kind (workshop-only mentors cannot create courses — server-side 403), dashboard/profile
  counts and assigned lists use type-guarded data, Manage pages redirect on direct-URL access, the Add
  button hides for the wrong kind, and the layout refreshes the session profile on load so the nav
  updates without re-login
- ✅ **Mentor type enforcement everywhere**: workshop-only mentors don't see Course Registrations /
  Manage Courses (and vice versa); non-applicable commission is hidden, forced to 0, their Assign
  Programs modal blocks the other kind, per-item mentor dropdowns only list matching mentors, and the
  edge function refuses to serve the other kind's data (server-side guard)
- ✅ **Live SEO fixes**: site domain constant corrected to `https://www.nexrnntechnologies.in`
  (canonicals/OG/schema were pointing at a typo domain), default Open Graph + Twitter card +
  theme-color + canonical added to index.html, Local Business schema URL fixed, llms.txt refreshed
- ✅ Split commissions (course vs workshop) across panel, PDFs and earnings
- ✅ Wallet card on mentor dashboard
- ✅ Download Slip + Send Mail on both Withdrawal History (mentor) and Mentor Payments (admin)
- ✅ Mentor Contact Us: auto-fetched mentor info + WhatsApp Us (+91 75204 24645)
- ✅ Student email/mobile hidden from mentor registrations (UI + server)
- ✅ Analytics pagination/range/live-since fixes; ₹ prices; newest-first ordering; mentor gender;
    block/unblock with exact message; admin LOR download; Total Mentors stat; English-only UI text

## R34: Sales My Blogs (full parity), Announcements system, badges removed

- ✅ **Sidebar badges fully removed (user request)**: NavBadge component, useNavBadges /
  useAdminBadges hooks deleted; Admin/Sales/Mentor layouts back to clean nav; `badges`
  action removed from sales-data and mentor-data edges (deploy these to pick it up)
- ✅ **Sales → My Blogs (full mentor parity)**: sales members write/edit their own blog
  posts exactly like mentors — New Post form (title, category from blog_categories, tags,
  excerpt, cover image URL, markdown content + live word count, Published/Draft checkbox),
  list with Blog ID (NX-B-…), status badge, views, date, View (opens /blog/slug) and Edit;
  sales-data edge gets `blog_categories`, `blogs_list` and `blog_save` (author shows
  "Sales, NexRNN Technologies"; ownership-checked — a member can edit ONLY their own posts,
  403 otherwise; slug auto-generated title + time suffix, same as mentor)
- ✅ Migration **33** (`migration_33_sales_blog_announcements.sql`):
  `blog_posts.sales_uuid` (FK → sales_members, ON DELETE SET NULL) + index, and the new
  `announcements` table (audience mentor/sales, target_uuid NULL = whole audience, title,
  message, created_by, created_at) + (audience, created_at) index + admin-only RLS policy
- ✅ **Admin → Announcements**: one new section with Mentor / Sales tabs; compose form =
  Recipient ("All Mentors"/"All Sales" or one specific member from the dropdown) + title +
  message; full send history below (newest first) showing recipient (All badge or member
  name), date/time and message. Admin pages insert directly (existing admin RLS pattern)
- ✅ **Announcements visible in both panels**: Mentor → Announcements and Sales →
  Announcements nav items (megaphone icon) list notices addressed to the whole audience
  or personally to that member ("Only you" badge), newest first, with date + signature;
  a mentor never sees sales notices and vice versa (server-filtered by the edge function
  from the member's own session token — never from the frontend)

## R35: Announcements are now TWO-WAY (reactions + replies)

- ✅ Migration **34** (`migration_34_announcements_two_way.sql`): `announcement_reactions`
  (unique per member + emoji — one tap adds, second tap removes) and `announcement_replies`
  (member name stored with the reply so history survives member deletion) + admin-only
  RLS policies + indexes
- ✅ **Mentor/Sales panels react + reply**: every announcement card has an emoji reaction bar
  (👍 ❤️ 🎉 👏 🙏) with live counts — tap to react, tap again to remove (own reaction
  highlighted); a Reply box lists the discussion (member name + time, own replies highlighted
  as "You") and lets the member respond (up to 1000 chars). Optimistic UI — reaction shows
  instantly, then syncs with the server response
- ✅ New sales-data / mentor-data edge actions: `announcement_react` (server-side toggle;
  validates the announcement is actually visible to THIS member from their session token)
  and `announcement_reply`; the `announcements` action now returns reactions + replies
  (audience-filtered) with each notice
- ✅ **Admin sees the full response**: history under each notice now shows reaction chips
  (emoji + count, hover/long-press shows the member names who reacted) and every reply
  (name + date + message) — Mentor and Sales tabs stay separate; members only ever see
  replies on their own audience's notices
- ✅ Deploy steps for this round: run `migration_34_announcements_two_way.sql` in the Supabase
  SQL Editor, then redeploy BOTH edge functions (sales-data AND mentor-data)
- ✅ Deploy steps for this round: run `migration_33_sales_blog_announcements.sql` in the
  Supabase SQL Editor, then redeploy BOTH edge functions (sales-data AND mentor-data)

## R36: "Rejected" status option everywhere in the panels

- ✅ Migration **35** (`migration_35_rejected_statuses.sql`): widens the DB status checks so
  admin can set **Rejected** on mentor/sales withdrawals, mentor/sales issues and service
  leads (internship applications already had Rejected; course/workshop enrollments already
  had Declined; Cashfree payments keep their gateway statuses — "Failed" is the rejected
  state there, so the filter is simply labelled "Failed (Rejected)")
- ✅ Admin set-flows updated: Mentor Payments + Sales Team Payments withdrawal modal
  (Created / In progress / Payment Done / **Rejected**), Mentor/Sales Issues modal
  (Open / In Progress / Resolved / Closed / **Rejected**), Service Leads inline status
  (Pending / On Call / Done / Undone / **Rejected**) — all saved to the same Status column
  and included in exports automatically
- ✅ Members see it too: mentor/sales Withdrawal History and Issue list badges render
  Rejected (red) — a rejected withdrawal instantly returns the amount to the member's
  wallet (server-side wallet math now excludes Rejected requests from "pending"), so the
  member can raise a fresh request without admin intervention
- ✅ Deploy steps for this round: run `migration_35_rejected_statuses.sql` in the Supabase
  SQL Editor, then redeploy BOTH edge functions (sales-data AND mentor-data) for the
  wallet fix

## R37: Reject bug fix, Markdown everywhere, slug auto-generate, analytics_events removed

- ✅ **Bug fix — rejected withdrawals "re-appearing" on admin side**: the admin repos
  (withdrawalsRepo / salesWithdrawalsRepo) mapped unknown statuses back to "Created", so a
  request the admin had REJECTED (and the member correctly saw as Rejected) showed up again
  as "Created" in the admin Payments list after reload. Status whitelist now includes
  Rejected; admin list stays in sync with what the member sees (E2E verified: DB Rejected
  row renders REJECTED badge, reject → save → reload still REJECTED). Issues/leads pages
  were already reading raw statuses — checked all panels, no other whitelist exists
- ✅ **Markdown supported in every content text field**: detail pages now render markdown
  (headings, **bold**, *italic*, - lists, > quotes) via the shared MarkdownContent component
  — Workshop "Details About Workshop" + short description + FAQ answers (Course Detail too),
  Course short description + FAQ answers, Service short description. Career "Full Details",
  Case Study "Full Story" and blog content were already markdown. Admin form labels now say
  "(Markdown supported)" — Course (Short Description + FAQs), Workshop (Short Description,
  Details About Workshop, FAQs), Service (Short Description), Career (Full Details)
- ✅ **Slug = Auto-generate from Title on every admin form**: Course, Workshop and Service
  forms now auto-fill the slug from the title as you type (until you manually edit it, then
  your slug is respected) + an "Auto" button to regenerate; Career and Case Study forms
  (which already auto-generated) got the same "Auto" button. Label says
  "Auto-generate from Title"
- ✅ **analytics_events table removed (DB storage)**: client tracking now sends events ONLY
  to Google Analytics (GA4) / GTM — the Supabase insert is gone (utils/analytics.js).
  Admin "Traffic & Analytics" page, its route and nav item removed; Admin Dashboard's
  "Traffic (Last 7 Days)" card (page views / WhatsApp / phone clicks / unique users) removed
  — site traffic now lives in your GA4 dashboard instead of the database. Lead/enrollment/
  payment counters on the dashboard are unaffected. Migration **36**
  (`migration_36_drop_analytics_events.sql`) drops the table — run it to actually free the
  storage
- ✅ Deploy steps for this round: run `migration_36_drop_analytics_events.sql` in the
  Supabase SQL Editor (frees the storage), then redeploy as usual (no edge changes this
  round — only if you still have an undeployed sales-data/mentor-data from earlier rounds)
- ✅ Full sweep after changes: production build ✓, oxlint 8 warnings / 0 errors, real-browser
  E2E 18/18 (reject badge + PATCH, slug auto/manual/Auto button, markdown labels, analytics
  removal, dashboard intact, mobile 390px) — 0 console errors

## R38: Mentor gets the full admin Course/Workshop/Blog forms + Sales full blog form

- ✅ **Mentor Manage Courses / Manage Workshops = admin-level forms** (same fields the admin
  form has; mentor-data whitelist extended server-side with the same sanitization):
  - Course: Icon, Short Description (Markdown supported), Pricing Type (Paid/Free),
    Original/Final Price, Discount %, "Demo pricing" label, Demo Video URL, Projects,
    Certificate + Mentorship toggles, certificate sample preview toggle, Topics/Curriculum,
    What You'll Learn, Who Should Join (one per line), WhatsApp Group Link (shown on the
    payment success page), FAQs editor (answers support Markdown), Sort Order, Active
  - Workshop: Banner URL **+ Upload** (goes to the workshop-assets bucket through the edge
    function with preview), Workshop Date & Time, Registration Last Date & Time (auto-complete
    note), Details About Workshop (Markdown supported), Pricing fields, Workshop Video URL,
    certificate sample toggle, WhatsApp Group Link, Mentor Name + Short Introduction
    (empty = section hidden), FAQs editor, Sort Order, Active
  - Slug on both: Auto-generate from Title while typing + "Auto" button (manual edit respected)
  - Edit prefill loads all fields back from the server; Batch ID stays fixed as before;
    mentor still cannot delete items and still only sees/edits their own assigned programs
    (server-side ownership + mentor-type guards unchanged)
- ✅ **Mentor + Sales My Blogs = admin-level article form**: Article Title, URL Slug
  (Auto-generate from Title + Auto button), Category, Publication Date, Cover Image URL
  **or Upload** (blog-assets bucket via edge, with preview), Short Excerpt, Article Content
  (Markdown supported, live word count, format hints), Author Name + Author Role (defaults:
  member's name / "Mentor, NexRNN Technologies" or "Sales, NexRNN Technologies"), Reading
  Time, Author Bio (About the Author), Call-to-Action button (Text + Link — internal /course
  style or full https:// links) shown at the end of the article, Tags, Published-immediately
  checkbox (uncheck = draft). Blogs list shows the same cards as before; edit prefills
  everything (server rows now carry author_bio / cta_text / cta_url)
- ✅ Edge function updates (mentor-data AND sales-data): `item_create` / `item_save` accept the
  full admin field whitelist (server-sanitized: lengths, counts, discount 0-99, faq caps),
  `items` returns the extended fields for prefill (+ raw ISO datetimes), NEW
  `item_banner_upload` (mentor, workshop-assets) and `blog_cover_upload` (mentor + sales,
  blog-assets) — 6 MB, JPG/PNG/WEBP/GIF; `blog_save` now stores slug (manual or auto),
  published_at (publication date), reading_time, author_bio, cta_text, cta_url and editable
  author name/role; `blogs_list` returns them
- ✅ No DB migration needed this round (all blog_posts / courses / workshops columns already
  exist). Deploy step: redeploy BOTH edge functions (sales-data AND mentor-data)
- ✅ Real-browser E2E 65/65 (every form label present, slug auto/manual/Auto, save payloads
  carry all admin fields, edit prefills, workshop form correctly hides course-only fields,
  sales blog parity, mobile 390px) — 0 console errors; build ✓, oxlint 8 warnings / 0 errors

## R39: Sales My Blogs redirect bug fixed + final legal policies live

- ✅ **Bug fix — Sales → My Blogs redirected to the mentor panel**: the sales blog page was
  still using the MENTOR data hook (a leftover from the previous round's clone), so it called
  the mentor-data edge function with the sales token, got a 401, and the mentor hook bounced
  the user to the mentor login. Fixed: the page now uses the sales hook/edge end-to-end
  (verified in a real browser: the sales blog page makes ZERO mentor-data calls, stays on
  /nexrnn/panel/sales/my-blogs and renders the member's posts)
- ✅ **Final legal policies live** (draft disclaimers removed everywhere):
  - /privacy-policy — full 17-section policy (what we collect, how, usage, contact rules,
    payments, sharing, cookies, retention, your rights, children's privacy, changes,
    agreement) — Last Updated: August 30, 2026
  - /terms-and-conditions — full 26-section terms (about us, fair website use, services,
    service agreements, course/workshop enrollment, content access rules, certificates,
    payments, refunds summary, client responsibilities, scope changes, IP ownership,
    client content, marketing results, third-party platforms, accuracy, availability,
    liability, termination, privacy, governing law (India), contact) — Last Updated:
    August 30, 2026
  - /refund-policy — full 12-section refund & cancellation policy (course/workshop refunds
    + 24–48h duplicate-payment window, service refund stages, how to request, review steps,
    5–7 business day timelines, non-refundables) — Last Updated: August 30, 2026
  - All three pages are data-driven sections (easy to edit later), mobile friendly, still
    linked from the footer, and NO "Draft template / not reviewed by a legal professional"
    banners remain anywhere on the site
- ✅ E2E 31/31 (redirect regression incl. request-level check, all headings, no draft text,
  footer links, viewport fit) — 0 console errors; build ✓, oxlint 8 warnings / 0 errors.
  No DB or edge changes this round — deploy the site and you're done
