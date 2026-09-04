-- ============================================================
-- Migration 30: NexRNN Sales Team (panel + refer & earn)
--
-- Run in: Supabase Dashboard -> SQL Editor
-- (Migration 29 ke BAAD run karo)
--
-- 1. sales_members: admin-managed sales team (jaise mentors)
--    - Sales ID: 'NX-SAL-XXXXXXXX' (DB-generated, admin edit nahi kar sakta)
--    - referral_code: 7-digit unique Refer & Earn code (DB-generated,
--      NOT changeable - koi update isse kabhi overwrite nahi karta)
--    - commission_course / commission_workshop / commission_service (%)
-- 2. sales_withdrawals: wallet payment requests NX-SW-XXXXXXXX
-- 3. sales_issues: Report an Issue (NX-SIS-XXXXXXXX) + private bucket
-- 4. referral_code column on leads + payments (attribution)
-- ============================================================

-- ---------- 1) sales_members ----------
create table if not exists sales_members (
  id uuid primary key default gen_random_uuid(),
  sales_id text unique,
  referral_code text unique,
  name text not null,
  email text not null,
  phone text not null default '',
  commission_percent numeric not null default 0,
  commission_course numeric not null default 0,
  commission_workshop numeric not null default 0,
  commission_service numeric not null default 0,
  bank_acc_no text not null default '',
  bank_acc_name text not null default '',
  bank_ifsc text not null default '',
  upi_id text not null default '',
  location text not null default '',
  gender text not null default '',
  blocked boolean not null default false,
  date_of_joining date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sales ID: random unique 'NX-SAL-XXXXXXXX' (R15/R23 pattern, retry on collision)
create or replace function public.set_sales_id()
returns trigger
language plpgsql
as $$
begin
  if new.sales_id is null or new.sales_id = '' then
    loop
      new.sales_id := 'NX-SAL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
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

drop trigger if exists sales_members_set_id on sales_members;
create trigger sales_members_set_id
  before insert on sales_members
  for each row execute function public.set_sales_id();

-- Refer & Earn code: random unique 7-digit number (1000000-9999999).
-- Sirf INSERT par generate hota hai - update par kabhi nahi (not changeable).
create or replace function public.set_sales_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null or new.referral_code = '' then
    loop
      new.referral_code := ((floor(random() * 9000000) + 1000000)::int)::text;
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

drop trigger if exists sales_members_set_referral_code on sales_members;
create trigger sales_members_set_referral_code
  before insert on sales_members
  for each row execute function public.set_sales_referral_code();

alter table sales_members enable row level security;
drop policy if exists "Admins manage sales_members" on sales_members;
create policy "Admins manage sales_members"
  on sales_members for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ---------- 2) sales_withdrawals (wallet requests) ----------
create table if not exists sales_withdrawals (
  id uuid primary key default gen_random_uuid(),
  withdrawal_code text unique,
  sales_uuid uuid not null references sales_members (id) on delete cascade,
  sales_id text not null default '',
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

create index if not exists sales_withdrawals_sales_idx on sales_withdrawals (sales_uuid);
create index if not exists sales_withdrawals_status_idx on sales_withdrawals (status);

create or replace function public.set_sales_withdrawal_code()
returns trigger
language plpgsql
as $$
begin
  if new.withdrawal_code is null or new.withdrawal_code = '' then
    loop
      new.withdrawal_code := 'NX-SW-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
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

drop trigger if exists sales_withdrawals_set_code on sales_withdrawals;
create trigger sales_withdrawals_set_code
  before insert on sales_withdrawals
  for each row execute function public.set_sales_withdrawal_code();

alter table sales_withdrawals enable row level security;
drop policy if exists "Admin full access on sales_withdrawals" on sales_withdrawals;
create policy "Admin full access on sales_withdrawals"
  on sales_withdrawals for all
  using (true)
  with check (true);

-- ---------- 3) sales_issues ----------
create table if not exists sales_issues (
  id uuid primary key default gen_random_uuid(),
  issue_id text unique,
  sales_uuid uuid not null references sales_members (id) on delete cascade,
  sales_id text not null default '',
  name text not null,
  mobile text not null,
  email text not null,
  issue text not null,
  attachment_path text not null default '',
  status text not null default 'Open'
    check (status in ('Open', 'In Progress', 'Resolved', 'Closed')),
  admin_response text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_sales_issue_id()
returns trigger
language plpgsql
as $$
begin
  if new.issue_id is null or new.issue_id = '' then
    loop
      new.issue_id := 'NX-SIS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
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

drop trigger if exists sales_issues_set_id on sales_issues;
create trigger sales_issues_set_id
  before insert on sales_issues
  for each row execute function public.set_sales_issue_id();

create trigger sales_issues_set_updated_at before update on sales_issues
  for each row execute function set_updated_at();

alter table sales_issues enable row level security;

create policy "Admins read sales issues"
  on sales_issues for select
  using (is_admin(auth.uid()));

create policy "Admins update sales issues"
  on sales_issues for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create index if not exists sales_issues_sales_idx on sales_issues (sales_uuid);
create index if not exists sales_issues_created_idx on sales_issues (created_at desc);

-- sales-issues private bucket (sirf admin signed-url se padhta hai)
insert into storage.buckets (id, name, public)
values ('sales-issues', 'sales-issues', false)
on conflict (id) do nothing;

drop policy if exists "Admins read sales issue files" on storage.objects;
create policy "Admins read sales issue files"
  on storage.objects for select
  using (bucket_id = 'sales-issues' and is_admin(auth.uid()));

-- ---------- 4) referral_code attribution (leads + payments) ----------
alter table leads_course add column if not exists referral_code text not null default '';
alter table leads_workshop add column if not exists referral_code text not null default '';
alter table leads_service add column if not exists referral_code text not null default '';
alter table internship_applications add column if not exists referral_code text not null default '';
alter table payments add column if not exists referral_code text not null default '';

create index if not exists leads_course_referral_idx on leads_course (referral_code);
create index if not exists leads_workshop_referral_idx on leads_workshop (referral_code);
create index if not exists leads_service_referral_idx on leads_service (referral_code);
create index if not exists payments_referral_idx on payments (referral_code);

-- Done! Run this, then redeploy BOTH new edge functions: sales-login + sales-data.
