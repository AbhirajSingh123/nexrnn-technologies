import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useServices } from '@/hooks/useCatalog';
import ServiceCard from '@/components/services/ServiceCard';
import SectionHeading from '@/components/shared/SectionHeading';
import Reveal from '@/components/shared/Reveal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const FEATURED_SLUGS = ['google-ads', 'meta-ads', 'website-development', 'seo', 'social-media-marketing', 'google-business-profile'];

export default function ServicesPreview() {
  const { services, loading } = useServices();
  const featured = services.filter((s) => FEATURED_SLUGS.includes(s.slug));

  return (
    <section id="services" className="section-padding bg-accent">
      <div className="container-section">
        <SectionHeading
          badge="What We Do"
          title="Our Services"
          description="Performance-driven marketing and technology services built around your business goals."
        />
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {featured.map((s, i) => (
              <ServiceCard key={s.slug} service={s} index={i} compact />
            ))}
          </div>
        )}
        <Reveal className="text-center">
          <Link to="/services" className="btn-primary min-w-[220px]">
            View All Services <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
