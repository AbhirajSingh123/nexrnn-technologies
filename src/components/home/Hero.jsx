import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HERO } from '@/constants/siteData';

export default function Hero() {
  return (
    <section id="home" className="relative bg-accent bg-grid-light overflow-hidden pt-32 pb-20">
      <div className="container-section relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="badge-tag mb-6"
          >
            {HERO.eyebrow}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-secondary text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-6"
          >
            Grow Your Business with <span className="text-primary">Digital Marketing</span> &amp; Technology
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted text-base sm:text-lg leading-relaxed normal-case mb-8"
          >
            {HERO.subtext}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-2.5 mb-9"
          >
            {HERO.highlights.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1.5 bg-white border-2 border-secondary/15 px-3.5 py-1.5 text-xs font-semibold text-secondary"
              >
                <CheckCircle2 size={13} className="text-primary" /> {h}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/Contect-us" className="btn-primary min-w-[210px]">
              {HERO.ctaPrimary} <ArrowRight size={16} />
            </Link>
            <Link to="/services" className="btn-secondary min-w-[210px]">
              {HERO.ctaSecondary}
            </Link>
            <Link to="/course" className="btn-outline-light min-w-[210px]">
              {HERO.ctaTertiary}
            </Link>
            <Link to="/workshop" className="btn-outline-light min-w-[210px]">
              Explore Workshops <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
