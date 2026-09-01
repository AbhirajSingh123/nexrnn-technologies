// Mentor panel ke apne routes - admin panel se alag path, same pattern.
export const MENTOR_BASE = '/nexrnn/master-nexrnn/mentor';

export const MENTOR_ROUTES = {
  login: `${MENTOR_BASE}/login`,
  dashboard: MENTOR_BASE,
  workshopRegistrations: `${MENTOR_BASE}/workshop-registrations`,
  courseRegistrations: `${MENTOR_BASE}/course-registrations`,
  courses: `${MENTOR_BASE}/courses`,
  workshops: `${MENTOR_BASE}/workshops`,
  details: `${MENTOR_BASE}/details`,
  commission: `${MENTOR_BASE}/commission`,
  withdrawals: `${MENTOR_BASE}/withdrawal-payment`,
  blog: `${MENTOR_BASE}/blog`,
  contact: `${MENTOR_BASE}/contact`,
  issue: `${MENTOR_BASE}/issue`,
};
