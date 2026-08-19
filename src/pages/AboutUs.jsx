import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Eye } from 'lucide-react';
import { ABOUT, SITE, PROCESS_STEPS } from '@/constants/siteData';
import { WHY_CHOOSE_US } from '@/constants/siteData';
import { getIcon } from '@/utils/iconMap';
import Reveal from '@/components/shared/Reveal';
import SectionHeading from '@/components/shared/SectionHeading';

export default function AboutUs() {
  return (
    <>
      <Helmet>
        <title>About Us | {SITE.name} — Digital Marketing & Technology, Lucknow</title>
        <meta name="description" content={ABOUT.intro} />
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section text-center max-w-3xl mx-auto">
          <span className="badge-tag mb-5">Who We Are</span>
          <h1 className="text-secondary text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-5">{ABOUT.heading}</h1>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-section">
          <Reveal className="card-base bg-white p-8 sm:p-12 max-w-4xl mx-auto mb-10">
            <p className="text-base text-secondary leading-relaxed normal-case mb-5">{ABOUT.intro}</p>
            <p className="text-sm text-muted leading-relaxed normal-case">{ABOUT.secondary}</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            <Reveal direction="left" className="card-base p-8">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-5">
                <Target className="text-primary" size={22} />
              </div>
              <h3 className="text-xl text-secondary normal-case mb-3">Our Mission</h3>
              <p className="text-sm text-muted leading-relaxed normal-case">{ABOUT.mission}</p>
            </Reveal>
            <Reveal direction="right" delay={0.1} className="card-base p-8">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-5">
                <Eye className="text-primary" size={22} />
              </div>
              <h3 className="text-xl text-secondary normal-case mb-3">Our Vision</h3>
              <p className="text-sm text-muted leading-relaxed normal-case">{ABOUT.vision}</p>
            </Reveal>
          </div>

          <SectionHeading badge="Why NexRNN" title="Why Choose Us" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {WHY_CHOOSE_US.map((item) => {
              const Icon = getIcon(item.icon);
              return (
                <Reveal key={item.title} className="card-base card-hover p-6 h-full flex flex-col">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-secondary normal-case mb-1.5">{item.title}</h3>
                  <p className="text-xs text-muted leading-relaxed normal-case">{item.description}</p>
                </Reveal>
              );
            })}
          </div>

          <SectionHeading badge="How We Work" title="Digital Growth Process" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {PROCESS_STEPS.map((step) => (
              <Reveal key={step.step} className="card-base p-6">
                <span className="font-heading text-4xl text-primary block mb-3">{step.step}</span>
                <h3 className="text-lg text-secondary normal-case mb-2">{step.title}</h3>
                <p className="text-sm text-muted normal-case leading-relaxed">{step.description}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="card-base bg-secondary text-white p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl mb-4">Let&rsquo;s Work Together</h2>
            <p className="text-white/70 text-sm leading-relaxed normal-case mb-7 max-w-xl mx-auto">
              Whether it&rsquo;s a service or a course, we&rsquo;d love to hear about your goals.
            </p>
            <Link to="/Contect-us" className="btn-primary min-w-[220px]">
              Contact Us <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
