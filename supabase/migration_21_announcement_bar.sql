-- Migration 21: Announcement bar (top strip above navbar)
-- site_settings me announcement fields add karo
alter table site_settings
  add column if not exists announcement_enabled boolean default false,
  add column if not exists announcement_text text default 'Admissions open for new batches — limited seats!',
  add column if not exists announcement_button_text text default 'Contact Us',
  add column if not exists announcement_button_link text default '/Contect-us';
