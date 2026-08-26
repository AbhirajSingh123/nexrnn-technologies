-- =====================================================================
-- Migration 5: site display settings, admin-editable payment success page,
-- Workshops (full parallel system to Courses), generalized payments table.
-- Run this ENTIRE file once in: Supabase Dashboard → SQL Editor → New query → Run
-- Assumes migrations 2, 3 and 4 have already been run.
-- =====================================================================

-- ---------- SITE SETTINGS (single row) ----------
create table if not exists site_settings (
  id int primary key default 1,
  show_services boolean not null default true,
  show_courses boolean not null default true,
  show_workshops boolean not null default true,
  payment_success_heading text not null default 'Enrollment Submitted!',
  payment_success_body text not null default 'Dear {name},

Your enrollment request for {title} has been submitted successfully.

Thank you for choosing NexRNN Technologies. Our team will review and verify the details you provided. Once your enrollment is verified, we will contact you with the next steps, including information about your live classes and course materials.

If you have any questions, please contact us at nexrnntechnology@gmail.com.

Congratulations, and welcome to NexRNN Technologies!
You will receive a confirmation and welcome email after successful verification of your enrollment details.

— Team NexRNN Technologies',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into site_settings (id) values (1) on conflict (id) do nothing;

alter table site_settings enable row level security;

create policy "Anyone can read site settings"
  on site_settings for select
  using (true);

create policy "Admins can update site settings"
  on site_settings for update
  using (is_admin(auth.uid()));

create trigger site_settings_set_updated_at before update on site_settings
  for each row execute function set_updated_at();

-- ---------- Courses: WhatsApp group link shown on payment success ----------
alter table courses add column if not exists whatsapp_group_link text not null default '';

-- ---------- WORKSHOPS (CRUD from admin panel, mirrors courses) ----------
create table if not exists workshops (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  banner_url text not null default '',
  title text not null,
  short_description text not null default '',
  workshop_datetime timestamptz,
  registration_deadline timestamptz,
  details text not null default '',
  original_price text not null default '',
  price text not null default '',
  discount_percent int,
  is_demo_price boolean not null default false,
  demo_video_url text not null default '',
  has_certificate_sample boolean not null default true,
  faqs jsonb not null default '[]',
  whatsapp_group_link text not null default '',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table workshops enable row level security;

create policy "Anyone can read active workshops"
  on workshops for select
  using (active = true or is_admin(auth.uid()));

create policy "Admins can manage workshops"
  on workshops for all
  using (is_admin(auth.uid()));

create trigger workshops_set_updated_at before update on workshops
  for each row execute function set_updated_at();

-- ---------- LEADS: workshop registration popup (mirrors leads_course) ----------
create table if not exists leads_workshop (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  workshop_slug text not null,
  workshop_title text not null,
  price text not null default '',
  college text not null default '',
  consent boolean not null default false,
  cashfree_order_id text not null default '',
  batch_id text not null default '',
  enrollment_status text not null default 'pending'
    check (enrollment_status in ('pending', 'on_call', 'enrolled', 'payment_received', 'declined')),
  call_status text not null default 'undone' check (call_status in ('done', 'undone')),
  email_status text not null default 'not_sent' check (email_status in ('sent', 'not_sent')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table leads_workshop enable row level security;

create policy "Anyone can submit a workshop enrollment"
  on leads_workshop for insert
  with check (true);

create policy "Admins can read workshop enrollments"
  on leads_workshop for select
  using (is_admin(auth.uid()));

create policy "Admins can delete workshop enrollments"
  on leads_workshop for delete
  using (is_admin(auth.uid()));

create trigger leads_workshop_set_updated_at before update on leads_workshop
  for each row execute function set_updated_at();

create index if not exists leads_workshop_created_at_idx on leads_workshop (created_at desc);

-- ---------- Generalize PAYMENTS to support workshops too ----------
alter table payments add column if not exists lead_type text not null default 'course' check (lead_type in ('course', 'workshop'));
alter table payments add column if not exists lead_workshop_id uuid references leads_workshop (id) on delete cascade;
alter table payments alter column lead_course_id drop not null;

-- ---------- STORAGE: bucket for workshop banners ----------
insert into storage.buckets (id, name, public)
values ('workshop-assets', 'workshop-assets', true)
on conflict (id) do nothing;

create policy "Public can view workshop assets"
  on storage.objects for select
  using (bucket_id = 'workshop-assets');

create policy "Admins can upload workshop assets"
  on storage.objects for insert
  with check (bucket_id = 'workshop-assets' and is_admin(auth.uid()));

create policy "Admins can update workshop assets"
  on storage.objects for update
  using (bucket_id = 'workshop-assets' and is_admin(auth.uid()));

create policy "Admins can delete workshop assets"
  on storage.objects for delete
  using (bucket_id = 'workshop-assets' and is_admin(auth.uid()));
