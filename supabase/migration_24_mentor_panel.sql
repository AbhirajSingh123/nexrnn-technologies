-- ============================================================
-- Migration 24: Mentor Panel (auth-ready data model + issues)
--
-- Run in: Supabase Dashboard -> SQL Editor
-- (Migration 23 ke BAAD run karo)
--
-- 1. mentors ki public policy hatao (login se PEHLE data exposed na ho)
-- 2. mentor_course_assignments / mentor_workshop_assignments
-- 3. mentor_issues (Report an Issue + admin status/response)
-- 4. mentor-issues private storage bucket (admin sirf signed-url se)
-- ============================================================

-- ---------- 1) mentors: sirf admin readable (pehle 'using (true)' tha) ----------
drop policy if exists "Admin full access on mentors" on mentors;
create policy "Admins manage mentors"
  on mentors for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ---------- 2) Assignments: mentor <-> courses/workshops ----------
create table if not exists mentor_course_assignments (
  id uuid primary key default gen_random_uuid(),
  mentor_uuid uuid not null references mentors (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (mentor_uuid, course_id)
);

create table if not exists mentor_workshop_assignments (
  id uuid primary key default gen_random_uuid(),
  mentor_uuid uuid not null references mentors (id) on delete cascade,
  workshop_id uuid not null references workshops (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (mentor_uuid, workshop_id)
);

alter table mentor_course_assignments enable row level security;
alter table mentor_workshop_assignments enable row level security;

create policy "Admins manage course assignments"
  on mentor_course_assignments for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "Admins manage workshop assignments"
  on mentor_workshop_assignments for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create index if not exists mca_mentor_idx on mentor_course_assignments (mentor_uuid);
create index if not exists mwa_mentor_idx on mentor_workshop_assignments (mentor_uuid);

-- ---------- 3) Mentor issues ----------
create table if not exists mentor_issues (
  id uuid primary key default gen_random_uuid(),
  issue_id text unique,
  mentor_uuid uuid not null references mentors (id) on delete cascade,
  mentor_id text not null default '',
  name text not null,
  mobile text not null,
  email text not null,
  issue text not null,
  attachment_path text not null default '',
  status text not null default 'Open'
    check (status in ('Open', 'In Progress', 'Resolved', 'Closed')),
  admin_response text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Issue ID: random NX-ISS-XXXXXXXX (Application/Mentor ID pattern)
create or replace function public.set_issue_id()
returns trigger
language plpgsql
as $$
begin
  if new.issue_id is null or new.issue_id = '' then
    loop
      new.issue_id := 'NX-ISS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      begin
        exit;
      exception when unique_violation then
        continue;
      end;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists mentor_issues_set_id on mentor_issues;
create trigger mentor_issues_set_id
  before insert on mentor_issues
  for each row execute function public.set_issue_id();

create trigger mentor_issues_set_updated_at before update on mentor_issues
  for each row execute function set_updated_at();

alter table mentor_issues enable row level security;

-- Table par koi public/anon policy NAHI (deny-all):
-- mentor apne issues edge function (service role) se dekhta hai,
-- admin neeche wali policy se.
create policy "Admins read mentor issues"
  on mentor_issues for select
  using (is_admin(auth.uid()));

create policy "Admins update mentor issues"
  on mentor_issues for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create index if not exists mentor_issues_mentor_idx on mentor_issues (mentor_uuid);
create index if not exists mentor_issues_created_idx on mentor_issues (created_at desc);

-- ---------- 4) mentor-issues private bucket (sirf admin read) ----------
insert into storage.buckets (id, name, public)
values ('mentor-issues', 'mentor-issues', false)
on conflict (id) do nothing;

create policy "Admins read mentor issue files"
  on storage.objects for select
  using (bucket_id = 'mentor-issues' and is_admin(auth.uid()));

-- Done! Mentor uploads/uploads edge function (service role) se hote hain.
