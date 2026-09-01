-- ============================================================
-- Migration 26: Mentor-created courses/workshops + mentor blogs
--
-- Run in: Supabase Dashboard -> SQL Editor
-- (Migration 25 ke BAAD run karo)
-- ============================================================

-- ---------- 1) blog_posts: kaunsa mentor ne likha ----------
alter table blog_posts
  add column if not exists mentor_uuid uuid references mentors (id) on delete set null;

create index if not exists blog_posts_mentor_idx on blog_posts (mentor_uuid);

-- (RLS badlav ki zaroorat nahi: public sirf published padhta hai - existing
--  policy. Mentor apne blogs edge function (service role) se hi likhta hai.)

-- Done!
