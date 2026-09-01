/**
 * Mentor panel pages ka shared data hook.
 * mentor-data edge function se fetch, 401 par login par redirect.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorData } from '@/data/mentorAuth';
import { MENTOR_ROUTES } from '@/constants/mentorRoutes';

export default function useMentorData(action, payload = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    mentorData(action, payload)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((err) => {
        if (!active) return;
        if (err?.status === 401) {
          navigate(MENTOR_ROUTES.login, { replace: true });
          return;
        }
        if (err?.status === 403) {
          // Blocked - session cleared, login par bhejo (message login page par bhi dikhega)
          navigate(MENTOR_ROUTES.login, { replace: true, state: { blockedMessage: err.message } });
          return;
        }
        setError(err.message || 'Something went wrong.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, JSON.stringify(payload)]);

  return { data, error, loading };
}

/** ₹ formatted */
export function inr(n) {
  return `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;
}
