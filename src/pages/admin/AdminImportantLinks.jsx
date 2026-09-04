import { Helmet } from 'react-helmet-async';
import { ExternalLink, Globe, Layers, Shield, Users, Newspaper } from 'lucide-react';
import { SITE } from '@/constants/siteData';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import { MENTOR_ROUTES } from '@/constants/mentorRoutes';
import { SALES_ROUTES } from '@/constants/salesRoutes';

const D = SITE.domain;

// Poore website ka naksha — public pages + panels (sab new tab me khulte hain)
const GROUPS = [
  {
    title: 'Main Website',
    icon: Globe,
    links: [
      { label: 'Homepage', path: '/' },
      { label: 'About Us', path: '/about-us' },
      { label: 'Contact Us', path: '/contact-us' },
      { label: 'FAQs', path: '/faqs' },
      { label: 'Sitemap (public)', path: '/sitemap' },
    ],
  },
  {
    title: 'Services & Programs',
    icon: Layers,
    links: [
      { label: 'All Services', path: '/services' },
      { label: 'All Courses', path: '/course' },
      { label: 'All Workshops', path: '/workshop' },
    ],
  },
  {
    title: 'Content',
    icon: Newspaper,
    links: [
      { label: 'Blog (all posts)', path: '/blog' },
      { label: 'Case Studies', path: '/case-studies' },
    ],
  },
  {
    title: 'Careers',
    icon: Users,
    links: [
      { label: 'Careers / Openings', path: '/careers' },
      { label: 'Internships', path: '/internship' },
      { label: 'Jobs', path: '/job' },
      { label: 'Check Application Status', path: '/application-payment-status' },
    ],
  },
  {
    title: 'Panels (Logins)',
    icon: Shield,
    links: [
      { label: 'Admin Panel', path: ADMIN_ROUTES.login },
      { label: 'Mentor Panel', path: MENTOR_ROUTES.login },
      { label: 'Sales Panel', path: SALES_ROUTES.login },
    ],
  },
];

export default function AdminImportantLinks() {
  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">Important Links</h1>
      <p className="text-sm text-muted normal-case mb-6">
        Every public page of the website and all panel logins in one place — click any link and it
        opens in a new tab.
      </p>

      <div className="space-y-6">
        {GROUPS.map(({ title, icon: Icon, links }) => (
          <div key={title} className="card-base bg-white p-5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary mb-4">
              <Icon size={15} className="text-primary" /> {title}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {links.map(({ label, path }) => (
                <a
                  key={path}
                  href={`${D}${path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 border-2 border-secondary/15 px-3.5 py-2.5 hover:border-primary transition-colors"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-secondary group-hover:text-primary transition-colors truncate">{label}</span>
                    <span className="block text-[10px] text-muted truncate">{D}{path}</span>
                  </span>
                  <ExternalLink size={14} className="text-muted group-hover:text-primary shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
