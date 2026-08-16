import { PROCESS_STEPS } from '@/constants/siteData';
import Reveal from '@/components/shared/Reveal';
import SectionHeading from '@/components/shared/SectionHeading';

export default function DigitalGrowthProcess() {
  return (
    <section className="section-padding bg-secondary bg-grid-light">
      <div className="container-section">
        <Reveal className="flex flex-col items-center text-center max-w-2xl mx-auto mb-14">
          <span className="badge-tag mb-4 bg-white/5 text-primary border-primary/40">Our Process</span>
          <h2 className="bracket-corners relative border-2 border-white bg-secondary px-6 py-4 text-3xl sm:text-4xl md:text-5xl text-white leading-[1.05]">
            Digital Growth Process
          </h2>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROCESS_STEPS.map((step, i) => (
            <Reveal key={step.step} delay={(i % 3) * 0.08} className="bg-white/5 border border-white/15 p-6">
              <span className="font-heading text-4xl text-primary block mb-3">{step.step}</span>
              <h3 className="text-lg text-white normal-case mb-2">{step.title}</h3>
              <p className="text-sm text-white/60 normal-case leading-relaxed">{step.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
