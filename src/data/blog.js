/**
 * Static fallback data for Blog Categories & Posts
 * Used when Supabase is not configured or offline.
 */

// "About the Author" card ka default paragraph.
// Admin har blog ke liye apna bio likh sakta hai (Admin -> Blog form).
export const DEFAULT_AUTHOR_BIO =
  'Contributing growth strategies and technical insights to help ambitious businesses in Lucknow and beyond scale through digital marketing, websites, and modern AI automation.';

export const BLOG_CATEGORIES = [
  {
    slug: 'digital-marketing',
    name: 'Digital Marketing',
    description: 'Strategies, ROI tactics, Google & Meta Ads, and performance marketing.',
    sortOrder: 1,
  },
  {
    slug: 'web-development',
    name: 'Web & App Development',
    description: 'Modern web technologies, high-converting UX/UI, and speed optimization.',
    sortOrder: 2,
  },
  {
    slug: 'ai-automation',
    name: 'AI & Automation',
    description: 'Leveraging generative AI and workflow automation to scale business productivity.',
    sortOrder: 3,
  },
  {
    slug: 'business-growth-seo',
    name: 'SEO & Business Growth',
    description: 'Organic search engine visibility, Google Business Profile, and brand positioning.',
    sortOrder: 4,
  },
];

export const BLOG_POSTS = [
  {
    id: 'post-5',
    slug: 'google-business-profile-seo-complete-guide',
    title: 'The Complete Guide to Ranking #1 on Google Business Profile (Local Map Pack)',
    categorySlug: 'business-growth-seo',
    categoryName: 'SEO & Business Growth',
    excerpt: 'Dominate local search results. How to optimize your Google Business listing, manage reviews, and capture nearby customers effortlessly.',
    content: `## The Value of the Google 3-Pack

When potential customers in your city search for services "near me", over 70% of clicks go to the top 3 listings on Google Maps. If your Google Business Profile (GBP) is incomplete or unoptimized, you are handing warm leads to your competitors daily.

### Essential GBP Optimization Checklist

1. **Accurate Primary & Secondary Categories:** Select the exact primary category that reflects your core business. Add relevant secondary categories (e.g., Marketing Agency + Web Hosting Company + Internet Marketing Service).
2. **Geotagged Real Photos:** Upload weekly genuine photos of your office, team, client meetings, and project milestones. Real photos outperform stock images 10:1 in user engagement.
3. **Consistent NAP Information:** Ensure Name, Address, and Phone number match identically across your website, directory citations, and social profiles.
4. **The Review Ingestion Engine:** Never wait passively for reviews. Create a direct short link with a QR code and ask satisfied clients to mention specific keywords (e.g., "best digital marketing course", "great website design").
5. **Weekly Updates / Posts:** Treat GBP like a social feed. Post weekly offers, updates, and case studies with a direct Call button.

Consistent GBP optimization is one of the highest-ROI activities for local businesses because it captures customers at the exact moment of purchase intent.`,
    coverImageUrl: '',
    ctaText: 'Get a Free Local SEO Audit',
    ctaUrl: '/Contect-us',
    authorName: 'Abhiraj Singh',
    authorRole: 'Founder & Lead Strategist',
    tags: ['Local SEO', 'Google Maps', 'GBP', 'Lead Generation'],
    readingTime: '5 min read',
    publishedAt: '2026-08-26T16:00:00.000Z',
    isPublished: true,
    sortOrder: 5,
  },
  {
    id: 'post-4',
    slug: 'practical-ai-tools-for-business-automation-in-2026',
    title: 'Practical AI Tools Every Growing Business Should Implement in 2026',
    categorySlug: 'ai-automation',
    categoryName: 'AI & Automation',
    excerpt: 'Move beyond hype. Here are real-world AI automations for customer support, CRM data entry, and marketing workflows that save 15+ hours weekly.',
    content: `## Beyond Chatbots: Real Operational AI for Small & Mid Businesses

While the media focuses on conversational chatbots, the true transformative power of Artificial Intelligence in 2026 lies in backend business automation and decision workflows.

### 1. Automated Lead Qualification via WhatsApp & Webhook

Instead of manually checking form submissions hours after a lead inquires:
- An AI workflow ingests the submission instantly.
- It parses user intent, checks budget parameters, and pings the sales rep via Slack or WhatsApp with pre-scored lead info.
- The user receives an instant, personalized WhatsApp message offering a calendar booking link.

### 2. Intelligent Content Repurposing

Creating daily content across YouTube, LinkedIn, Instagram, and your company blog can quickly overwhelm a lean marketing team. Automated pipelines now allow:
- Recording a single long-form master video or podcast.
- AI extracting key insights, generating short-form reel clips with captions, and drafting blog summaries tailored for SEO.

### 3. Continuous Customer Feedback Analysis

Scrape or ingest Google Reviews and feedback tickets automatically to generate sentiment reports and flag dissatisfied clients before they churn.

At NexRNN Technologies, we not only integrate these automation workflows for client businesses, but also teach them hands-on in our AI & Automation workshops.`,
    coverImageUrl: '',
    ctaText: 'Explore AI Automation Services',
    ctaUrl: '/services',
    authorName: 'NexRNN AI Lab',
    authorRole: 'Automation & AI Specialists',
    tags: ['AI', 'Workflow Automation', 'Productivity', 'Growth'],
    readingTime: '5 min read',
    publishedAt: '2026-08-23T09:45:00.000Z',
    isPublished: true,
    sortOrder: 4,
  },
  {
    id: 'post-3',
    slug: 'mastering-meta-ads-creative-fatigue-and-audience-scaling',
    title: 'Mastering Meta Ads: How to Beat Creative Fatigue and Scale Profitably',
    categorySlug: 'digital-marketing',
    categoryName: 'Digital Marketing',
    excerpt: 'Creative is the new targeting. Discover how to build video hooks, carousel variations, and audience funnels that keep CPA low.',
    content: `## Why Traditional Audience Targeting on Meta is Changing

Since the rollout of Advantage+ and algorithmic shifts across Instagram and Facebook, ad creative has officially become the primary targeting lever. If your video or image creative fails to grab attention in the first 3 seconds, algorithm distribution drops drastically.

### The 3-Second Hook Rule

The most successful Meta ad creatives follow a proven structure:
1. **The Hook (0-3s):** Call out the exact problem or user persona directly.
2. **The Agitation & Solution (3-15s):** Show what happens without the solution and introduce your offer clearly.
3. **The Proof (15-25s):** Quick screenshot, before/after result, or client review clip.
4. **The CTA (25-30s):** Clear instruction on what action to take (e.g. "Tap Book Now below").

### How to Combat Creative Fatigue

When ad frequency exceeds 2.5 on a cold audience, Click-Through Rates (CTR) inevitably plunge and Cost Per Lead (CPL) spikes. To scale profitably:
- Refresh ad angles weekly with new hooks and headline copy.
- Test UGC (User Generated Content) style videos against sleek graphic carousels.
- Separate retargeting into warm engagement funnels.`,
    coverImageUrl: '',
    authorName: 'Pooja Sharma',
    authorRole: 'Senior Performance Marketer',
    tags: ['Meta Ads', 'Instagram Marketing', 'Creative Strategy'],
    readingTime: '6 min read',
    publishedAt: '2026-08-20T11:15:00.000Z',
    isPublished: true,
    sortOrder: 3,
  },
  {
    id: 'post-2',
    slug: 'why-modern-businesses-need-speed-optimized-custom-websites',
    title: 'Why Template Websites Fail and Why Modern Brands Need Speed-Optimized Builds',
    categorySlug: 'web-development',
    categoryName: 'Web & App Development',
    excerpt: 'Learn why slow, bloated website themes hurt conversion rates and how modern lightweight frameworks drive superior sales and engagement.',
    content: `## The Silent Conversion Killer: Slow Page Speed

Every single second of delay in mobile page load time slashes conversions by up to 20%. Today’s consumers expect websites to respond instantaneously. Heavy WordPress themes bloated with 40+ plugins, unoptimized JavaScript, and massive imagery cause frustrating bounce rates.

### The Problem With Off-The-Shelf Templates

1. **Massive Code Bloat:** Generic templates pack code for hundreds of features you will never use.
2. **Security Vulnerabilities:** Outdated plugins are the leading cause of compromised websites.
3. **Poor Mobile Responsiveness:** Half-baked responsive styles break on smaller smartphone screens.

### The Modern Tech Stack Advantage

At NexRNN Technologies, we engineer web solutions using modern stacks such as React, Tailwind CSS, and headless architectures:
- **Instantaneous transitions:** Single-page navigation feels fluid and app-like.
- **Top Lighthouse scores:** Clean CSS and minified JS deliver 95+ performance scores on Google PageSpeed Insights.
- **Built for SEO:** Proper semantic HTML hierarchy, dynamic meta tags, and structured JSON-LD schemas out of the box.

### The Bottom Line

Your website is your 24/7 digital salesperson. Investing in clean, high-performance architecture pays dividends across SEO rankings, customer trust, and sales conversion.`,
    coverImageUrl: '',
    authorName: 'NexRNN Tech Team',
    authorRole: 'Full Stack Engineering Team',
    tags: ['Web Development', 'React', 'Performance', 'UI/UX'],
    readingTime: '4 min read',
    publishedAt: '2026-08-16T14:30:00.000Z',
    isPublished: true,
    sortOrder: 2,
  },
  {
    id: 'post-1',
    slug: 'how-to-scale-local-business-with-google-ads',
    title: 'How to Scale Your Local Business in Lucknow with High-ROI Google Ads',
    categorySlug: 'digital-marketing',
    categoryName: 'Digital Marketing',
    excerpt: 'A step-by-step practical blueprint on setting up search campaigns, negative keywords, and local targeting that actually generate qualified inquiries.',
    content: `## Why Most Local Businesses Waste Budget on Google Ads

Running Google Ads for a local business in competitive Indian markets like Lucknow or NCR requires precision. Often, business owners complain that their ad spend vanished in days with zero real customer inquiries. The root cause? Broad match keywords without negative keyword filters, sending unqualified search traffic that drains the budget.

### 1. Structure Your Campaigns by High-Intent Keywords

Never target generic keywords like "best marketing" or "good doctor". Instead, focus on high buyer-intent search phrases:
- Service + City / Locality (e.g. *digital marketing agency Gomti Nagar*)
- Urgent or transaction phrases (e.g. *emergency AC repair near me*)

### 2. Location Radius & Bid Adjustments

In tier-1 and tier-2 cities, traffic behaves differently across pin codes. Pinpoint your target delivery or service radius within 5-15 km rather than setting a broad state-wide campaign.

### 3. Dedicated Landing Pages Beat Homepages Every Time

Sending paid ad clicks to a generic homepage is the fastest way to drop conversion rates below 2%. A dedicated landing page with:
- A clear hook and value proposition above the fold
- Direct WhatsApp click-to-chat button
- A short 3-field inquiry form (Name, Phone, Service)
- Social proof and real customer testimonials

### Next Steps for Your Business

Whether you run a clinic, coaching institute, or retail brand, continuous conversion tracking is non-negotiable. At NexRNN Technologies, our performance marketing team sets up end-to-end UTM parameters and server-side tracking to ensure every rupee spent brings measurable returns.`,
    coverImageUrl: '',
    authorName: 'Abhiraj Singh',
    authorRole: 'Founder & Lead Strategist',
    tags: ['Google Ads', 'Local SEO', 'PPC', 'ROI Strategy'],
    readingTime: '5 min read',
    publishedAt: '2026-08-10T10:00:00.000Z',
    isPublished: true,
    sortOrder: 1,
  },
];
