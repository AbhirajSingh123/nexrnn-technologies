-- ============================================================
-- Migration 8: Blog post CTA (call-to-action) link columns
--              + storage SELECT policy warning fix
--
-- Run in: Supabase Dashboard -> SQL Editor
-- ============================================================

-- ---------- 1) Blog CTA columns ----------
-- Admin har blog mein ek optional link/button add kar sakta hai
-- jo article padhne ke baad dikhta hai (redirect anywhere).
alter table blog_posts
  add column if not exists cta_text text not null default '';

alter table blog_posts
  add column if not exists cta_url text not null default '';

-- ---------- 2) Storage warning fix ----------
-- Supabase dashboard warning: "A broad SELECT policy on storage.objects
-- allows clients to retrieve a full list of files."
-- Public buckets ko SELECT policy ki zaroorat NAHI hoti -
-- public URL se files direct serve hoti hain (via /storage/v1/object/public/...).
-- Upload/update/delete admin policies waise hi rahengi.
drop policy if exists "Public can view blog assets" on storage.objects;

-- Done! Ab dashboard ka warning hat jayega aur cover images
-- public URL se waise hi serve hongi.
