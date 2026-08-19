-- Run once in Supabase SQL Editor. Safe to re-run.
alter table leads_contact add column if not exists status text not null default 'pending' check (status in ('pending','done','undone'));
create index if not exists leads_contact_created_at_idx on leads_contact (created_at desc);
create index if not exists leads_service_created_at_idx on leads_service (created_at desc);
create index if not exists leads_course_created_at_idx on leads_course (created_at desc);
