-- Seed data generated from the site's existing static content.
-- Run this AFTER schema.sql, once, in Supabase SQL Editor.

-- ---------- SERVICES ----------
insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('google-ads', 'search', 'Google Ads / PPC', 'Reach customers actively searching for your products and services with targeted Google Ads campaigns.', '["Get in front of high-intent customers","Pay only for real clicks and results","Full visibility into performance and spend","Scale up what’s working, cut what isn’t"]'::jsonb, '["Search Ads","Display Ads","Conversion Tracking","Keyword Research","Campaign Management","Performance Optimization","Remarketing"]'::jsonb, 'Start Google Ads Campaign', true, 0)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('meta-ads', 'megaphone', 'Meta Ads', 'Run high-performing Facebook and Instagram ad campaigns built around your audience and goals.', '["Reach the right audience by interest and behavior","Drive leads, traffic or conversions — your choice","Creative testing to find what actually converts","Retargeting to recover lost visitors"]'::jsonb, '["Facebook Ads","Instagram Ads","Lead Generation","Traffic Campaigns","Conversion Campaigns","Retargeting","Audience Targeting","Creative Testing"]'::jsonb, 'Run Meta Ads', true, 1)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('social-media-marketing', 'share2', 'Social Media Marketing', 'Build a consistent, engaging presence across the platforms that matter to your audience.', '["Stay consistently visible to your audience","Build trust through regular, planned content","Grow engagement instead of just posting","Clear monthly reporting on what’s working"]'::jsonb, '["Instagram","Facebook","LinkedIn","Content Strategy","Post Creation","Content Calendar","Audience Engagement","Analytics","Growth Strategy"]'::jsonb, 'Grow My Social Media', true, 2)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('google-business-profile', 'map-pin', 'Google Business Profile', 'Optimize your Google Business Profile (Google My Business / GMB) to win local search visibility.', '["Show up when local customers search for you","Build trust with a complete, active profile","Turn reviews into a growth asset","Stand out against local competitors"]'::jsonb, '["Profile Setup","Optimization","Local SEO","Business Information","Photos","Posts","Reviews Strategy","Local Visibility"]'::jsonb, 'Improve My Local Presence', true, 3)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('website-development', 'code', 'Website Development', 'Fast, responsive, professionally built websites and web applications for any business need.', '["A website that actually converts visitors","Fast, mobile-friendly, professional experience","Built to scale as your business grows","Ongoing support after launch"]'::jsonb, '["Business Websites","Landing Pages","Portfolio Websites","E-commerce Websites","Responsive Websites","React Websites","WordPress Websites","Custom Web Applications","Website Maintenance"]'::jsonb, 'Build My Website', true, 4)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('website-design', 'layout', 'Website Design', 'Clean, modern UI/UX design that represents your brand and converts visitors into leads.', '["A design that reflects your brand properly","Clearer user journeys that drive action","Mobile-first, modern visual language","Design decisions backed by conversion thinking"]'::jsonb, '["UI/UX Design","Wireframing","Brand-Aligned Visuals","Mobile-First Layouts","Conversion-Focused Design"]'::jsonb, 'Design My Website', true, 5)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('seo', 'trending-up', 'SEO', 'Improve your visibility on Google with technical, on-page and local SEO built for the long term.', '["Long-term, compounding organic traffic","Fix technical issues holding your site back","Rank for the searches that matter to you","Clear reporting on rankings and traffic"]'::jsonb, '["Technical SEO","On-Page SEO","Keyword Research","Local SEO","Content Optimization","Google Search Visibility","SEO Audits"]'::jsonb, 'Improve My Rankings', true, 6)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('social-media-management', 'calendar', 'Social Media Management', 'End-to-end handling of your social channels — planning, posting, and engagement.', '["One less thing to manage yourself","Consistent posting without the daily effort","Faster responses to your community","Monthly visibility into performance"]'::jsonb, '["Content Planning","Scheduled Posting","Community Management","Monthly Reporting"]'::jsonb, 'Manage My Socials', true, 7)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('graphic-design', 'palette', 'Graphic Design', 'Professional creatives for every platform — from social posts to marketing banners.', '["Consistent, professional visuals everywhere","Faster turnaround on creative requests","Designs built for each specific platform","A cohesive look across your brand"]'::jsonb, '["Social Media Posts","Business Cards","Digital Business Cards","YouTube Thumbnails","Instagram Creatives","LinkedIn Creatives","Marketing Banners"]'::jsonb, 'Get Design Support', true, 8)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('branding', 'gem', 'Branding', 'Build a consistent brand identity that stands out and builds trust with your audience.', '["A brand that looks credible and consistent","Clear guidelines your team can follow","Stronger recall and recognition","A foundation every other asset builds on"]'::jsonb, '["Brand Identity","Logo Direction","Promotional Designs","Brand Guidelines"]'::jsonb, 'Build My Brand', true, 9)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('video-editing', 'clapperboard', 'Video Editing', 'Polished, platform-ready video content edited for maximum engagement.', '["Professional-quality video without an in-house editor","Content optimized for each platform","Faster turnaround for regular posting","More engagement from better-paced content"]'::jsonb, '["Promotional Videos","Social Media Videos","YouTube Content","Reels"]'::jsonb, 'Edit My Videos', true, 10)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('ai-video-creation', 'sparkles', 'AI Video Creation', 'Fast, cost-effective video content produced using modern AI video tools.', '["Lower cost than traditional video production","Much faster turnaround","Great for high-volume short-form content","Easy to iterate and test variations"]'::jsonb, '["AI-Generated Video","Short-Form Videos","Rapid Turnaround","Script-to-Video"]'::jsonb, 'Create AI Videos', true, 11)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('brand-promotion', 'rocket', 'Brand Promotion', 'Coordinated promotional campaigns to get your brand in front of the right audience.', '["Coordinated push across multiple channels","Clear campaign goals and timeline","Better reach than one-off posts","Momentum for launches and offers"]'::jsonb, '["Campaign Planning","Cross-Platform Promotion","Influencer Outreach Guidance","Launch Campaigns"]'::jsonb, 'Promote My Brand', true, 12)
on conflict (slug) do nothing;

