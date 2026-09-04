// Sales panel ke apne routes - mentor panel se alag path, same pattern.
export const SALES_BASE = '/nexrnn/panel/sales';

export const SALES_ROUTES = {
  login: `${SALES_BASE}/login`,
  dashboard: SALES_BASE,
  services: `${SALES_BASE}/services`,
  leads: `${SALES_BASE}/leads`,
  referrals: `${SALES_BASE}/refer-and-earn`,
  enrollments: `${SALES_BASE}/my-enrollments`,
  blog: `${SALES_BASE}/my-blogs`,
  announcements: `${SALES_BASE}/announcements`,
  details: `${SALES_BASE}/details`,
  withdrawals: `${SALES_BASE}/withdrawal-payment`,
  contact: `${SALES_BASE}/contact`,
  issue: `${SALES_BASE}/issue`,
};
