import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { getIcon } from '@/utils/iconMap';
import Reveal from '@/components/shared/Reveal';

export default function ServiceCard({ service, index = 0, compact = false }) {
  const Icon = getIcon(service.icon);

  return (
    <Reveal delay={(index % 3) * 0.08}>
      <motion.div whileHover={{ y: -4 }} className="card-base card-hover p-7 h-full flex flex-col">
        <div className="w-12 h-12 bg-primary flex items-center justify-center mb-5 shrink-0">
          <Icon size={22} className="text-white" />
        </div>
        <h3 className="text-xl text-secondary normal-case mb-2.5">{service.title}</h3>
        <p className="text-sm text-muted leading-relaxed normal-case mb-4 flex-1">{service.shortDescription}</p>

        {!compact && (
          <ul className="space-y-1.5 mb-5">
            {service.features.slice(0, 4).map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-secondary/70 normal-case">
                <CheckCircle2 size={13} className="text-primary shrink-0" /> {f}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3 mt-auto">
          <Link to={`/services/${service.slug}`} className="btn-secondary flex-1 !px-4 !py-2.5 text-xs">
            View Service
          </Link>
          <Link to="/Contect-us" className="btn-primary flex-1 !px-4 !py-2.5 text-xs">
            Buy Now <ArrowRight size={13} />
          </Link>
        </div>
      </motion.div>
    </Reveal>
  );
}
