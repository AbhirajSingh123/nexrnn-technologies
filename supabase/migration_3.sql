-- =====================================================================
-- Migration 3: client reviews, portfolio, testimonials, and expanded
-- lead / course-enrollment status tracking.
-- Run this ENTIRE file once in: Supabase Dashboard → SQL Editor → New query → Run
-- Assumes migration_2.sql has already been run (adds `status` to leads_contact).
-- =====================================================================

-- ---------- "What Our Clients Say" video reviews ----------
create table if not exists client_reviews (
  id uuid primary key default gen_random_uuid(),
  youtube_url text not null default '',
  client_name text not null,
  service_name text not null default '',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table client_reviews enable row level security;

create policy "Anyone can read active client reviews"
  on client_reviews for select
  using (active = true or is_admin(auth.uid()));

create policy "Admins can manage client reviews"
  on client_reviews for all
  using (is_admin(auth.uid()));

create trigger client_reviews_set_updated_at before update on client_reviews
  for each row execute function set_updated_at();

-- ---------- Portfolio ----------
create table if not exists portfolio (
  id uuid primary key default gen_random_uuid(),
  image_url text not null default '',
  category text not null default 'Other' check (category in ('Website', 'Ads', 'Branding', 'Other')),
  project_name text not null,
  short_description text not null default '',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table portfolio enable row level security;

create policy "Anyone can read active portfolio items"
  on portfolio for select
  using (active = true or is_admin(auth.uid()));

create policy "Admins can manage portfolio"
  on portfolio for all
  using (is_admin(auth.uid()));

create trigger portfolio_set_updated_at before update on portfolio
  for each row execute function set_updated_at();

-- ---------- Text Testimonials ----------
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  review text not null,
  rating int not null default 5 check (rating between 1 and 5),
  client_name text not null,
  company_name text not null default '',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table testimonials enable row level security;

create policy "Anyone can read active testimonials"
  on testimonials for select
  using (active = true or is_admin(auth.uid()));

create policy "Admins can manage testimonials"
  on testimonials for all
  using (is_admin(auth.uid()));

create trigger testimonials_set_updated_at before update on testimonials
  for each row execute function set_updated_at();

-- ---------- STORAGE: bucket for portfolio images ----------
insert into storage.buckets (id, name, public)
values ('portfolio-assets', 'portfolio-assets', true)
on conflict (id) do nothing;

create policy "Public can view portfolio assets"
  on storage.objects for select
  using (bucket_id = 'portfolio-assets');

create policy "Admins can upload portfolio assets"
  on storage.objects for insert
  with check (bucket_id = 'portfolio-assets' and is_admin(auth.uid()));

create policy "Admins can update portfolio assets"
  on storage.objects for update
  using (bucket_id = 'portfolio-assets' and is_admin(auth.uid()));

create policy "Admins can delete portfolio assets"
  on storage.objects for delete
  using (bucket_id = 'portfolio-assets' and is_admin(auth.uid()));

-- ---------- Expand lead statuses to include "On Call" ----------
alter table leads_contact drop constraint if exists leads_contact_status_check;
alter table leads_contact add constraint leads_contact_status_check
  check (status in ('pending', 'on_call', 'done', 'undone'));

alter table leads_service add column if not exists status text not null default 'pending'
  check (status in ('pending', 'on_call', 'done', 'undone'));

-- ---------- Course enrollment admin-only tracking fields ----------
alter table leads_course add column if not exists batch_id text not null default '';
alter table leads_course add column if not exists enrollment_status text not null default 'pending'
  check (enrollment_status in ('pending', 'on_call', 'enrolled', 'payment_received', 'declined'));
alter table leads_course add column if not exists call_status text not null default 'undone'
  check (call_status in ('done', 'undone'));
alter table leads_course add column if not exists email_status text not null default 'not_sent'
  check (email_status in ('sent', 'not_sent'));
alter table leads_course add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'paid'));
alter table leads_course add column if not exists admin_notes text not null default '';
alter table leads_course add column if not exists updated_at timestamptz not null default now();

create trigger leads_course_set_updated_at before update on leads_course
  for each row execute function set_updated_at();

create index if not exists client_reviews_created_at_idx on client_reviews (created_at desc);
create index if not exists portfolio_created_at_idx on portfolio (created_at desc);
create index if not exists testimonials_created_at_idx on testimonials (created_at desc);
