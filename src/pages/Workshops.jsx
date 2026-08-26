import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useWorkshops } from '@/hooks/useCatalog';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { SITE } from '@/constants/siteData';
import WorkshopCard from '@/components/workshops/WorkshopCard';
import Reveal from '@/components/shared/Reveal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function Workshops() {
  const { workshops, loading } = useWorkshops();
  const { settings, loading: settingsLoading } = useSiteSettings();

  if (!settingsLoading && !settings.showWorkshops) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center bg-accent bg-grid-light px-4 py-24">
        <div className="card-base bg-white max-w-lg w-full p-8 sm:p-10 text-center">
          <h1 className="text-2xl text-secondary mb-3">Workshops Coming Soon</h1>
          <p className="text-sm text-muted normal-case leading-relaxed mb-6">
            We&rsquo;re not running any workshops right now. Check back soon, or explore our courses instead.
          </p>
          <Link to="/course" className="btn-primary">Explore Courses</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <Helmet>
        <title>Workshops | {SITE.name}</title>
        <meta name="description" content="Live, hands-on workshops from NexRNN Technology, Lucknow." />
        <link rel="canonical" href={`${SITE.domain}/workshop`} />
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section text-center max-w-3xl mx-auto">
          <span className="badge-tag mb-5">Live &amp; Hands-On</span>
          <h1 className="text-secondary text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-5">Our Workshops</h1>
          <p className="text-muted text-base leading-relaxed normal-case">
            Focused, time-bound sessions to build a specific skill fast.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-section">
          {loading ? (
            <LoadingSpinner />
          ) : workshops.length === 0 ? (
            <div className="card-base bg-accent p-10 text-center text-muted text-sm normal-case mb-14">
              No workshops scheduled right now — check back soon.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
              {workshops.map((workshop, i) => (
                <WorkshopCard key={workshop.slug} workshop={workshop} index={i} />
              ))}
            </div>
          )}

          <Reveal className="card-base bg-secondary text-white p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl mb-4">Have a Question About a Workshop?</h2>
            <p className="text-white/70 text-sm leading-relaxed normal-case mb-7 max-w-xl mx-auto">
              Talk to our team and we&rsquo;ll help you pick the right session.
            </p>
            <Link to="/Contect-us" className="btn-primary min-w-[220px]">
              Talk to an Advisor <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
