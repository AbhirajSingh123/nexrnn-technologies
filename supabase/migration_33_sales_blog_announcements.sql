-- ============================================================
-- Migration 33: Sales "My Blogs" + Announcements system
--   1) blog_posts.sales_uuid  -> sales panel apne blogs likhe
--   2) announcements table    -> admin mentor/sales ko notice bheje
-- ============================================================

-- ---------- 1) blog_posts: kaunsa sales member ne likha ----------
alter table blog_posts
  add column if not exists sales_uuid uuid references sales_members (id) on delete set null;

create index if not exists blog_posts_sales_idx on blog_posts (sales_uuid);

-- ---------- 2) announcements (admin -> mentor/sales) ----------
-- target_uuid null = poore audience ko; warna sirf us member ko
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('mentor', 'sales')),
  target_uuid uuid,
  title text not null,
  message text not null,
  created_by text not null default 'admin',
  created_at timestamptz not null default now()
);

create index if not exists announcements_audience_idx
  on announcements (audience, created_at desc);

alter table announcements enable row level security;
drop policy if exists "Admins manage announcements" on announcements;
create policy "Admins manage announcements"
  on announcements for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));
