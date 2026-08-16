# NexRNN Technologies — Website

Multi-page digital agency + courses website for NexRNN Technology, Lucknow. Built with React 19, Vite, React Router, Tailwind CSS v4, and Framer Motion.

## Getting Started

```bash
npm install
npm run dev       # start dev server
npm run build     # production build (outputs to dist/)
npm run preview   # preview the production build locally
```

## Routes

| Path | Page |
|---|---|
| `/` and `/Home` | Home (same component, both render it) |
| `/services` | All services |
| `/course` | All active courses |
| `/course/:slug` | Course detail (e.g. `/course/digital-marketing`) |
| `/about-us` | About Us |
| `/Contect-us` and `/contact-us` | Contact Us (both render the same page) |
| any other path | 404 page |

## Project Structure

```
src/
  components/
    layout/      Navbar, Footer
    home/        Hero, StatsBand, AboutTeaser, ServicesPreview, WhyChooseUs,
                 DigitalGrowthProcess, TechnologySection, CoursesPreview,
                 Portfolio, Testimonials, CTALeadSection
    services/    ServiceCard
    courses/     CourseCard
    shared/      Reveal, SectionHeading, LeadForm, ErrorBoundary
  pages/         Home, Services, Courses, AboutUs, ContactUs, NotFound
  pages/course/  CourseDetail (dynamic route)
  layouts/       RootLayout (Navbar + Footer wrapper)
  data/          services.js, courses.js, portfolio.js, testimonials.js
  constants/     siteData.js (business info, nav, hero copy, process steps, etc.)
  utils/         validation.js (Zod schemas), iconMap.js
  services/      api.js (Axios instance, ready for a backend)
```

## Data-Driven Architecture

Nothing is hardcoded in JSX. To add a new **service**, add an object to `src/data/services.js`.
To add a new **course**, add an object to `src/data/courses.js` with `active: true` — it will
automatically appear on `/course` and get a working `/course/:slug` detail page. Eleven additional
courses from your spec (Python, Data Science, ML, Cybersecurity, etc.) are already stubbed in
that file with `active: false` — flip the flag and fill in the full course object (topics,
whatYouLearn, curriculum, faqs, etc., following the pattern of the three existing courses) to launch them.

## What's demo/placeholder content (as agreed — no fake info)

- **Pricing** on all three courses is marked `isDemoPrice: true` and shown with a "Demo pricing" label.
- **Portfolio** items (`src/data/portfolio.js`) are all marked `isDemo: true` and labeled on-page.
- **Testimonials** (`src/data/testimonials.js`) are all marked `isDemo: true` and labeled on-page.
- **Social links** (`src/constants/siteData.js` → `SOCIAL_LINKS`) are `#` placeholders — icons show on the site but don't link anywhere real yet.

Replace these once real data is available — the labels will disappear automatically once you
remove the `isDemo`/`isDemoPrice` flags.

## What still needs wiring

- **Lead form destination**: both `LeadForm.jsx` (used on Home) and `ContactUs.jsx` currently
  simulate submission only — nothing is sent anywhere. See the comment block in
  `src/components/shared/LeadForm.jsx` for where to add a real integration (WhatsApp API, email
  via a backend, or a Google Sheets webhook are common low-effort options).
- **Real course details** for the 11 stubbed-but-inactive courses.
- **Real portfolio work and testimonials** once available to share.
- **Social media URLs**.

## Deployment (nexrnntechnology.in)

This is a client-side-routed single-page app, so your host needs to serve `index.html` for
every path (otherwise direct visits to e.g. `/services` will 404). Included:

- `vercel.json` — rewrite config for Vercel
- `public/_redirects` — for Netlify (safe to ignore/delete on other hosts)

If deploying to Apache/shared hosting instead, add an `.htaccess` with a rewrite rule to
`index.html` for unmatched paths.

## Environment Variables

```
VITE_API_BASE_URL=https://api.yourdomain.com
```