insert into services (slug, icon, title, short_description, benefits, features, cta, active, sort_order)
values ('digital-marketing-strategy', 'compass', 'Digital Marketing Strategy', 'A clear, customized digital roadmap tying every channel together toward your business goals.', '["One clear plan instead of scattered efforts","Budget allocated to what actually works","A roadmap you can execute or hand off","Strategy tied to real business goals"]'::jsonb, '["Market Research","Channel Strategy","Budget Planning","Growth Roadmap"]'::jsonb, 'Get a Strategy', true, 13)
on conflict (slug) do nothing;

-- ---------- COURSES ----------
insert into courses (slug, icon, title, short_description, duration, level, mode, original_price, price, discount_percent, is_demo_price, demo_video_url, has_certificate_sample, projects, certificate, mentorship, topics, what_you_learn, who_should_join, faqs, active, sort_order)
values ('digital-marketing', 'megaphone', 'Digital Marketing', 'A practical, campaign-focused course covering everything from SEO to paid ads to analytics.', '3 Months', 'Beginner to Advanced', 'Online / Offline (Lucknow)', '₹9,999', '₹4,999', 50, true, '', true, 4, true, true, '["Digital Marketing Fundamentals","SEO","Google Ads","Meta Ads","Social Media Marketing","Google Business Profile","Content Marketing","Email Marketing","Analytics","Lead Generation","Branding","Campaign Strategy"]'::jsonb, '["Plan and run real Google Ads and Meta Ads campaigns","Optimize a Google Business Profile for local visibility","Build and execute a content and social media strategy","Read analytics data and turn it into decisions","Generate and qualify leads for a business"]'::jsonb, '["Students exploring a digital marketing career","Business owners who want to market in-house","Freelancers looking to add marketing services"]'::jsonb, '[{"q":"Do I need prior experience?","a":"No — the course starts from fundamentals and builds up to campaign management."},{"q":"Is this hands-on?","a":"Yes, the course includes real campaign and strategy projects, not just theory."},{"q":"Is the course online or offline?","a":"Both options are available — online live sessions or offline classes at our Lucknow center."},{"q":"Will I get a certificate?","a":"Yes, you’ll receive a certificate of completion at the end of the course."},{"q":"Is mentorship included?","a":"Yes, you’ll have access to mentor support throughout the course."}]'::jsonb, true, 0)
on conflict (slug) do nothing;

