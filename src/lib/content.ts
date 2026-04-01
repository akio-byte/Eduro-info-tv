import type { Tables } from '../types/database';

export const DISPLAY_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

type WindowedContent = {
  is_published: boolean;
  start_at: string | null;
  end_at: string | null;
};

export function createDefaultDisplaySettings(): Tables<'display_settings'> {
  return {
    id: DISPLAY_SETTINGS_ID,
    org_name: 'Eduro',
    welcome_text: 'Tervetuloa Eduroon!',
    hero_subtitle: null,
    rotation_interval_seconds: 15,
    show_announcements: true,
    show_events: true,
    show_highlights: true,
    show_qr_links: true,
    show_opening_hours: true,
    show_jobs: false,
    show_rss: false,
    opening_hours_text: 'Ma-Pe 08:00 - 16:00',
    opening_hours_mon_fri: 'Ma–Pe 8:00–16:00',
    opening_hours_sat: 'La suljettu',
    opening_hours_sun: 'Su suljettu',
    rss_feed_url: null,
    rss_max_items: 3,
    fallback_message: 'Ei uusia tiedotteita tällä hetkellä. Mukavaa päivää!',
    accent_color: '#0ea5e9',
    updated_at: new Date().toISOString(),
  };
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

export function hasValidDateTimeWindow(startAt: string, endAt: string) {
  if (!startAt || !endAt) {
    return true;
  }

  return new Date(startAt) <= new Date(endAt);
}

export function toDateTimeInputValue(value: string | null) {
  return value ? value.slice(0, 16) : '';
}

export function toDateTimeRange(startAt: string, endAt: string) {
  return {
    start_at: startAt ? new Date(startAt).toISOString() : null,
    end_at: endAt ? new Date(endAt).toISOString() : null,
  };
}

export function parseEventDate(value: string) {
  if (value.includes('T')) {
    return new Date(value);
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isUpcomingEventDate(eventDate: string, now: Date) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return parseEventDate(eventDate) >= startOfToday;
}

export function isVisibleInWindow(item: WindowedContent, now: Date) {
  if (!item.is_published) {
    return false;
  }

  if (item.start_at && new Date(item.start_at) > now) {
    return false;
  }

  if (item.end_at && new Date(item.end_at) < now) {
    return false;
  }

  return true;
}
