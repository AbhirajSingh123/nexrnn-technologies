/**
 * ============================================================
 * DYNAMIC SITEMAP + RSS GENERATOR (build-time)
 * ============================================================
 * `npm run build` ke waqt chalta hai. Supabase se publish content
 * laakar public/sitemap.xml + public/rss.xml bana deta hai —
 * isliye admin se naya blog/course publish karte hi next deploy
 * par dono files fresh ho jaati hain.
 *
 * Safe by design:
 *  - Supabase configured nahi (ya fetch fail) -> build FAIL nahi hota,
 *    existing public/sitemap.xml waisi ki waisi rehti hai.
 *  - RSS ka tab bhi valid skeleton bana jaata hai (404 na ho).
 *
 * Google sitemap-ping endpoint band ho chuka hai - naye pages ke liye
 * Google Search Console "Request Indexing" use karo (README me steps).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const PUBLIC = path.join(ROOT, 'public');
const DOMAIN = 'https://www.nexrnntechnologies.in';
const TODAY = new Date().toISOString().slice(0, 10);

// ---------- .env reader (vite ke bina node script, isliye khud padhte hain) ----------
function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) {
        let v = m[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        if (!env[m[1]]) env[m[1]] = v;
      }
    }
  } catch {
    /* .env na ho to ignore */
  }
  return env;
}

const env = loadEnv();
const SB_URL = env.VITE_SUPABASE_URL || '';
const SB_KEY = env.VITE_SUPABASE_ANON_KEY || '';

// ---------- XML helpers ----------
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const dateOnly = (iso) => (iso ? String(iso).slice(0, 10) : TODAY);

// ---------- Static pages (careers detail + forms jaan-boojh ke nahi: gate/not-hiring rule) ----------
const STATIC_URLS = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/services', changefreq: 'monthly', priority: '0.9' },
  { loc: '/course', changefreq: 'monthly', priority: '0.9' },
  { loc: '/workshop', changefreq: 'weekly', priority: '0.9' },
  { loc: '/blog', changefreq: 'daily', priority: '0.9' },
  { loc: '/case-studies', changefreq: 'monthly', priority: '0.8' },
  { loc: '/faqs', changefreq: 'monthly', priority: '0.7' },
  { loc: '/careers', changefreq: 'daily', priority: '0.9' },
  { loc: '/about-us', changefreq: 'monthly', priority: '0.7' },
  { loc: '/Contect-us', changefreq: 'monthly', priority: '0.7' },
  { loc: '/sitemap', changefreq: 'monthly', priority: '0.5' },
  { loc: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/terms-and-conditions', changefreq: 'yearly', priority: '0.3' },
  { loc: '/refund-policy', changefreq: 'yearly', priority: '0.3' },
];

