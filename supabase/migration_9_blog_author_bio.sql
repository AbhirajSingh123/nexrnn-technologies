-- ============================================================
-- Migration 9: Blog post author bio (editable paragraph)
--
-- Run in: Supabase Dashboard -> SQL Editor
--
-- "About the Author" card mein jo paragraph dikhta hai
-- (author name + role ke niche), wo ab admin panel se
-- har blog ke liye edit kiya ja sakta hai.
-- ============================================================

alter table blog_posts
  add column if not exists author_bio text not null default '';

-- Purane posts mein bio khali rahegi -> site par default text dikhega
-- (jab tak admin us post ko edit karke apna bio na daale).

-- Done!
