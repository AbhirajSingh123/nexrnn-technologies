import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ServiceLeadContext = createContext(null);

export function ServiceLeadProvider({ children }) {
  const [service, setService] = useState(null);

  const openServiceLead = useCallback((svc) => setService(svc), []);
  const closeServiceLead = useCallback(() => setService(null), []);

  const value = useMemo(() => ({ service, openServiceLead, closeServiceLead }), [service, openServiceLead, closeServiceLead]);

  return <ServiceLeadContext.Provider value={value}>{children}</ServiceLeadContext.Provider>;
}

export function useServiceLeadModal() {
  const ctx = useContext(ServiceLeadContext);
  if (!ctx) throw new Error('useServiceLeadModal must be used within ServiceLeadProvider');
  return ctx;
}
