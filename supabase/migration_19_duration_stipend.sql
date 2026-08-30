-- ============================================================
-- Migration 19: Internship duration + stipend (admin-fixed)
--
-- Run in: Supabase Dashboard -> SQL Editor
-- (Migration 18 ke BAAD run karo)
--
-- 1. Careers me naye admin-controlled fields:
--    duration (1/2/3/6 Months), stipend_type (paid/unpaid),
--    stipend_text (e.g. '\u20b95,000/month')
-- 2. Applications se student_domain / assigned_domain columns
--    hata diye (ab domain sirf opening-level par hai).
-- ============================================================

alter table careers
  add column if not exists duration text default '',
  add column if not exists stipend_type text not null default 'unpaid',
  add column if not exists stipend_text text default '';

alter table internship_applications
  drop column if exists student_domain,
  drop column if exists assigned_domain;

-- Done!
