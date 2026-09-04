-- ============================================================
-- Migration 32: Offline payments (admin "Mark as Paid") +
--               service-lead commission timing
-- ============================================================

-- 1) payments: offline marking ke liye + referral commission control
alter table payments add column if not exists commission_eligible boolean not null default true;
alter table payments add column if not exists offline_method text not null default '';
alter table payments add column if not exists offline_note text not null default '';

-- 2) leads_service: admin jab amount/status set kare to time record ho
--    (sales dashboard ke "today/month" commission ke liye)
alter table leads_service add column if not exists updated_at timestamptz not null default now();
