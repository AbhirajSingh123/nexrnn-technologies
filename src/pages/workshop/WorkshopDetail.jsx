import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock3, Award, ChevronDown, ArrowRight, ArrowLeft, PlayCircle, Image as ImageIcon, User,
} from 'lucide-react';
import { useWorkshop } from '@/hooks/useCatalog';
import { useWorkshopEnrollModal } from '@/contexts/WorkshopEnrollContext';
import { isRegistrationClosed } from '@/utils/workshopUtils';
import { formatINR } from '@/utils/format';
import { SITE } from '@/constants/siteData';
import Reveal from '@/components/shared/Reveal';
import MarkdownContent from '@/components/shared/MarkdownContent';
import DemoVideo from '@/components/shared/DemoVideo';
import CertificateSample from '@/components/shared/CertificateSample';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ShareRow from '@/components/shared/ShareRow';

function formatDate(iso) {
  if (!iso) return 'To be announced';
  return new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="card-base bg-white px-4 py-3 flex items-center gap-3">
      <Icon size={16} className="text-primary shrink-0" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
        <p className="text-sm font-bold text-secondary normal-case">{value}</p>
      </div>
    </div>
  );
}

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className="card-base mb-4 overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors ${isOpen ? 'bg-accent' : 'bg-white'}`}
      >
        <span className="text-base font-bold text-secondary normal-case">{item.q}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0 text-primary">
          <ChevronDown size={20} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-white border-t-2 border-secondary"
          >
            <MarkdownContent content={item.a} className="px-6 py-5 text-sm text-muted leading-relaxed normal-case" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WorkshopDetail() {
  const { slug } = useParams();
  const { workshop, loading } = useWorkshop(slug);
  const { openWorkshopEnroll } = useWorkshopEnrollModal();
  const regClosed = workshop ? isRegistrationClosed(workshop) : false;
  const [openFaq, setOpenFaq] = useState(0);

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;

  if (!workshop) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <p className="text-secondary text-lg font-semibold mb-4">Workshop not found.</p>
        <Link to="/workshop" className="btn-primary">Back to Workshops</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{workshop.title} Workshop | {SITE.name}</title>
        <meta name="description" content={workshop.shortDescription} />
        <link rel="canonical" href={`${SITE.domain}/workshop/${workshop.slug}`} />
        {workshop.faqs?.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: workshop.faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            })}
          </script>
        )}
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section">
          <Link to="/workshop" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary mb-6 hover:underline underline-offset-4">
            <ArrowLeft size={15} /> All Workshops
          </Link>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="w-full aspect-video bg-secondary flex items-center justify-center mb-6 overflow-hidden">
                {workshop.bannerUrl ? (
                  <img src={workshop.bannerUrl} alt={workshop.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-white/30" size={36} />
                )}
              </div>
              <h1 className="text-secondary text-4xl sm:text-5xl leading-[1.05] mb-5">{workshop.title}</h1>
              <MarkdownContent content={workshop.shortDescription} className="text-muted text-base leading-relaxed normal-case mb-5" />
              <ShareRow title={workshop.title} path={`/workshop/${workshop.slug}`} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoChip icon={Calendar} label="Date &amp; Time" value={formatDate(workshop.workshopDatetime)} />
                {regClosed ? (
                  <InfoChip icon={Clock3} label="Status" value="Workshop Completed" />
                ) : (
                  <InfoChip icon={Clock3} label="Register By" value={formatDate(workshop.registrationDeadline)} />
                )}
              </div>
            </div>

            <Reveal className="card-base bg-white p-7">
              <p className="text-xs font-bold uppercase tracking-wide text-muted mb-1">Workshop Fee</p>
              {workshop.isFree ? (
                <p className="font-heading text-4xl text-green-600 mb-4">FREE</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-heading text-4xl text-primary">{formatINR(workshop.price)}</span>
                    {workshop.originalPrice && (
                      <span className="text-base text-muted line-through normal-case">{formatINR(workshop.originalPrice)}</span>
                    )}
                  </div>
                  {workshop.discountPercent && (
                    <span className="inline-block bg-primary text-white text-[10px] font-bold uppercase px-2.5 py-1 mb-2">
                      {workshop.discountPercent}% OFF
                    </span>
                  )}
                  {workshop.isDemoPrice && <p className="text-[11px] text-muted normal-case mb-5">Demo pricing — confirm with our team</p>}
                </>
              )}
              {regClosed ? (
                <>
                  <button
                    disabled
                    className="btn-primary w-full opacity-50 cursor-not-allowed select-none"
                  >
                    Workshop Completed
                  </button>
                  <p className="text-[11px] text-muted normal-case text-center mt-2">
                    The registration deadline has passed. New registrations are closed.
                  </p>
                </>
              ) : (
                <button onClick={() => openWorkshopEnroll(workshop)} className="btn-primary w-full">
                  Register Now <ArrowRight size={16} />
                </button>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding bg-accent">
        <div className="container-section grid lg:grid-cols-2 gap-8 items-start">
          <Reveal direction="left">
            <h2 className="text-2xl text-secondary mb-5 flex items-center gap-2">
              <PlayCircle size={22} className="text-primary" /> Workshop Video
            </h2>
            <DemoVideo url={workshop.demoVideoUrl} title={`${workshop.title} video`} />
          </Reveal>
          {workshop.hasCertificateSample && (
            <Reveal direction="right" delay={0.1}>
              <h2 className="text-2xl text-secondary mb-5 flex items-center gap-2">
                <Award size={22} className="text-primary" /> Certificate Sample
              </h2>
              <CertificateSample courseName={workshop.title} />
            </Reveal>
          )}
        </div>
      </section>

      {workshop.mentorName && (
        <section className="section-padding bg-white">
          <div className="container-section max-w-3xl">
            <h2 className="text-2xl text-secondary mb-5 flex items-center gap-2">
              <User size={22} className="text-primary" /> Your Mentor
            </h2>
            <div className="card-base p-7 flex items-start gap-5">
              <div className="w-14 h-14 bg-primary/10 flex items-center justify-center shrink-0">
                <User size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-secondary normal-case mb-2">{workshop.mentorName}</p>
                <p className="text-sm text-muted leading-relaxed normal-case">{workshop.mentorIntro}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="section-padding bg-accent">
        <div className="container-section max-w-3xl">
          <h2 className="text-2xl text-secondary mb-5">About This Workshop</h2>
          <MarkdownContent content={workshop.details} className="text-sm text-secondary/80 leading-relaxed normal-case mb-12" />

          {workshop.faqs?.length > 0 && (
            <>
              <h2 className="text-2xl text-secondary mb-5">Frequently Asked Questions</h2>
              {workshop.faqs.map((item, i) => (
                <FAQItem key={item.q} item={item} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
              ))}
            </>
          )}
        </div>
      </section>
    </>
  );
}
