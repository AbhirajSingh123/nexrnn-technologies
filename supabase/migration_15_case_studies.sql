-- ============================================================
-- Migration 15: Case Studies (admin-managed, same as Blog)
--
-- Run in: Supabase Dashboard -> SQL Editor
--
-- 1. case_studies table  : title, slug, client, industry,
--    excerpt, content, cover image, tags, publish toggle,
--    views + unique case code (NX-CS-XXXXXX).
-- 2. RLS                 : public sirf published dekhega,
--    admins sab kuch manage kar sakte hain.
-- 3. increment_case_study_views RPC : views counter secure +1.
-- ============================================================

-- ---------- 1) Table ----------
create table if not exists public.case_studies (
  id uuid primary key default gen_random_uuid(),
  case_code text,
  title text not null,
  slug text not null unique,
  client_name text default '',
  industry text default '',
  excerpt text default '',
  content text default '',
  cover_image_url text default '',
  tags text[] default '{}',
  is_published boolean not null default false,
  published_at timestamptz,
  views bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 2) Unique case code (NX-CS-XXXXXX) ----------
create unique index if not exists case_studies_code_uidx
  on case_studies (case_code) where case_code is not null;

create or replace function public.generate_case_code()
returns text
language sql
volatile
as $$
  select 'NX-CS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

create or replace function public.set_case_code()
returns trigger
language plpgsql
as $$
begin
  if new.case_code is null or new.case_code = '' then
    new.case_code := public.generate_case_code();
  end if;
  return new;
end;
$$;

drop trigger if exists case_studies_set_code on case_studies;
create trigger case_studies_set_code
  before insert on case_studies
  for each row execute function public.set_case_code();

-- ---------- 3) RLS ----------
alter table case_studies enable row level security;

create policy "Anyone can read published case studies"
  on case_studies for select
  using (is_published = true or is_admin(auth.uid()));

create policy "Admins can manage case studies"
  on case_studies for all
  using (is_admin(auth.uid()));

-- ---------- 4) Public views counter (secure RPC) ----------
create or replace function public.increment_case_study_views(p_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update case_studies
  set views = coalesce(views, 0) + 1
  where slug = p_slug;
$$;

grant execute on function public.increment_case_study_views(text) to anon, authenticated;

-- Done!
