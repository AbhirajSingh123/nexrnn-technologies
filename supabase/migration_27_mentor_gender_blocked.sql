-- ============================================================
-- Migration 27: Mentor gender + block/unblock
--
-- Run in: Supabase Dashboard -> SQL Editor
-- (Migration 26 ke BAAD run karo)
-- ============================================================

alter table mentors
  add column if not exists gender text not null default ''
    check (gender in ('', 'Male', 'Female', 'Other')),
  add column if not exists blocked boolean not null default false;

-- Done!
