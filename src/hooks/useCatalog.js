import { useEffect, useState } from 'react';
import { fetchServices, fetchServiceBySlug } from '@/data/servicesRepo';
import { fetchCourses, fetchCourseBySlug } from '@/data/coursesRepo';

export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchServices().then((data) => {
      if (active) {
        setServices(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { services, loading };
}

export function useService(slug) {
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchServiceBySlug(slug).then((data) => {
      if (active) {
        setService(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  return { service, loading };
}

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCourses().then((data) => {
      if (active) {
        setCourses(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { courses, loading };
}

export function useCourse(slug) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCourseBySlug(slug).then((data) => {
      if (active) {
        setCourse(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  return { course, loading };
}
