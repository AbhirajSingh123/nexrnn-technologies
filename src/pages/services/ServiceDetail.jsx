import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, ClipboardList } from 'lucide-react';
import { useService, useServices } from '@/hooks/useCatalog';
import { useServiceLeadModal } from '@/contexts/ServiceLeadContext';
import { getIcon } from '@/utils/iconMap';
import { SITE } from '@/constants/siteData';
import Reveal from '@/components/shared/Reveal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ServiceCard from '@/components/services/ServiceCard';

export default function ServiceDetail() {
  const { slug } = useParams();
  const { service, loading } = useService(slug);
  const { services: allServices } = useServices();
  const { openServiceLead } = useServiceLeadModal();

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;

  if (!service) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <p className="text-secondary text-lg font-semibold mb-4">Service not found.</p>
        <Link to="/services" className="btn-primary">Back to Services</Link>
      </div>
    );
  }

  const Icon = getIcon(service.icon);
  const relatedServices = allServices.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <>
      <Helmet>
        <title>{service.title} Services in Lucknow | {SITE.name}</title>
        <meta name="description" content={service.shortDescription} />
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section">
          <Link to="/services" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary mb-6 hover:underline underline-offset-4">
            <ArrowLeft size={15} /> All Services
          </Link>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="w-16 h-16 bg-primary flex items-center justify-center mb-6">
                <Icon size={28} className="text-white" />
              </div>
              <h1 className="text-secondary text-4xl sm:text-5xl leading-[1.05] mb-5">{service.title}</h1>
              <p className="text-muted text-base leading-relaxed normal-case">{service.shortDescription}</p>
            </div>

            <Reveal className="card-base bg-secondary text-white p-7">
              <h3 className="text-lg normal-case mb-4">Ready to Get Started?</h3>
              <p className="text-sm text-white/70 normal-case leading-relaxed mb-6">
                Tell us about your business and we&rsquo;ll put together the right plan for {service.title.toLowerCase()}.
              </p>
              <button onClick={() => openServiceLead(service)} className="btn-primary w-full">
                Buy Now <ArrowRight size={16} />
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-section grid lg:grid-cols-2 gap-10">
          <Reveal direction="left">
            <h2 className="text-2xl text-secondary mb-5 flex items-center gap-2">
              <Sparkles size={22} className="text-primary" /> Benefits
            </h2>
            <div className="space-y-3">
              {service.benefits.map((b) => (
                <div key={b} className="flex items-start gap-2.5">
                  <CheckCircle2 size={17} className="text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-secondary/80 normal-case leading-relaxed">{b}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.1}>
            <h2 className="text-2xl text-secondary mb-5 flex items-center gap-2">
              <ClipboardList size={22} className="text-primary" /> What We Provide
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {service.features.map((f) => (
                <span key={f} className="bg-accent border-2 border-secondary/15 px-4 py-2 text-sm font-semibold text-secondary normal-case">
                  {f}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-accent">
        <div className="container-section">
          <Reveal className="card-base bg-white p-8 sm:p-12 text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl text-secondary mb-4">{service.cta}</h2>
            <p className="text-muted text-sm leading-relaxed normal-case mb-7">
              Get in touch and our team will help you get started right away.
            </p>
            <button onClick={() => openServiceLead(service)} className="btn-primary min-w-[220px]">
              Buy Now <ArrowRight size={16} />
            </button>
          </Reveal>

          {relatedServices.length > 0 && (
            <>
              <h2 className="text-2xl text-secondary mb-6 text-center">Other Services You May Need</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedServices.map((s, i) => (
                  <ServiceCard key={s.slug} service={s} index={i} compact />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
