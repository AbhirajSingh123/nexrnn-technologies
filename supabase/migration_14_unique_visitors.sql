-- Migration 14: Unique visitor tracking for analytics
-- Run this in Supabase SQL Editor.

ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS visitor_id text;

CREATE INDEX IF NOT EXISTS analytics_events_visitor_id_idx
  ON analytics_events (visitor_id);
