import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

export default function useCountUp(end, { duration = 2, start = true } = {}) {
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!start || hasRun.current) return undefined;
    hasRun.current = true;
    const controls = animate(0, end, { duration, ease: 'easeOut', onUpdate: (v) => setValue(v) });
    return () => controls.stop();
  }, [start, end, duration]);

  return value;
}
