-- ============================================================
-- Migration 17: Internship/Job Applications (Work with Us forms)
--
-- Run in: Supabase Dashboard -> SQL Editor
--
-- 1. internship_applications table : poora application record
--    (personal info, internship prefs, education, resume path,
--    expectations, admin fields).
-- 2. Application ID server-side generate hota hai:
--    NRT-INT-YYMMM#### (internship) / NRT-JOB-YYMMM#### (job)
--    Counter table se race-safe atomic increment.
-- 3. RLS: koi bhi apply kar sakta hai (anon insert),
--    sirf admins padh/update kar sakte hain.
-- 4. Private storage bucket: internship-resumes (PDF/DOCX,
--    5MB max). Public access NAHI. Admin hi resume dekh sakta hai.
-- ============================================================

-- ---------- 1) Applications table ----------
create table if not exists public.internship_applications (
  id uuid primary key default gen_random_uuid(),
  application_id text unique,                        -- NRT-INT-26AUG0001 (DB-generated, not editable)
  application_type text not null default 'internship', -- 'internship' | 'job'
  opening_slug text default '',
  opening_title text default '',

  -- Section 1: Personal Information
  full_name text not null,
  email text not null,
  mobile text not null,
  gender text not null default '',
  city text not null default '',
  state text not null default '',

  -- Section 2: Internship Preferences (internship only)
  duration text default '',                          -- '1 Month' | '2 Months' | '3 Months' | '6 Months'
  preferred_mode text not null default 'Online',     -- fixed 'Online'
  student_domain text default '',                    -- student ka chuna domain (original, kabhi overwrite nahi)

  -- Section 3: Education & Skills
  college text not null default '',
  degree text not null default '',
  degree_other text default '',                      -- 'Others' select hone par
  skills text default '',

  -- Section 4: Resume (private storage path)
  resume_path text default '',
  resume_name text default '',

  -- Section 5: Expectations
  expectations text default '',

  -- Admin-controlled fields (students kabhi modify nahi kar sakte)
  status text not null default 'Applied',            -- Applied|Under Review|Shortlisted|Interview|Selected|Rejected
  assigned_domain text,                              -- admin-assigned (student domain se alag) - NULL initially
  start_date date,                                   -- internship start (admin)
  end_date date,                                     -- internship end (admin, auto-calc + editable)
  certificate_status text not null default 'Not Applicable', -- Not Applicable|Pending|Eligible|Generated|Issued
  admin_remarks text,                                -- INTERNAL - students ko kabhi visible nahi

  -- Timestamps (database-generated, browser clock par bharosa nahi)
  submission_date date not null default current_date,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internship_applications_status_idx
  on internship_applications (status);
create index if not exists internship_applications_submitted_idx
  on internship_applications (submitted_at desc);

-- ---------- 2) Race-safe Application ID generation ----------
create table if not exists public.application_id_counters (
  prefix text not null,
  year_month text not null,
  last_seq bigint not null default 0,
  primary key (prefix, year_month)
);

-- Atomic increment + return (duplicate IDs kabhi nahi bana sakte)
create or replace function public.next_application_seq(p_prefix text, p_ym text)
returns bigint
language sql
security definer
set search_path = public
as $$
  insert into public.application_id_counters as c (prefix, year_month, last_seq)
  values (p_prefix, p_ym, 1)
  on conflict (prefix, year_month)
  do update set last_seq = c.last_seq + 1
  returning last_seq;
$$;

create or replace function public.set_application_id()
returns trigger
language plpgsql
as $$
declare
  v_prefix text;
  v_ym text;
  v_seq bigint;
begin
  if new.application_id is null or new.application_id = '' then
    v_prefix := case when new.application_type = 'job' then 'NRT-JOB' else 'NRT-INT' end;
    v_ym := to_char(now(), 'YYMON');   -- e.g. 26AUG
    v_seq := public.next_application_seq(v_prefix, v_ym);
    new.application_id := v_prefix || '-' || v_ym || lpad(v_seq::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists internship_applications_set_id on internship_applications;
create trigger internship_applications_set_id
  before insert on internship_applications
  for each row execute function public.set_application_id();

-- ---------- 3) RLS ----------
alter table internship_applications enable row level security;

-- Koi bhi (anon) apply kar sakta hai
create policy "Anyone can submit applications"
  on internship_applications for insert
  to anon, authenticated
  with check (true);

-- Sirf admins padh/update/delete kar sakte hain
create policy "Admins can read applications"
  on internship_applications for select
  using (is_admin(auth.uid()));

create policy "Admins can update applications"
  on internship_applications for update
  using (is_admin(auth.uid()));

create policy "Admins can delete applications"
  on internship_applications for delete
  using (is_admin(auth.uid()));

-- ---------- 4) Private resume bucket ----------
insert into storage.buckets (id, name, public)
values ('internship-resumes', 'internship-resumes', false)
on conflict (id) do nothing;

-- Koi bhi resume upload kar sakta hai (applications/ folder)
create policy "Anyone can upload resumes"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'internship-resumes');

-- Resume PUBLIC NAHI - sirf admins read/download kar sakte hain
create policy "Admins can read resumes"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'internship-resumes' and is_admin(auth.uid()));

-- Done!
