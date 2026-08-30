-- Migration 13: Site Settings - hide Portfolio / Testimonials sections
-- Run this in Supabase SQL Editor.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS show_portfolio boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_testimonials boolean DEFAULT true;

-- Keep existing row in sync with defaults
UPDATE site_settings
SET show_portfolio = COALESCE(show_portfolio, true),
    show_testimonials = COALESCE(show_testimonials, true)
WHERE id = 1;