insert into courses (slug, icon, title, short_description, duration, level, mode, original_price, price, discount_percent, is_demo_price, demo_video_url, has_certificate_sample, projects, certificate, mentorship, topics, what_you_learn, who_should_join, faqs, active, sort_order)
values ('artificial-intelligence', 'brain-circuit', 'Artificial Intelligence', 'A practical AI course covering fundamentals, generative AI, prompt engineering and real applications.', '2 Months', 'Beginner to Intermediate', 'Online / Offline (Lucknow)', '₹7,999', '₹3,999', 50, true, '', true, 3, true, true, '["AI Fundamentals","Generative AI","Prompt Engineering","AI Tools","Machine Learning Fundamentals","AI Applications","Automation","Practical AI Projects"]'::jsonb, '["Understand how modern AI systems and models work at a practical level","Write effective prompts for real business and creative tasks","Use current AI tools to automate everyday work","Apply AI to marketing, content and productivity workflows"]'::jsonb, '["Students curious about AI careers","Professionals who want to use AI tools effectively","Entrepreneurs looking to automate parts of their business"]'::jsonb, '[{"q":"Do I need a coding background?","a":"No — this course is practical and tool-focused, not a deep ML engineering course."},{"q":"Will I build anything?","a":"Yes, you’ll complete practical AI-assisted projects during the course."},{"q":"Is the course online or offline?","a":"Both options are available — online live sessions or offline classes at our Lucknow center."},{"q":"Will I get a certificate?","a":"Yes, you’ll receive a certificate of completion at the end of the course."},{"q":"Is mentorship included?","a":"Yes, you’ll have access to mentor support throughout the course."}]'::jsonb, true, 1)
on conflict (slug) do nothing;

insert into courses (slug, icon, title, short_description, duration, level, mode, original_price, price, discount_percent, is_demo_price, demo_video_url, has_certificate_sample, projects, certificate, mentorship, topics, what_you_learn, who_should_join, faqs, active, sort_order)
values ('website-development', 'code-2', 'Website Development', 'Go from HTML basics to building and deploying real, responsive websites with React.', '4 Months', 'Beginner to Advanced', 'Online / Offline (Lucknow)', '₹11,999', '₹5,999', 50, true, '', true, 5, true, true, '["HTML","CSS","JavaScript","Responsive Design","Git & GitHub","Frontend Development","React","Backend Fundamentals","Database","Deployment","Real-world Projects"]'::jsonb, '["Build responsive websites from scratch with HTML, CSS and JavaScript","Develop modern frontend interfaces using React","Understand backend and database fundamentals","Use Git/GitHub in a real development workflow","Deploy a live website"]'::jsonb, '["Students starting a web development career","Professionals switching into tech","Business owners who want to understand their own website"]'::jsonb, '[{"q":"Do I need any prior knowledge?","a":"No — the course starts from the fundamentals of HTML and CSS."},{"q":"Will I have a portfolio by the end?","a":"Yes, you’ll complete multiple real projects you can showcase."},{"q":"Is the course online or offline?","a":"Both options are available — online live sessions or offline classes at our Lucknow center."},{"q":"Will I get a certificate?","a":"Yes, you’ll receive a certificate of completion at the end of the course."},{"q":"Is mentorship included?","a":"Yes, you’ll have access to mentor support throughout the course."}]'::jsonb, true, 2)
on conflict (slug) do nothing;


