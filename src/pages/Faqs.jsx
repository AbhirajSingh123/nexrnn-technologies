import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ArrowRight } from 'lucide-react';
import { FAQ_CATEGORIES } from '@/constants/faqsData';
import { SITE } from '@/constants/siteData';

export default function Faqs() {
  const [activeCat, setActiveCat] = useState(FAQ_CATEGORIES[0]?.id || 'general');
  // openKey: "categoryId-faqIndex"; ek waqt me ek hi open (clean rahta hai)
  const [openKey, setOpenKey] = useState(null);

  const active = useMemo(
    () => FAQ_CATEGORIES.find((c) => c.id === activeCat) || FAQ_CATEGORIES[0],
    [activeCat]
  );

  const totalFaqs = useMemo(
    () => FAQ_CATEGORIES.reduce((sum, c) => sum + c.faqs.length, 0),
    []
  );

  return (
    <>
      <Helmet>
        <title>FAQs — Frequently Asked Questions | {SITE.name}</title>
        <meta
          name="description"
          content={`Frequently asked questions about NexRNN Technologies services, courses, workshops, fees, certificates and support — ${totalFaqs}+ answers in one place.`}
        />
        <link rel="canonical" href={`${SITE.domain}/faqs`} />
      </Helmet>

      {/* Hero Header */}
      <section className="bg-accent bg-grid-light pt-32 pb-14 border-b-2 border-secondary">
        <div className="container-section text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 badge-tag mb-4">
            <HelpCircle size={14} className="text-primary" />
            <span>Help Center</span>
          </div>
          <h1 className="text-secondary text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-5">
            Frequently Asked Questions
          </h1>
          <p className="text-muted text-base sm:text-lg leading-relaxed normal-case">
            Quick, honest answers about our services, courses, workshops, payments and support.
            Can&rsquo;t find yours? We&rsquo;re one message away.
          </p>
        </div>
      </section>

      {/* Category pills */}
      <section className="border-b-2 border-secondary/10 bg-white sticky top-[76px] z-30">
        <div className="container-section py-4 flex items-center gap-2 overflow-x-auto">
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCat(cat.id);
                setOpenKey(null);
              }}
              className={`px-3.5 py-1.5 text-xs font-bold whitespace-nowrap border-2 transition-colors ${
                activeCat === cat.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-secondary/20 text-muted hover:border-secondary/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Accordion */}
      <section className="py-14 sm:py-20 bg-accent min-h-[50vh]">
        <div className="container-section max-w-3xl mx-auto">
          <div className="space-y-4">
            {active.faqs.map((faq, i) => {
              const key = `${active.id}-${i}`;
              const isOpen = openKey === key;
              return (
                <div key={key} className="card-base bg-white overflow-hidden">
                  <button
                    onClick={() => setOpenKey(isOpen ? null : key)}
                    className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-base font-bold text-secondary normal-case leading-snug">
                      {faq.q}
                    </span>
                    <span
                      className={`w-8 h-8 shrink-0 border-2 flex items-center justify-center transition-all duration-200 ${
                        isOpen ? 'border-primary bg-primary text-white rotate-180' : 'border-secondary/20 text-primary'
                      }`}
                    >
                      <ChevronDown size={16} />
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 sm:px-6 pb-5 text-sm text-muted leading-relaxed normal-case border-t border-secondary/10 pt-4">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Still have questions */}
          <div className="card-base bg-white p-7 sm:p-8 text-center mt-10">
            <h2 className="text-xl text-secondary normal-case mb-2">Still have questions?</h2>
            <p className="text-sm text-muted normal-case mb-5">
              Talk to our team — we reply fast, with honest answers (no pushy sales calls).
            </p>
            <Link to="/Contect-us" className="btn-primary inline-flex items-center gap-2">
              Contact Us <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
