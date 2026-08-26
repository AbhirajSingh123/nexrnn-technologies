-- =====================================================================
-- Migration 6: Free/Paid courses & workshops, unique reference IDs,
-- services pricing, workshop mentor section, popup offers.
-- Run this ENTIRE file once in: Supabase Dashboard → SQL Editor → New query → Run
-- Assumes migrations 2 through 5 have already been run.
-- =====================================================================

-- ---------- Free/Paid concept ----------
alter table courses add column if not exists is_free boolean not null default false;
alter table workshops add column if not exists is_free boolean not null default false;

-- ---------- Workshop mentor section ----------
alter table workshops add column if not exists mentor_name text not null default '';
alter table workshops add column if not exists mentor_intro text not null default '';

-- ---------- Services pricing (previously services had no price field) ----------
alter table services add column if not exists price text not null default '';
alter table services add column if not exists original_price text not null default '';
alter table services add column if not exists discount_percent int;

-- ---------- Unique enrollment Reference ID (generated client-side, shown to
-- the student and visible to admin). Nullable + unique: existing rows get
-- NULL (multiple NULLs are allowed under a unique constraint), all new
-- enrollments will always have a real, unique value. ----------
alter table leads_course add column if not exists reference_id text unique;
alter table leads_workshop add column if not exists reference_id text unique;

-- ---------- Add 'free' as a valid payment_status (alongside unpaid/paid) ----------
alter table leads_course drop constraint if exists leads_course_payment_status_check;
alter table leads_course add constraint leads_course_payment_status_check
  check (payment_status in ('unpaid', 'paid', 'free'));

alter table leads_workshop drop constraint if exists leads_workshop_payment_status_check;
alter table leads_workshop add constraint leads_workshop_payment_status_check
  check (payment_status in ('unpaid', 'paid', 'free'));

-- ---------- Popup Offers (site-wide, admin-managed) ----------
alter table site_settings add column if not exists popup_enabled boolean not null default false;
alter table site_settings add column if not exists popup_image_url text not null default '';
alter table site_settings add column if not exists popup_link text not null default '';

-- ---------- STORAGE: bucket for general site assets (popup image, etc.) ----------
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy "Public can view site assets"
  on storage.objects for select
  using (bucket_id = 'site-assets');

create policy "Admins can upload site assets"
  on storage.objects for insert
  with check (bucket_id = 'site-assets' and is_admin(auth.uid()));

create policy "Admins can update site assets"
  on storage.objects for update
  using (bucket_id = 'site-assets' and is_admin(auth.uid()));

create policy "Admins can delete site assets"
  on storage.objects for delete
  using (bucket_id = 'site-assets' and is_admin(auth.uid()));
