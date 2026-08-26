import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const WorkshopEnrollContext = createContext(null);

export function WorkshopEnrollProvider({ children }) {
  const [workshop, setWorkshop] = useState(null);

  const openWorkshopEnroll = useCallback((w) => setWorkshop(w), []);
  const closeWorkshopEnroll = useCallback(() => setWorkshop(null), []);

  const value = useMemo(
    () => ({ workshop, openWorkshopEnroll, closeWorkshopEnroll }),
    [workshop, openWorkshopEnroll, closeWorkshopEnroll]
  );

  return <WorkshopEnrollContext.Provider value={value}>{children}</WorkshopEnrollContext.Provider>;
}

export function useWorkshopEnrollModal() {
  const ctx = useContext(WorkshopEnrollContext);
  if (!ctx) throw new Error('useWorkshopEnrollModal must be used within WorkshopEnrollProvider');
  return ctx;
}
