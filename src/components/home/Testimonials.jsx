import { Star, Quote } from 'lucide-react';
import { useTestimonials } from '@/hooks/useContent';
import Reveal from '@/components/shared/Reveal';
import SectionHeading from '@/components/shared/SectionHeading';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function Testimonials() {
  const { items, loading } = useTestimonials();

  return (
    <section className="section-padding bg-accent">
      <div className="container-section">
        <SectionHeading
          badge="Feedback"
          title="Testimonials"
          description="Demo placeholder content shown below — replaced with real client and student feedback once available."
        />
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((t, i) => (
              <Reveal key={t.id} delay={(i % 3) * 0.08}>
                <div className="card-base bg-white p-7 h-full flex flex-col relative">
                  {t.isDemo && (
                    <span className="absolute top-4 right-4 bg-accent text-muted text-[9px] font-bold uppercase tracking-wide px-2 py-1">
                      Demo
                    </span>
                  )}
                  <Quote className="text-primary/30 mb-3" size={26} />
                  <p className="text-sm text-secondary/80 leading-relaxed normal-case flex-1 mb-5">{t.quote}</p>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star key={idx} size={13} className="fill-primary text-primary" />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-heading text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-secondary normal-case">{t.name}</p>
                      <p className="text-xs text-muted normal-case">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
