// Change this single value to relocate the entire admin panel to a new secret path.
export const ADMIN_BASE = '/nexrnn/master-nexrnn/admin';

export const ADMIN_ROUTES = {
  login: `${ADMIN_BASE}/login`,
  dashboard: ADMIN_BASE,
  leadsContact: `${ADMIN_BASE}/leads/contact`,
  leadsServices: `${ADMIN_BASE}/leads/services`,
  leadsCourses: `${ADMIN_BASE}/leads/courses`,
  services: `${ADMIN_BASE}/services`,
  serviceNew: `${ADMIN_BASE}/services/new`,
  serviceEdit: (id) => `${ADMIN_BASE}/services/${id}/edit`,
  serviceEditPath: `${ADMIN_BASE}/services/:id/edit`,
  courses: `${ADMIN_BASE}/courses`,
  courseNew: `${ADMIN_BASE}/courses/new`,
  courseEdit: (id) => `${ADMIN_BASE}/courses/${id}/edit`,
  courseEditPath: `${ADMIN_BASE}/courses/:id/edit`,
};