/** Supabase REST se rows laao (fail -> []) */
async function fetchRows(table, searchParams) {
  const qs = new URLSearchParams(searchParams).toString();
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${qs}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const configured = Boolean(SB_URL && SB_KEY);
  let blogs = [];
  let courses = [];
  let workshops = [];
  let services = [];
  let caseStudies = [];

  if (!configured) {
    console.warn('[sitemap] Supabase env nahi mila — sitemap.xml untouched, RSS skeleton only.');
  } else {
    try {
      const [b, c, w, s, cs] = await Promise.all([
        fetchRows('blog_posts', {
          select: 'slug,title,excerpt,cover_image_url,published_at,updated_at',
          is_published: 'eq.true',
          order: 'published_at.desc',
          limit: '500',
        }),
        fetchRows('courses', { select: 'slug,updated_at', active: 'eq.true', order: 'created_at.desc', limit: '500' }),
        fetchRows('workshops', { select: 'slug,updated_at', active: 'eq.true', order: 'created_at.desc', limit: '500' }),
        fetchRows('services', { select: 'slug,updated_at', active: 'eq.true', order: 'created_at.desc', limit: '200' }),
        fetchRows('case_studies', {
          select: 'slug,published_at,updated_at',
          is_published: 'eq.true',
          order: 'published_at.desc',
          limit: '300',
        }),
      ]);
      blogs = b ?? [];
      courses = c ?? [];
      workshops = w ?? [];
      services = s ?? [];
      caseStudies = cs ?? [];
      console.log(
        `[sitemap] Supabase: ${blogs.length} blogs, ${courses.length} courses, ${workshops.length} workshops, ${services.length} services, ${caseStudies.length} case studies`
      );
    } catch (err) {
      console.warn(`[sitemap] Supabase fetch fail (${err.message}) — existing sitemap.xml safe hai.`);
    }
  }

  // ---------- SITEMAP ----------
  const haveDynamic = blogs.length || courses.length || workshops.length || services.length || caseStudies.length;
  if (configured && haveDynamic) {
    const urls = [
      ...STATIC_URLS,
      ...services.map((r) => ({ loc: `/services/${r.slug}`, lastmod: dateOnly(r.updated_at), changefreq: 'monthly', priority: '0.7' })),
      ...courses.map((r) => ({ loc: `/course/${r.slug}`, lastmod: dateOnly(r.updated_at), changefreq: 'monthly', priority: '0.8' })),
      ...workshops.map((r) => ({ loc: `/workshop/${r.slug}`, lastmod: dateOnly(r.updated_at), changefreq: 'weekly', priority: '0.8' })),
      ...caseStudies.map((r) => ({ loc: `/case-studies/${r.slug}`, lastmod: dateOnly(r.updated_at || r.published_at), changefreq: 'monthly', priority: '0.6' })),
      ...blogs.map((r) => ({ loc: `/blog/${r.slug}`, lastmod: dateOnly(r.updated_at || r.published_at), changefreq: 'monthly', priority: '0.7' })),
    ];
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (u) =>
            `  <url><loc>${DOMAIN}${esc(u.loc)}</loc><lastmod>${u.lastmod || TODAY}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
        )
        .join('\n') +
      '\n</urlset>\n';
    fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'), xml);
    console.log(`[sitemap] public/sitemap.xml written (${urls.length} URLs).`);
  } else {
    console.log('[sitemap] Dynamic data nahi mila — existing public/sitemap.xml preserved.');
  }

  // ---------- RSS ----------
  const rssPath = path.join(PUBLIC, 'rss.xml');
  const channel =
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n` +
    `  <title>NexRNN Technologies — Blog</title>\n` +
    `  <link>${DOMAIN}/blog</link>\n` +
    `  <description>Digital marketing, AI and technology insights from NexRNN Technologies, Lucknow.</description>\n` +
    `  <language>en-in</language>\n` +
    `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;

  if (blogs.length) {
    const items = blogs
      .slice(0, 30)
      .map(
        (r) =>
          `  <item>\n` +
          `    <title>${esc(r.title)}</title>\n` +
          `    <link>${DOMAIN}/blog/${esc(r.slug)}</link>\n` +
          `    <guid isPermaLink="true">${DOMAIN}/blog/${esc(r.slug)}</guid>\n` +
          `    <pubDate>${new Date(r.published_at || Date.now()).toUTCString()}</pubDate>\n` +
          `    <description><![CDATA[${(r.excerpt || r.title || '').slice(0, 500)}]]></description>\n` +
          `  </item>`
      )
      .join('\n');
    fs.writeFileSync(rssPath, channel + items + '\n</channel>\n</rss>\n');
    console.log(`[rss] public/rss.xml written (${Math.min(blogs.length, 30)} items).`);
  } else if (!fs.existsSync(rssPath)) {
    // Pehli baar, koi blog nahi: valid khali channel (404 na ho)
    fs.writeFileSync(rssPath, channel + '</channel>\n</rss>\n');
    console.log('[rss] public/rss.xml skeleton written (no posts yet).');
  } else {
    console.log('[rss] Koi blog nahi mila — existing rss.xml preserved.');
  }
}

main().catch((err) => {
  // Build kabhi is script se fail na ho
  console.warn('[sitemap] skipped:', err.message);
});
