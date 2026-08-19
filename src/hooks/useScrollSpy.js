import { useEffect, useState } from 'react';

export default function useScrollSpy(sectionIds, offset = 120) {
  const [activeId, setActiveId] = useState(sectionIds?.[0] ?? '');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + offset;
      let current = activeId;
      for (const id of sectionIds) {
        const el = document.getElementById(id.replace('#', ''));
        if (el && el.offsetTop <= scrollY) current = id;
      }
      setActiveId((prev) => (prev !== current ? current : prev));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIds, offset]);

  return activeId;
}
