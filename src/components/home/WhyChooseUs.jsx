import { motion } from 'framer-motion';
import { WHY_CHOOSE_US } from '@/constants/siteData';
import { getIcon } from '@/utils/iconMap';
import Reveal from '@/components/shared/Reveal';
import SectionHeading from '@/components/shared/SectionHeading';

export default function WhyChooseUs() {
  return (
    <section className="section-padding bg-white">
      <div className="container-section">
        <SectionHeading badge="Why NexRNN" title="Why Choose Us" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHY_CHOOSE_US.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <Reveal key={item.title} delay={(i % 4) * 0.06}>
                <motion.div whileHover={{ y: -4 }} className="card-base card-hover p-6 h-full flex flex-col">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-secondary normal-case mb-1.5">{item.title}</h3>
                  <p className="text-xs text-muted leading-relaxed normal-case">{item.description}</p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
