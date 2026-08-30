import { useEffect, useState } from 'react';
import { fetchServices, fetchServiceBySlug } from '@/data/servicesRepo';
import { fetchCourses, fetchCourseBySlug } from '@/data/coursesRepo';
import { fetchWorkshops, fetchWorkshopBySlug } from '@/data/workshopsRepo';

function useList(fetchFn, deps = []) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchFn().then((data) => {
      if (active) {
        setItems(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { items, loading };
}

function useSingle(fetchFn, slug) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchFn(slug).then((data) => {
      if (active) {
        setItem(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return { item, loading };
}

export function useServices() {
  const { items, loading } = useList(fetchServices);
  return { services: items, loading };
}

export function useService(slug) {
  const { item, loading } = useSingle(fetchServiceBySlug, slug);
  return { service: item, loading };
}

export function useCourses() {
  const { items, loading } = useList(fetchCourses);
  return { courses: items, loading };
}

export function useCourse(slug) {
  const { item, loading } = useSingle(fetchCourseBySlug, slug);
  return { course: item, loading };
}

export function useWorkshops() {
  const { items, loading } = useList(fetchWorkshops);
  return { workshops: items, loading };
}

export function useWorkshop(slug) {
  const { item, loading } = useSingle(fetchWorkshopBySlug, slug);
  return { workshop: item, loading };
}
