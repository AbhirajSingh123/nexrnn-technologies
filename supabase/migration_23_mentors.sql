-- ============================================================
-- Migration 23: Mentors (admin-managed mentor network)
--
-- Run in: Supabase Dashboard -> SQL Editor
-- (Migration 21/22 ke BAAD run karo)
--
-- Mentor fields: name, email, phone, commission %, location,
-- date of joining, type (course/workshop/both)
-- Mentor ID: RANDOM 'NX-MEN-XXXXXXXX' (DB-generated, jaise Application ID)
-- ============================================================

create table if not exists mentors (
  id uuid primary key default gen_random_uuid(),
  mentor_id text unique,
  name text not null,
  email text not null,
  phone text not null default '',
  commission_percent numeric not null default 0,
  location text not null default '',
  mentor_type text not null default 'both'
    check (mentor_type in ('course', 'workshop', 'both')),
  date_of_joining date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Random unique Mentor ID (retry on rare collision) - R15/R16 pattern
create or replace function public.set_mentor_id()
returns trigger
language plpgsql
as $$
begin
  if new.mentor_id is null or new.mentor_id = '' then
    loop
      new.mentor_id := 'NX-MEN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
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

drop trigger if exists mentors_set_id on mentors;
create trigger mentors_set_id
  before insert on mentors
  for each row execute function public.set_mentor_id();

-- Admin sab kuch kar sakta hai (jaise baaki tables)
alter table mentors enable row level security;
drop policy if exists "Admin full access on mentors" on mentors;
create policy "Admin full access on mentors"
  on mentors for all
  using (true)
  with check (true);

-- Done!
