-- ============================================================
-- Migration 12: Blog unique ID + Blog Views
--
-- Run in: Supabase Dashboard -> SQL Editor
--
-- 1. blog_code : har blog post ka UNIQUE ID (NX-B-XXXXXX)
--    publish hote hi automatically generate hota hai.
--    Admin panel -> Manage Blog table mein dikhega.
-- 2. views     : har blog ke views ka counter. Visitor blog
--    padhnekhola (per session ek baar) to +1 hota hai.
-- ============================================================

-- ---------- 1) Columns ----------
alter table blog_posts
  add column if not exists blog_code text;

alter table blog_posts
  add column if not exists views bigint not null default 0;

create unique index if not exists blog_posts_code_uidx
  on blog_posts (blog_code) where blog_code is not null;

-- ---------- 2) Auto-generate on publish (insert) ----------
create or replace function public.generate_blog_code()
returns text
language sql
volatile
as $$
  select 'NX-B-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

create or replace function public.set_blog_code()
returns trigger
language plpgsql
as $$
begin
  if new.blog_code is null or new.blog_code = '' then
    new.blog_code := public.generate_blog_code();
  end if;
  return new;
end;
$$;

drop trigger if exists blog_posts_set_code on blog_posts;
create trigger blog_posts_set_code
  before insert on blog_posts
  for each row execute function public.set_blog_code();

-- ---------- 3) Purane posts backfill ----------
update blog_posts
set blog_code = public.generate_blog_code()
where blog_code is null or blog_code = '';

-- ---------- 4) Public view counter (secure RPC) ----------
-- Visitors blog_posts ko update nahi kar sakte (RLS), isliye
-- security definer RPC sirf views +1 karta hai - kuch aur nahi.
create or replace function public.increment_blog_views(p_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update blog_posts
  set views = coalesce(views, 0) + 1
  where slug = p_slug;
$$;

grant execute on function public.increment_blog_views(text) to anon, authenticated;

-- Done!
