import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CourseEnrollContext = createContext(null);

export function CourseEnrollProvider({ children }) {
  const [course, setCourse] = useState(null);

  const openCourseEnroll = useCallback((c) => setCourse(c), []);
  const closeCourseEnroll = useCallback(() => setCourse(null), []);

  const value = useMemo(() => ({ course, openCourseEnroll, closeCourseEnroll }), [course, openCourseEnroll, closeCourseEnroll]);

  return <CourseEnrollContext.Provider value={value}>{children}</CourseEnrollContext.Provider>;
}

export function useCourseEnrollModal() {
  const ctx = useContext(CourseEnrollContext);
  if (!ctx) throw new Error('useCourseEnrollModal must be used within CourseEnrollProvider');
  return ctx;
}
