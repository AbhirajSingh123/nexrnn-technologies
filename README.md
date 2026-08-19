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
