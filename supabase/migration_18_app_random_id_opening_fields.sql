-- ============================================================
-- Migration 18: Application ID random + Opening domain/dates
--
-- Run in: Supabase Dashboard -> SQL Editor
-- (Migration 17 ke BAAD run karo)
--
-- 1. Application ID ab RANDOM hota hai (koi serial pattern nahi):
--    NX-APP-XXXXXXXX  (8 random uppercase chars)
--    - duplicate kabhi nahi (unique index + retry)
--    - purana counter table hata diya
-- 2. Careers me admin-create ke waqt ke fields:
--    domain, start_date, end_date
-- 3. Applications me opening ka snapshot:
--    opening_code (job/internship ID), opening_domain
-- ============================================================

-- ---------- 1) Careers: admin-controlled domain + dates ----------
alter table careers
  add column if not exists domain text default '',
  add column if not exists start_date date,
  add column if not exists end_date date;

-- ---------- 2) Applications: opening snapshot columns ----------
alter table internship_applications
  add column if not exists opening_code text default '',
  add column if not exists opening_domain text default '';

-- ---------- 3) Application ID: random, pattern-free ----------
-- Purana counter system hatao
drop trigger if exists internship_applications_set_id on internship_applications;
drop function if exists public.set_application_id();
drop table if exists public.application_id_counters;
drop function if exists public.next_application_seq(text, text);

-- Random unique ID generator (retry on rare collision)
create or replace function public.set_application_id()
returns trigger
language plpgsql
as $$
begin
  if new.application_id is null or new.application_id = '' then
    loop
      new.application_id := 'NX-APP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
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

drop trigger if exists internship_applications_set_id on internship_applications;
create trigger internship_applications_set_id
  before insert on internship_applications
  for each row execute function public.set_application_id();

-- Done!
