import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
import { PORTFOLIO_CATEGORIES, PORTFOLIO_ITEMS } from '@/data/portfolio';
import Reveal from '@/components/shared/Reveal';
import SectionHeading from '@/components/shared/SectionHeading';

export default function Portfolio() {
  const [active, setActive] = useState('All');
  const filtered = active === 'All' ? PORTFOLIO_ITEMS : PORTFOLIO_ITEMS.filter((p) => p.category === active);

  return (
    <section className="section-padding bg-white">
      <div className="container-section">
        <SectionHeading
          badge="Our Work"
          title="Portfolio"
          description="A look at the kind of work we do. Demo items shown below — real project work will replace these as it becomes available to share."
        />

        <Reveal className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          {PORTFOLIO_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`text-xs font-bold uppercase tracking-wide px-4 py-2 border-2 border-secondary transition-colors ${
                active === cat ? 'bg-primary text-white' : 'bg-white text-secondary hover:bg-accent'
              }`}
            >
              {cat}
            </button>
          ))}
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 0.08}>
              <motion.div whileHover={{ y: -4 }} className="card-base card-hover overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-secondary to-primary/40 flex items-center justify-center relative">
                  <ImageIcon className="text-white/40" size={30} />
                  {item.isDemo && (
                    <span className="absolute top-3 right-3 bg-white/90 text-secondary text-[10px] font-bold uppercase tracking-wide px-2.5 py-1">
                      Demo
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{item.category}</span>
                  <h3 className="text-lg text-secondary normal-case mt-1 mb-2">{item.name}</h3>
                  <p className="text-xs text-muted leading-relaxed normal-case">{item.description}</p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
