import { useEffect } from 'react';

export default function useLockBodyScroll(isLocked) {
  useEffect(() => {
    if (!isLocked) return undefined;
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [isLocked]);
}
