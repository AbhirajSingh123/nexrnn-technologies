import { useEffect, useState } from 'react';
import { fetchCareers, fetchCareerBySlug } from '@/data/careersRepo';

export function useCareers(type = 'all', search = '') {
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCareers({ type, search }).then((data) => {
      if (active) {
        setOpenings(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [type, search]);

  return { openings, loading };
}

export function useCareer(slug) {
  const [career, setCareer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCareerBySlug(slug).then((data) => {
      if (active) {
        setCareer(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  return { career, loading };
}
