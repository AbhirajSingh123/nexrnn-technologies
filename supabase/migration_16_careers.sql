-- ============================================================
-- Migration 16: Careers (Jobs + Internships, admin-managed)
--
-- Run in: Supabase Dashboard -> SQL Editor
--
-- 1. careers table : title, type (job/internship), location,
--    last_date_apply, application fee (free/paid + amount),
--    markdown content, publish toggle, unique code NX-CR-XXXXXX.
-- 2. RLS           : public sirf published dekhega,
--    admins sab manage karenge.
-- ============================================================

-- ---------- 1) Table ----------
create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(),
  career_code text,
  title text not null,
  slug text not null unique,
  type text not null default 'job',            -- 'job' | 'internship'
  location text default '',
  excerpt text default '',
  content text default '',
  fee_type text not null default 'free',       -- 'free' | 'paid'
  fee_amount numeric not null default 0,
  last_date_apply date,
  is_published boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 2) Unique career code (NX-CR-XXXXXX) ----------
create unique index if not exists careers_code_uidx
  on careers (career_code) where career_code is not null;

create or replace function public.generate_career_code()
returns text
language sql
volatile
as $$
  select 'NX-CR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

create or replace function public.set_career_code()
returns trigger
language plpgsql
as $$
begin
  if new.career_code is null or new.career_code = '' then
    new.career_code := public.generate_career_code();
  end if;
  return new;
end;
$$;

drop trigger if exists careers_set_code on careers;
create trigger careers_set_code
  before insert on careers
  for each row execute function public.set_career_code();

-- ---------- 3) RLS ----------
alter table careers enable row level security;

create policy "Anyone can read published careers"
  on careers for select
  using (is_published = true or is_admin(auth.uid()));

create policy "Admins can manage careers"
  on careers for all
  using (is_admin(auth.uid()));

-- Done!
