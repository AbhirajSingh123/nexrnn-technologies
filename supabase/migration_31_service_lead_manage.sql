-- ============================================================
-- Migration 31: Service Leads manage (admin) + amount
--
-- Run in: Supabase Dashboard -> SQL Editor
-- (Migration 30 ke BAAD run karo)
--
-- 1. leads_service: amount column (deal value, admin manage karta hai)
-- 2. Admin UPDATE policy (manage modal: referral code / status /
--    amount / message edit - user ka input data read-only rehta hai)
--    referral_code column migration 30 me already add ho chuka hai.
-- ============================================================

alter table leads_service
  add column if not exists amount numeric not null default 0;

drop policy if exists "Admins can update service leads" on leads_service;
create policy "Admins can update service leads"
  on leads_service for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- Done! Koi edge function redeploy zaroori nahi (sirf ye migration).
