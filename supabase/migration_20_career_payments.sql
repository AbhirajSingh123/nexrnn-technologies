-- ============================================================
-- Migration 20: Career applications payment (Cashfree) + counts
--
-- Run in: Supabase Dashboard -> SQL Editor
-- (Migration 19 ke BAAD run karo)
--
-- 1. internship_applications me payment columns:
--    payment_status ('free' | 'pending' | 'paid'), amount,
--    order_id, cf_payment_id, method, paid_at.
-- 2. payments table me application link + item title
--    (career application payments admin Payments page par dikhenge).
-- ============================================================

-- ---------- 1) Applications: payment info ----------
alter table internship_applications
  add column if not exists payment_status text not null default 'free',
  add column if not exists payment_amount numeric not null default 0,
  add column if not exists order_id text default '',
  add column if not exists cf_payment_id text default '',
  add column if not exists payment_method text default '',
  add column if not exists paid_at timestamptz;

-- ---------- 2) Payments: career application link ----------
alter table payments
  add column if not exists application_id uuid references internship_applications (id) on delete set null,
  add column if not exists item_title text default '';

-- lead_type check constraint relax karo (agar hai) taaki 'career' bhi chale
alter table payments drop constraint if exists payments_lead_type_check;

-- Done!
