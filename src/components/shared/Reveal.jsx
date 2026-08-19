import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const DIRECTIONS = {
  up: { y: 32, x: 0 },
  down: { y: -32, x: 0 },
  left: { y: 0, x: 32 },
  right: { y: 0, x: -32 },
  none: { y: 0, x: 0 },
};

export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className = '',
  as = 'div',
  once = true,
  ...rest
}) {
  const [ref, inView] = useInView({ triggerOnce: once, threshold: 0.15 });
  const offset = DIRECTIONS[direction] ?? DIRECTIONS.up;
  const Component = motion[as] ?? motion.div;

  return (
    <Component
      ref={ref}
      initial={{ opacity: 0, ...offset }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
}
