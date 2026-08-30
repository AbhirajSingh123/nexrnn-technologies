import { useState, useEffect, useCallback } from 'react';
import {
  fetchCaseStudies,
  fetchCaseStudyBySlug,
} from '@/data/caseStudiesRepo';

export function useCaseStudies(industry = 'all', search = '') {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCaseStudies({ industry, search });
      setStudies(data);
    } catch {
      setStudies([]);
    } finally {
      setLoading(false);
    }
  }, [industry, search]);

  useEffect(() => {
    load();
  }, [load]);

  return { studies, loading, reload: load };
}

export function useCaseStudy(slug) {
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCaseStudyBySlug(slug).then((data) => {
      if (active) {
        setStudy(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  return { study, loading };
}
