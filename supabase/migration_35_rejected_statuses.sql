-- ============================================================
-- Migration 35: Status me "Rejected" option (admin panels)
--   withdrawals, issues aur service leads me admin ab Rejected
--   status bhi set kar sakta hai (pehle sirf approve/progress the)
-- ============================================================

-- 1) mentor_withdrawals: Rejected allowed
alter table mentor_withdrawals drop constraint if exists mentor_withdrawals_status_check;
alter table mentor_withdrawals
  add constraint mentor_withdrawals_status_check
  check (status in ('Created', 'In progress', 'Payment Done', 'Rejected'));

-- 2) sales_withdrawals: Rejected allowed
alter table sales_withdrawals drop constraint if exists sales_withdrawals_status_check;
alter table sales_withdrawals
  add constraint sales_withdrawals_status_check
  check (status in ('Created', 'In progress', 'Payment Done', 'Rejected'));

-- 3) mentor_issues: Rejected allowed
alter table mentor_issues drop constraint if exists mentor_issues_status_check;
alter table mentor_issues
  add constraint mentor_issues_status_check
  check (status in ('Open', 'In Progress', 'Resolved', 'Closed', 'Rejected'));

-- 4) sales_issues: Rejected allowed
alter table sales_issues drop constraint if exists sales_issues_status_check;
alter table sales_issues
  add constraint sales_issues_status_check
  check (status in ('Open', 'In Progress', 'Resolved', 'Closed', 'Rejected'));

-- 5) leads_service: rejected allowed (admin inline status dropdown)
alter table leads_service drop constraint if exists leads_service_status_check;
alter table leads_service
  add constraint leads_service_status_check
  check (status in ('pending', 'on_call', 'done', 'undone', 'rejected'));
