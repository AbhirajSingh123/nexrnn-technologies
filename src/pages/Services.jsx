import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useServices } from '@/hooks/useCatalog';
import { SITE } from '@/constants/siteData';
import ServiceCard from '@/components/services/ServiceCard';
import ReviewVideoSlider from '@/components/services/ReviewVideoSlider';
import Reveal from '@/components/shared/Reveal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function Services() {
  const { services, loading } = useServices();

  return (
    <>
      <Helmet>
        <title>Digital Marketing & Technology Services in Lucknow | {SITE.name}</title>
        <meta
          name="description"
          content="Google Ads, Meta Ads, SEO, social media marketing, Google Business Profile, website development and more — digital marketing and technology services from NexRNN Technology, Lucknow."
        />
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section text-center max-w-3xl mx-auto">
          <span className="badge-tag mb-5">Digital Marketing &amp; Technology Services</span>
          <h1 className="text-secondary text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-5">Our Services</h1>
          <p className="text-muted text-base leading-relaxed normal-case">
            Everything your business needs to build, market and grow its digital presence — handled by one team.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-section">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, i) => (
                <ServiceCard key={service.slug} service={service} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <ReviewVideoSlider />

      <section className="section-padding bg-secondary bg-grid-light">
        <div className="container-section">
          <Reveal className="card-base bg-white p-8 sm:p-12 max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl text-secondary mb-4">Not Sure Which Service You Need?</h2>
            <p className="text-muted text-sm leading-relaxed normal-case mb-7">
              Tell us about your business and goals — we&rsquo;ll recommend the right starting point.
            </p>
            <Link to="/Contect-us" className="btn-primary min-w-[220px]">
              Get Free Consultation <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
