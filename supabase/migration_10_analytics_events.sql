-- ============================================================
-- Migration 10: analytics_events table
--
-- Run in: Supabase Dashboard -> SQL Editor
--
-- Site ke saare tracking events (page views, WhatsApp clicks,
-- phone clicks, leads, purchases, blog reads...) yahan save
-- hote hain. Admin panel -> Traffic & Analytics inhe dikhata hai.
-- ============================================================

create table if not exists analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  path text not null default '',
  label text not null default '',
  value numeric,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_name_time
  on analytics_events (event_name, created_at desc);

create index if not exists idx_analytics_events_created_at
  on analytics_events (created_at desc);

-- Public: sirf INSERT allowed (visitors events bhej sakte hain)
drop policy if exists "Anyone can insert analytics events" on analytics_events;
create policy "Anyone can insert analytics events"
  on analytics_events for insert
  with check (true);

-- Sirf admin padh sakta hai
drop policy if exists "Admins can read analytics events" on analytics_events;
create policy "Admins can read analytics events"
  on analytics_events for select
  using (is_admin(auth.uid()));

-- No update/delete policies: koi data badal nahi sakta.

-- (Optional) 90 din se purane events auto-cleanup ke liye pg_cron
-- extension on ho to ye uncomment kar do:
-- select cron.schedule('cleanup-analytics', '0 3 * * *',
--   $$delete from analytics_events where created_at < now() - interval '90 days'$$);

-- Done!
