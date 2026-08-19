-- =====================================================================
-- NexRNN Technologies — Supabase schema
-- Run this ENTIRE file once in: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- ---------- PROFILES (admin users) ----------
-- Linked 1:1 to Supabase Auth users. role = 'admin' or 'super_admin'.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- ---------- Helper functions ----------
-- security definer lets these bypass RLS internally, avoiding recursive-policy
-- errors that would otherwise occur when a policy on `profiles` queries `profiles`.
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

create policy "Authenticated users can read profiles"
  on profiles for select
  using (auth.uid() is not null);

create policy "Super admins can manage profiles"
  on profiles for all
  using (is_super_admin(auth.uid()));

-- ---------- SERVICES (CRUD from admin panel) ----------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  icon text not null default 'sparkles',
  title text not null,
  short_description text not null default '',
  benefits jsonb not null default '[]',
  features jsonb not null default '[]',
  cta text not null default 'Get Started',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table services enable row level security;

create policy "Anyone can read active services"
  on services for select
  using (active = true or is_admin(auth.uid()));

create policy "Admins can manage services"
  on services for all
  using (is_admin(auth.uid()));

-- ---------- COURSES (CRUD from admin panel) ----------
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  icon text not null default 'sparkles',
  title text not null,
  short_description text not null default '',
  duration text not null default '',
  level text not null default '',
  mode text not null default '',
  original_price text not null default '',
  price text not null default '',
  discount_percent int,
  is_demo_price boolean not null default false,
  demo_video_url text not null default '',
  has_certificate_sample boolean not null default true,
  projects int not null default 0,
  certificate boolean not null default true,
  mentorship boolean not null default true,
  topics jsonb not null default '[]',
  what_you_learn jsonb not null default '[]',
  who_should_join jsonb not null default '[]',
  faqs jsonb not null default '[]',
  qr_code_url text not null default '',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table courses enable row level security;

create policy "Anyone can read active courses"
  on courses for select
  using (active = true or is_admin(auth.uid()));

create policy "Admins can manage courses"
  on courses for all
  using (is_admin(auth.uid()));

-- ---------- LEADS: general Contact Us / homepage lead form ----------
create table if not exists leads_contact (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  service text not null default '',
  message text not null default '',
  consent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table leads_contact enable row level security;

create policy "Anyone can submit a contact lead"
  on leads_contact for insert
  with check (true);

create policy "Admins can read contact leads"
  on leads_contact for select
  using (is_admin(auth.uid()));

create policy "Admins can delete contact leads"
  on leads_contact for delete
  using (is_admin(auth.uid()));

-- ---------- LEADS: service enquiry popup ----------
create table if not exists leads_service (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text not null default '',
  city text not null,
  phone text not null,
  email text not null,
  message text not null default '',
  service_slug text not null,
  service_title text not null,
  consent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table leads_service enable row level security;

create policy "Anyone can submit a service lead"
  on leads_service for insert
  with check (true);

create policy "Admins can read service leads"
  on leads_service for select
  using (is_admin(auth.uid()));

create policy "Admins can delete service leads"
  on leads_service for delete
  using (is_admin(auth.uid()));

-- ---------- LEADS: course enrollment popup ----------
create table if not exists leads_course (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  course_slug text not null,
  course_title text not null,
  price text not null default '',
  college text not null default '',
  payment_ref_no text not null default '',
  consent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table leads_course enable row level security;

create policy "Anyone can submit a course enrollment"
  on leads_course for insert
  with check (true);

create policy "Admins can read course enrollments"
  on leads_course for select
  using (is_admin(auth.uid()));

create policy "Admins can delete course enrollments"
  on leads_course for delete
  using (is_admin(auth.uid()));

-- ---------- keep updated_at fresh on services/courses edits ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger services_set_updated_at before update on services
  for each row execute function set_updated_at();

create trigger courses_set_updated_at before update on courses
  for each row execute function set_updated_at();

-- =====================================================================
-- STORAGE: bucket for course QR code images (admin uploads via panel)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('course-assets', 'course-assets', true)
on conflict (id) do nothing;

create policy "Public can view course assets"
  on storage.objects for select
  using (bucket_id = 'course-assets');

create policy "Admins can upload course assets"
  on storage.objects for insert
  with check (bucket_id = 'course-assets' and is_admin(auth.uid()));

create policy "Admins can update course assets"
  on storage.objects for update
  using (bucket_id = 'course-assets' and is_admin(auth.uid()));

create policy "Admins can delete course assets"
  on storage.objects for delete
  using (bucket_id = 'course-assets' and is_admin(auth.uid()));
