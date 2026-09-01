-- Migration 22: Stats band (home page numbers strip) admin control
alter table site_settings
  add column if not exists stats_band_enabled boolean default true,
  add column if not exists stats_json text default '';
