import { TECHNOLOGIES } from '@/constants/siteData';
import Reveal from '@/components/shared/Reveal';
import SectionHeading from '@/components/shared/SectionHeading';

export default function TechnologySection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-section">
        <SectionHeading
          badge="Tools We Use"
          title="Technology We Work With"
          description="Technologies and platforms we use for client projects and services — not official partnerships."
        />
        <Reveal className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
          {TECHNOLOGIES.map((tech) => (
            <span
              key={tech}
              className="bg-accent border-2 border-secondary/15 hover:border-primary transition-colors px-5 py-2.5 text-sm font-semibold text-secondary"
            >
              {tech}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
