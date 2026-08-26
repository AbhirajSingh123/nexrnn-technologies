import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useWorkshops } from '@/hooks/useCatalog';
import WorkshopCard from '@/components/workshops/WorkshopCard';
import SectionHeading from '@/components/shared/SectionHeading';
import Reveal from '@/components/shared/Reveal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function WorkshopsPreview() {
  const { workshops, loading } = useWorkshops();

  if (!loading && workshops.length === 0) return null;

  return (
    <section id="workshops" className="section-padding bg-white">
      <div className="container-section">
        <SectionHeading
          badge="Live & Hands-On"
          title="Upcoming Workshops"
          description="Focused, time-bound sessions to build a specific skill fast."
        />
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {workshops.slice(0, 3).map((w, i) => (
              <WorkshopCard key={w.slug} workshop={w} index={i} />
            ))}
          </div>
        )}
        <Reveal className="text-center">
          <Link to="/workshop" className="btn-primary min-w-[220px]">
            View All Workshops <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
