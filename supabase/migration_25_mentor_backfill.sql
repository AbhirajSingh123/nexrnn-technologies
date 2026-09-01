-- ============================================================
-- Migration 25: Saare courses/workshops ko default mentor se connect
--
-- Run in: Supabase Dashboard -> SQL Editor
-- (Migration 24 ke BAAD run karo)
--
-- 1. BACKFILL: abhi ke SAARE courses + workshops Abhiraj Singh
--    (NX-MEN-7702109A) ko assign kar do
-- 2. AUTO-ASSIGN TRIGGER: aage jab bhi naya course/workshop bana
--    (admin panel se), to apne aap default mentor se connect ho jaye
--    (default = NX-MEN-7702109A, na ho to sabse pehla mentor)
-- ============================================================

-- ---------- helper: default mentor ka uuid ----------
create or replace function public.default_mentor_uuid()
returns uuid
language plpgsql
as $$
declare
  m uuid;
begin
  -- pehle Abhiraj Singh (NX-MEN-7702109A), warna sabse pehla mentor
  select id into m from mentors where mentor_id = 'NX-MEN-7702109A' limit 1;
  if m is null then
    select id into m from mentors order by created_at asc limit 1;
  end if;
  return m;
end;
$$;

-- ---------- 1) BACKFILL: purane saare items ----------
insert into mentor_course_assignments (mentor_uuid, course_id)
select public.default_mentor_uuid(), c.id
from courses c
where public.default_mentor_uuid() is not null
on conflict (mentor_uuid, course_id) do nothing;

insert into mentor_workshop_assignments (mentor_uuid, workshop_id)
select public.default_mentor_uuid(), w.id
from workshops w
where public.default_mentor_uuid() is not null
on conflict (mentor_uuid, workshop_id) do nothing;

-- ---------- 2) AUTO-ASSIGN: naye items ka trigger ----------
create or replace function public.auto_assign_mentor_on_item_create()
returns trigger
language plpgsql
as $$
declare
  m uuid;
begin
  m := public.default_mentor_uuid();
  if m is null then
    return new; -- koi mentor hi nahi - skip
  end if;

  if tg_table_name = 'courses' then
    insert into mentor_course_assignments (mentor_uuid, course_id)
    values (m, new.id)
    on conflict (mentor_uuid, course_id) do nothing;
  elsif tg_table_name = 'workshops' then
    insert into mentor_workshop_assignments (mentor_uuid, workshop_id)
    values (m, new.id)
    on conflict (mentor_uuid, workshop_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists courses_auto_assign_mentor on courses;
create trigger courses_auto_assign_mentor
  after insert on courses
  for each row execute function public.auto_assign_mentor_on_item_create();

drop trigger if exists workshops_auto_assign_mentor on workshops;
create trigger workshops_auto_assign_mentor
  after insert on workshops
  for each row execute function public.auto_assign_mentor_on_item_create();

-- Done!
