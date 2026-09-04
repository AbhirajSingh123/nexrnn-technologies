-- ============================================================
-- Migration 34: Announcements 2-way (reactions + replies)
--   mentor/sales kisi bhi announcement par emoji react kar sake
--   aur us par reply kar sake; admin ko sab history me dikhega
-- ============================================================

-- ---------- 1) reactions (ek member + ek emoji = ek hi row; toggle) ----------
create table if not exists announcement_reactions (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements (id) on delete cascade,
  reactor_type text not null check (reactor_type in ('mentor', 'sales')),
  reactor_uuid uuid not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (announcement_id, reactor_type, reactor_uuid, emoji)
);

create index if not exists announcement_reactions_ann_idx
  on announcement_reactions (announcement_id);

alter table announcement_reactions enable row level security;
drop policy if exists "Admins manage announcement reactions" on announcement_reactions;
create policy "Admins manage announcement reactions"
  on announcement_reactions for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ---------- 2) replies (team discussion) ----------
-- replier_name denormalized hai taaki member hat jaye to bhi reply history me naam dikhe
create table if not exists announcement_replies (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements (id) on delete cascade,
  replier_type text not null check (replier_type in ('mentor', 'sales')),
  replier_uuid uuid not null,
  replier_name text not null default '',
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists announcement_replies_ann_idx
  on announcement_replies (announcement_id, created_at);

alter table announcement_replies enable row level security;
drop policy if exists "Admins manage announcement replies" on announcement_replies;
create policy "Admins manage announcement replies"
  on announcement_replies for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));
