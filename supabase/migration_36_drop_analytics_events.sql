-- ============================================================
-- Migration 36: analytics_events table DROP
--   DB storage full kar rahi thi — site tracking ab sirf
--   Google Analytics (GA4/GTM) se hoti hai (client code already
--   GA4/GTM ko bhejta hai). Purana data delete ho jayega.
-- ============================================================

drop table if exists analytics_events;
