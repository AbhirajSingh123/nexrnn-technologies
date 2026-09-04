import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getSalesToken, getSavedSalesProfile, salesLogout as clearSession, loginSales,
  refreshSalesProfile,
  SALES_SESSION_CLEARED,
} from '@/data/salesAuth';
import { SALES_ROUTES } from '@/constants/salesRoutes';

const SalesAuthContext = createContext(null);

export function SalesAuthProvider({ children }) {
  // Lazy init: pehle render par hi session read (flash/blink na aaye)
  const [member, setMember] = useState(() => (getSalesToken() ? getSavedSalesProfile() : null));
  const [loading] = useState(false);

  // Session kahin se bhi clear ho (logout ya 401) - context turant sync ho,
  // warna ProtectedRoute + Login aapas me redirect karte reh jaate hain (loop)
  useEffect(() => {
    const onCleared = () => setMember(null);
    window.addEventListener(SALES_SESSION_CLEARED, onCleared);
    return () => window.removeEventListener(SALES_SESSION_CLEARED, onCleared);
  }, []);

  const login = useCallback(async (salesId, phone) => {
    const data = await loginSales(salesId, phone);
    setMember(data.member || {});
    return data;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setMember(null);
  }, []);

  // Server se fresh profile laao (commission admin badle to session bhi update ho)
  const refreshProfile = useCallback(async () => {
    const merged = await refreshSalesProfile();
    if (merged) setMember(merged);
  }, []);

  return (
    <SalesAuthContext.Provider value={{ member, loading, login, logout, refreshProfile }}>
      {children}
    </SalesAuthContext.Provider>
  );
}

export function useSalesAuth() {
  const ctx = useContext(SalesAuthContext);
  if (!ctx) throw new Error('useSalesAuth must be used within SalesAuthProvider');
  return ctx;
}

/** 401 par login par bhejne wala helper (pages me catch ke saath) */
export function handleSalesApiError(err, navigate) {
  if (err?.status === 401) {
    navigate(SALES_ROUTES.login, { replace: true });
    return true;
  }
  return false;
}
