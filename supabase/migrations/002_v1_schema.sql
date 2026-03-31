-- V1 schema additions
-- Adds structured opening hours, hero subtitle, RSS settings, and pinned announcements

-- display_settings: structured opening hours (replaces free-text opening_hours_text)
ALTER TABLE display_settings
  ADD COLUMN IF NOT EXISTS opening_hours_mon_fri TEXT DEFAULT 'Ma–Pe 8:00–16:00',
  ADD COLUMN IF NOT EXISTS opening_hours_sat     TEXT DEFAULT 'La suljettu',
  ADD COLUMN IF NOT EXISTS opening_hours_sun     TEXT DEFAULT 'Su suljettu';

-- display_settings: hero subtitle line below welcome_text
ALTER TABLE display_settings
  ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT NULL;

-- display_settings: RSS feed settings
ALTER TABLE display_settings
  ADD COLUMN IF NOT EXISTS show_rss      BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rss_feed_url  TEXT     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rss_max_items SMALLINT DEFAULT 3;

-- announcements: pinned flag (only one should be pinned at a time, enforced in app logic)
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
