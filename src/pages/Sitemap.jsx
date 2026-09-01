import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Home, Sparkles, Briefcase, GraduationCap, MonitorPlay, BookOpen, FileText, Map as MapIcon } from 'lucide-react';
import { fetchServices } from '@/data/servicesRepo';
import { fetchCourses } from '@/data/coursesRepo';
import { fetchWorkshops } from '@/data/workshopsRepo';
import { SERVICES as STATIC_SERVICES } from '@/data/services';
import { ACTIVE_COURSES as STATIC_COURSES } from '@/data/courses';
import { SITE } from '@/constants/siteData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function Sitemap() {
  const [services, setServices] = useState(null);
  const [courses, setCourses] = useState(null);
  const [workshops, setWorkshops] = useState(null);

  useEffect(() => {
    fetchServices().then((d) => setServices(d.length ? d : STATIC_SERVICES));
    fetchCourses().then((d) => setCourses(d.length ? d.filter((c) => c.active !== false) : STATIC_COURSES));
    fetchWorkshops().then((d) => setWorkshops(d));
  }, []);

  const loading = services === null || courses === null || workshops === null;

  const mainPages = [
    { to: '/', label: 'Home' },
    { to: '/about-us', label: 'About Us' },
    { to: '/Contect-us', label: 'Contact Us' },
    { to: '/blog', label: 'Blog' },
    { to: '/case-studies', label: 'Case Studies' },
    { to: '/faqs', label: 'FAQs' },
    { to: '/careers', label: 'Careers — Internships & Jobs' },
  ];

  const legalPages = [
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/terms-and-conditions', label: 'Terms & Conditions' },
    { to: '/refund-policy', label: 'Refund Policy' },
    { to: '/sitemap', label: 'Sitemap' },
  ];

  return (
    <>
      <Helmet>
        <title>Sitemap — All Pages | {SITE.name}</title>
        <meta
          name="description"
          content={`Complete sitemap of ${SITE.name} — find every page: services, courses, workshops, blog, case studies, FAQs and company information.`}
        />
        <link rel="canonical" href={`${SITE.domain}/sitemap`} />
      </Helmet>

      {/* Hero Header */}
      <section className="bg-accent bg-grid-light pt-32 pb-14 border-b-2 border-secondary">
        <div className="container-section text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 badge-tag mb-4">
            <MapIcon size={14} className="text-primary" />
            <span>Website Sitemap</span>
          </div>
          <h1 className="text-secondary text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-5">
            Sitemap
          </h1>
          <p className="text-muted text-base sm:text-lg leading-relaxed normal-case">
            Every page on our website, organized in one place — explore whatever you need.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20 bg-accent min-h-[50vh]">
        <div className="container-section">
          {loading ? (
            <LoadingSpinner className="min-h-[40vh]" />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Main Pages */}
              <SitemapCard icon={Home} title="Main Pages" links={mainPages} />

              {/* Services */}
              <SitemapCard
                icon={Briefcase}
                title="Services"
                links={services.map((s) => ({ to: `/services/${s.slug}`, label: s.title }))}
                emptyLabel="View all on the Services page."
                footerLink={{ to: '/services', label: 'View All Services' }}
              />

              {/* Courses */}
              <SitemapCard
                icon={GraduationCap}
                title="Courses"
                links={courses.map((c) => ({ to: `/course/${c.slug}`, label: c.title }))}
                footerLink={{ to: '/course', label: 'View All Courses' }}
              />

              {/* Workshops */}
              <SitemapCard
                icon={MonitorPlay}
                title="Workshops"
                links={workshops.map((w) => ({ to: `/workshop/${w.slug}`, label: w.title }))}
                emptyLabel="New workshops are announced regularly — check the Workshops page."
                footerLink={{ to: '/workshop', label: 'View All Workshops' }}
              />

              {/* Blog */}
              <SitemapCard
                icon={BookOpen}
                title="Blog"
                links={[
                  { to: '/blog', label: 'Blog Home — All Articles' },
                  { to: '/case-studies', label: 'Case Studies' },
                ]}
              />

              {/* Legal */}
              <SitemapCard icon={FileText} title="Legal & Policies" links={legalPages} />
            </div>
          )}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-secondary py-14">
        <div className="container-section text-center max-w-2xl mx-auto">
          <h2 className="text-white text-2xl sm:text-3xl font-heading leading-tight mb-3">
            Didn&rsquo;t find what you were looking for?
          </h2>
          <p className="text-white/70 text-sm sm:text-base normal-case mb-6">
            Reach out — our team will point you to the right page, course or service.
          </p>
          <Link to="/Contect-us" className="btn-primary inline-flex items-center gap-2">
            Contact Us <Sparkles size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}

function SitemapCard({ icon: Icon, title, links, emptyLabel, footerLink }) {
  return (
    <div className="card-base bg-white p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-secondary/10">
        <span className="w-10 h-10 bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-primary" />
        </span>
        <h2 className="text-secondary normal-case text-lg">{title}</h2>
      </div>
      {links.length === 0 ? (
        <p className="text-sm text-muted normal-case flex-1">{emptyLabel || 'Coming soon.'}</p>
      ) : (
        <ul className="space-y-2.5 flex-1">
          {links.map((link) => (
            <li key={link.to + link.label}>
              <Link
                to={link.to}
                className="text-sm text-muted hover:text-primary transition-colors normal-case inline-flex items-start gap-2"
              >
                <span className="text-primary mt-1.5 w-1 h-1 bg-primary shrink-0" />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {footerLink && (
        <Link
          to={footerLink.to}
          className="text-xs font-bold text-primary hover:underline mt-4 pt-4 border-t border-secondary/10"
        >
          {footerLink.label} &rarr;
        </Link>
      )}
    </div>
  );
}
