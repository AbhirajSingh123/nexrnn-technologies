-- ============================================================
-- Migration 11: Batch ID system
--
-- Run in: Supabase Dashboard -> SQL Editor
--
-- - Har Course/Workshop ka UNIQUE Batch ID auto-generate hota hai
--   (jaise NX-C-4F7B2A) jab bhi naya add ho.
-- - Same batch mein enrolled users ke leads mein wahi Batch ID
--   automatically chala jata hai.
-- - Admin panel mein Batch ID column + Participants page isse use karta hai.
-- ============================================================

-- ---------- 1) Batch ID generator function ----------
create or replace function public.generate_batch_id(prefix text)
returns text
language sql
volatile
as $$
  select prefix || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

-- ---------- 2) courses / workshops tables mein batch_id ----------
alter table courses
  add column if not exists batch_id text;

alter table workshops
  add column if not exists batch_id text;

-- Unique indexes (null wale rows allowed, unique empty nahi)
create unique index if not exists courses_batch_id_uidx on courses (batch_id) where batch_id is not null;
create unique index if not exists workshops_batch_id_uidx on workshops (batch_id) where batch_id is not null;

-- ---------- 3) Auto-generate triggers ----------
create or replace function public.set_batch_id()
returns trigger
language plpgsql
as $$
begin
  if new.batch_id is null or new.batch_id = '' then
    if tg_table_name = 'courses' then
      new.batch_id := public.generate_batch_id('NX-C-');
    else
      new.batch_id := public.generate_batch_id('NX-W-');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists courses_set_batch_id on courses;
create trigger courses_set_batch_id
  before insert on courses
  for each row execute function public.set_batch_id();

drop trigger if exists workshops_set_batch_id on workshops;
create trigger workshops_set_batch_id
  before insert on workshops
  for each row execute function public.set_batch_id();

-- ---------- 4) Purane courses/workshops backfill ----------
update courses
set batch_id = public.generate_batch_id('NX-C-')
where batch_id is null or batch_id = '';

update workshops
set batch_id = public.generate_batch_id('NX-W-')
where batch_id is null or batch_id = '';

-- ---------- 5) Purane enrollments ko unke batch se link karo ----------
update leads_course lc
set batch_id = c.batch_id
from courses c
where lc.course_slug = c.slug
  and (lc.batch_id is null or lc.batch_id = '');

update leads_workshop lw
set batch_id = w.batch_id
from workshops w
where lw.workshop_slug = w.slug
  and (lw.batch_id is null or lw.batch_id = '');

-- Done! Ab naya course/workshop add karte hi Batch ID ban jayega.
