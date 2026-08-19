-- =====================================================================
-- FIX: recursive RLS policies were blocking admin profile reads,
-- which made login appear to "loop back" to the login page.
-- Run this ENTIRE file once in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to run even if you already ran schema.sql — this only replaces policies.
-- =====================================================================

-- ---------- Helper functions (bypass RLS safely, no recursion) ----------
create or replace function is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = uid);
$$;

create or replace function is_super_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = uid and role = 'super_admin');
$$;

-- ---------- PROFILES ----------
drop policy if exists "Admins can read all profiles" on profiles;
drop policy if exists "Super admins can manage profiles" on profiles;

create policy "Authenticated users can read profiles"
  on profiles for select
  using (auth.uid() is not null);

create policy "Super admins can manage profiles"
  on profiles for all
  using (is_super_admin(auth.uid()));

-- ---------- SERVICES ----------
drop policy if exists "Anyone can read active services" on services;
drop policy if exists "Admins can manage services" on services;

create policy "Anyone can read active services"
  on services for select
  using (active = true or is_admin(auth.uid()));

create policy "Admins can manage services"
  on services for all
  using (is_admin(auth.uid()));

-- ---------- COURSES ----------
drop policy if exists "Anyone can read active courses" on courses;
drop policy if exists "Admins can manage courses" on courses;

create policy "Anyone can read active courses"
  on courses for select
  using (active = true or is_admin(auth.uid()));

create policy "Admins can manage courses"
  on courses for all
  using (is_admin(auth.uid()));

-- ---------- LEADS: contact ----------
drop policy if exists "Admins can read contact leads" on leads_contact;
drop policy if exists "Admins can delete contact leads" on leads_contact;

create policy "Admins can read contact leads"
  on leads_contact for select
  using (is_admin(auth.uid()));

create policy "Admins can delete contact leads"
  on leads_contact for delete
  using (is_admin(auth.uid()));

-- ---------- LEADS: service ----------
drop policy if exists "Admins can read service leads" on leads_service;
drop policy if exists "Admins can delete service leads" on leads_service;

create policy "Admins can read service leads"
  on leads_service for select
  using (is_admin(auth.uid()));

create policy "Admins can delete service leads"
  on leads_service for delete
  using (is_admin(auth.uid()));

-- ---------- LEADS: course ----------
drop policy if exists "Admins can read course enrollments" on leads_course;
drop policy if exists "Admins can delete course enrollments" on leads_course;

create policy "Admins can read course enrollments"
  on leads_course for select
  using (is_admin(auth.uid()));

create policy "Admins can delete course enrollments"
  on leads_course for delete
  using (is_admin(auth.uid()));

-- ---------- STORAGE: course-assets (QR codes) ----------
drop policy if exists "Admins can upload course assets" on storage.objects;
drop policy if exists "Admins can update course assets" on storage.objects;
drop policy if exists "Admins can delete course assets" on storage.objects;

create policy "Admins can upload course assets"
  on storage.objects for insert
  with check (bucket_id = 'course-assets' and is_admin(auth.uid()));

create policy "Admins can update course assets"
  on storage.objects for update
  using (bucket_id = 'course-assets' and is_admin(auth.uid()));

create policy "Admins can delete course assets"
  on storage.objects for delete
  using (bucket_id = 'course-assets' and is_admin(auth.uid()));
