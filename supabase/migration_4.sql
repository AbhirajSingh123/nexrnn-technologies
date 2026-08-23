-- =====================================================================
-- Migration 4: Cashfree payment gateway integration.
-- Run this ENTIRE file once in: Supabase Dashboard → SQL Editor → New query → Run
-- Assumes migration_2.sql and migration_3.sql have already been run.
-- =====================================================================

-- ---------- PAYMENTS (one row per Cashfree order attempt) ----------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  lead_course_id uuid references leads_course (id) on delete cascade,
  cashfree_order_id text unique not null,
  cf_payment_id text not null default '',
  amount numeric not null default 0,
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'pending', 'paid', 'failed', 'expired')),
  payment_method text not null default '',
  raw_response jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table payments enable row level security;

-- Only admins can read payment records from the client. Edge Functions write
-- using the service-role key, which bypasses RLS entirely, so no insert/update
-- policy is needed for them.
create policy "Admins can read payments"
  on payments for select
  using (is_admin(auth.uid()));

create trigger payments_set_updated_at before update on payments
  for each row execute function set_updated_at();

create index if not exists payments_lead_course_id_idx on payments (lead_course_id);
create index if not exists payments_created_at_idx on payments (created_at desc);

-- ---------- Convenience column on leads_course for quick lookup ----------
alter table leads_course add column if not exists cashfree_order_id text not null default '';
