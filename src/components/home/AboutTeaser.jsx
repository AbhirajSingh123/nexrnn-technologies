import { Link } from 'react-router-dom';
import { ArrowRight, Target, Eye } from 'lucide-react';
import { ABOUT } from '@/constants/siteData';
import Reveal from '@/components/shared/Reveal';
import SectionHeading from '@/components/shared/SectionHeading';

export default function AboutTeaser() {
  return (
    <section id="about" className="section-padding bg-white">
      <div className="container-section">
        <SectionHeading badge="Who We Are" title={ABOUT.heading} />

        <Reveal className="card-base bg-white p-7 sm:p-10 max-w-4xl mx-auto mb-8">
          <p className="text-base text-secondary leading-relaxed normal-case mb-4">{ABOUT.intro}</p>
          <p className="text-sm text-muted leading-relaxed normal-case mb-6">{ABOUT.secondary}</p>
          <Link to="/about-us" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline underline-offset-4">
            More About Us <ArrowRight size={15} />
          </Link>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Reveal direction="left" className="card-base p-7">
            <div className="w-11 h-11 bg-primary/10 flex items-center justify-center mb-4">
              <Target className="text-primary" size={20} />
            </div>
            <h3 className="text-lg text-secondary normal-case mb-2">Our Mission</h3>
            <p className="text-sm text-muted leading-relaxed normal-case">{ABOUT.mission}</p>
          </Reveal>
          <Reveal direction="right" delay={0.1} className="card-base p-7">
            <div className="w-11 h-11 bg-primary/10 flex items-center justify-center mb-4">
              <Eye className="text-primary" size={20} />
            </div>
            <h3 className="text-lg text-secondary normal-case mb-2">Our Vision</h3>
            <p className="text-sm text-muted leading-relaxed normal-case">{ABOUT.vision}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
