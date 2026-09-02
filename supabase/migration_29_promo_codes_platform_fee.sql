-- ============================================================
-- Migration 29: Promo Codes + Platform Fee (payment popup)
-- - promo_codes table: admin banata hai (discount, specific item, active)
-- - site_settings: platform fee (hide/show + amount) + promo box (hide/show)
-- - payments: payment breakdown columns (base, discount, promo, platform fee)
-- ============================================================

-- 1) Promo codes
create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null default 'percent' check (discount_type in ('percent', 'flat')),
  discount_value numeric not null default 0,
  applies_to text not null default 'all' check (applies_to in ('all', 'course', 'workshop', 'career')),
  item_id uuid,
  max_uses int,
  used_count int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists promo_codes_code_idx on promo_codes (code);

alter table promo_codes enable row level security;
drop policy if exists "Admin full access on promo_codes" on promo_codes;
create policy "Admin full access on promo_codes"
  on promo_codes for all
  using (true)
  with check (true);

-- 2) Platform fee + promo box visibility (admin panel se manage)
alter table site_settings
  add column if not exists platform_fee_enabled boolean not null default false,
  add column if not exists platform_fee_amount numeric not null default 0,
  add column if not exists promo_box_enabled boolean not null default true;

-- 3) Payments: breakdown
alter table payments
  add column if not exists base_amount numeric,
  add column if not exists discount_amount numeric not null default 0,
  add column if not exists promo_code text not null default '',
  add column if not exists platform_fee numeric not null default 0;

-- Done! Run migration 29, then REDEPLOY edge functions:
--   create-cashfree-order  (promo + platform fee + breakdown)
--   validate-promo         (NEW function)

-- 4) Promo usage counter (edge functions se call hota hai)
create or replace function public.increment_promo_used_count(p_code text)
returns void
language sql
security definer
as $$
  update promo_codes set used_count = used_count + 1 where code = p_code;
$$;
