import { useInView } from 'react-intersection-observer';
import { HERO_STATS } from '@/constants/siteData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import useCountUp from '@/hooks/useCountUp';

function StatBox({ value, suffix, label, isText }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.4 });
  const count = useCountUp(isText ? 0 : value, { duration: 1.6, start: inView });

  return (
    <div ref={ref} className="border border-white/25 py-8 px-4 text-center">
      <span className="font-heading text-4xl sm:text-5xl text-white leading-none">
        {isText ? suffix : `${Math.round(count)}${suffix}`}
      </span>
      <p className="mt-3 text-xs sm:text-sm font-semibold tracking-widest uppercase text-white/80">{label}</p>
    </div>
  );
}

export default function StatsBand() {
  const { settings } = useSiteSettings();

  // Site Settings se hide kiya ho to band render hi na ho
  if (settings.statsBandEnabled === false) return null;

  // Admin ne custom stats set kiye hain to wo, warna defaults
  const stats = Array.isArray(settings.statsList) && settings.statsList.length === 4
    ? settings.statsList
    : HERO_STATS;

  return (
    <div className="bg-primary bg-grid-light">
      <div className="container-section grid grid-cols-2 sm:grid-cols-4">
        {stats.map((stat) => {
          const num = Number(stat.value) || 0;
          const textOnly = stat.isText || (!num && stat.suffix);
          return (
            <StatBox
              key={stat.label || stat.suffix}
              value={num}
              suffix={stat.suffix || ''}
              label={stat.label}
              isText={textOnly}
            />
          );
        })}
      </div>
    </div>
  );
}
