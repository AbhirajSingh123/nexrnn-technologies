import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getMentorToken, getSavedMentorProfile, mentorLogout as clearSession, loginMentor,
  MENTOR_SESSION_CLEARED,
} from '@/data/mentorAuth';
import { MENTOR_ROUTES } from '@/constants/mentorRoutes';

const MentorAuthContext = createContext(null);

export function MentorAuthProvider({ children }) {
  // Lazy init: pehle render par hi session read (flash/blink na aaye)
  const [mentor, setMentor] = useState(() => (getMentorToken() ? getSavedMentorProfile() : null));
  const [loading] = useState(false);

  // Session kahin se bhi clear ho (logout ya 401) - context turant sync ho,
  // warna ProtectedRoute + Login aapas me redirect karte reh jaate hain (loop)
  useEffect(() => {
    const onCleared = () => setMentor(null);
    window.addEventListener(MENTOR_SESSION_CLEARED, onCleared);
    return () => window.removeEventListener(MENTOR_SESSION_CLEARED, onCleared);
  }, []);

  const login = useCallback(async (mentorId, phone) => {
    const data = await loginMentor(mentorId, phone);
    setMentor(data.mentor || {});
    return data;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setMentor(null);
  }, []);

  return (
    <MentorAuthContext.Provider value={{ mentor, loading, login, logout }}>
      {children}
    </MentorAuthContext.Provider>
  );
}

export function useMentorAuth() {
  const ctx = useContext(MentorAuthContext);
  if (!ctx) throw new Error('useMentorAuth must be used within MentorAuthProvider');
  return ctx;
}

/** 401 par login par bhejne wala helper (pages me catch ke saath) */
export function handleMentorApiError(err, navigate) {
  if (err?.status === 401) {
    navigate(MENTOR_ROUTES.login, { replace: true });
    return true;
  }
  return false;
}
