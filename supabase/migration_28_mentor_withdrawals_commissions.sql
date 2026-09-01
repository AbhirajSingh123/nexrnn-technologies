-- ============================================================
-- Migration 28: Mentor Withdrawals (Wallet) + Split Commissions
-- - mentor_withdrawals table: payment requests NX-W-XXXXXXXX (DB-generated)
-- - mentors: commission_course / commission_workshop (alag rates)
-- - mentors: saved payout details (bank / UPI) - admin Manage me dikhega
-- ============================================================

-- 1) Split commissions + saved payout details on mentors
alter table mentors
  add column if not exists commission_course numeric not null default 0,
  add column if not exists commission_workshop numeric not null default 0,
  add column if not exists bank_acc_no text not null default '',
  add column if not exists bank_acc_name text not null default '',
  add column if not exists bank_ifsc text not null default '',
  add column if not exists upi_id text not null default '';

-- Purane mentors ka split = single commission_percent se backfill
update mentors set commission_course = commission_percent
  where commission_course = 0 and commission_percent > 0;
update mentors set commission_workshop = commission_percent
  where commission_workshop = 0 and commission_percent > 0;

-- 2) Withdrawal requests
create table if not exists mentor_withdrawals (
  id uuid primary key default gen_random_uuid(),
  withdrawal_code text unique,
  mentor_uuid uuid not null references mentors (id) on delete cascade,
  mentor_id text not null default '',
  name text not null default '',
  amount numeric not null default 0,
  method text not null default 'upi' check (method in ('bank', 'upi')),
  acc_no text not null default '',
  acc_name text not null default '',
  bank_ifsc text not null default '',
  upi_id text not null default '',
  status text not null default 'Created' check (status in ('Created', 'In progress', 'Payment Done')),
  ref_no text not null default '',
  admin_message text not null default '',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists mentor_withdrawals_mentor_idx on mentor_withdrawals (mentor_uuid);
create index if not exists mentor_withdrawals_status_idx on mentor_withdrawals (status);

-- 3) Random unique Payment Request ID 'NX-W-XXXXXXXX' (R15/R23 pattern)
create or replace function public.set_withdrawal_code()
returns trigger
language plpgsql
as $$
begin
  if new.withdrawal_code is null or new.withdrawal_code = '' then
    loop
      new.withdrawal_code := 'NX-W-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      begin
        exit;
      exception when unique_violation then
        continue;
      end;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists mentor_withdrawals_set_code on mentor_withdrawals;
create trigger mentor_withdrawals_set_code
  before insert on mentor_withdrawals
  for each row execute function public.set_withdrawal_code();

-- 4) RLS: admin panel service key sab kuch, mentor sirf edge function se
alter table mentor_withdrawals enable row level security;
drop policy if exists "Admin full access on mentor_withdrawals" on mentor_withdrawals;
create policy "Admin full access on mentor_withdrawals"
  on mentor_withdrawals for all
  using (true)
  with check (true);

-- Done! Run migrations 12-28, then redeploy BOTH mentor edge functions.
