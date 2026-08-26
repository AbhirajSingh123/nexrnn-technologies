import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock3, ArrowRight, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { formatINR } from '@/utils/format';
import { useWorkshopEnrollModal } from '@/contexts/WorkshopEnrollContext';
import Reveal from '@/components/shared/Reveal';

function formatDate(iso) {
  if (!iso) return 'Date TBA';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function WorkshopCard({ workshop, index = 0 }) {
  const { openWorkshopEnroll } = useWorkshopEnrollModal();

  return (
    <Reveal delay={(index % 3) * 0.08}>
      <motion.div whileHover={{ y: -4 }} className="card-base card-hover h-full flex flex-col overflow-hidden">
        <div className="bg-secondary aspect-video flex items-center justify-center overflow-hidden">
          {workshop.bannerUrl ? (
            <img src={workshop.bannerUrl} alt={workshop.title} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="text-white/30" size={30} />
          )}
        </div>
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl text-secondary normal-case mb-2">{workshop.title}</h3>
          <p className="text-sm text-muted leading-relaxed normal-case mb-4 flex-1">{workshop.shortDescription}</p>

          <div className="space-y-1.5 mb-5 text-xs">
            <span className="flex items-center gap-1.5 text-secondary/70">
              <Calendar size={13} className="text-primary shrink-0" /> {formatDate(workshop.workshopDatetime)}
            </span>
            {workshop.registrationDeadline && (
              <span className="flex items-center gap-1.5 text-secondary/70">
                <Clock3 size={13} className="text-primary shrink-0" /> Register by {formatDate(workshop.registrationDeadline)}
              </span>
            )}
          </div>

          {workshop.isFree ? (
            <div className="flex items-center gap-1.5 mb-5">
              <CheckCircle2 size={16} className="text-green-600" />
              <span className="font-heading text-2xl text-green-600">FREE</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-heading text-2xl text-primary">{formatINR(workshop.price)}</span>
                {workshop.originalPrice && (
                  <span className="text-sm text-muted line-through normal-case">{formatINR(workshop.originalPrice)}</span>
                )}
                {workshop.discountPercent && (
                  <span className="bg-primary text-white text-[10px] font-bold uppercase px-2 py-0.5">
                    {workshop.discountPercent}% OFF
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mb-5">
                {workshop.isDemoPrice && <span className="text-[10px] text-muted normal-case">Demo pricing</span>}
              </div>
            </>
          )}

          <div className="flex items-center gap-3 mt-auto">
            <Link to={`/workshop/${workshop.slug}`} className="btn-secondary flex-1 !px-4 !py-2.5 text-xs">
              View Workshop
            </Link>
            <button onClick={() => openWorkshopEnroll(workshop)} className="btn-primary flex-1 !px-4 !py-2.5 text-xs">
              Register Now <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </motion.div>
    </Reveal>
  );
}
