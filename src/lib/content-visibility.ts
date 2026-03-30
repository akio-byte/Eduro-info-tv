import type { Tables } from '../types/database';

type WindowedContent = Pick<Tables<'announcements'>, 'is_published' | 'start_at' | 'end_at'>;
type EventContent = Pick<Tables<'events'>, 'is_published' | 'event_date'>;

export type WindowStatus = 'active' | 'scheduled' | 'expired' | 'hidden';
export type EventStatus = 'active' | 'past' | 'hidden';
export type AdminStatus = WindowStatus | EventStatus;

const adminStatusBadges: Record<AdminStatus, { label: string; className: string }> = {
  active: {
    label: 'Aktiivinen',
    className: 'rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800',
  },
  scheduled: {
    label: 'Ajastettu',
    className: 'rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800',
  },
  expired: {
    label: 'Päättynyt',
    className: 'rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800',
  },
  hidden: {
    label: 'Piilotettu',
    className: 'rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800',
  },
  past: {
    label: 'Menneisyydessä',
    className: 'rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800',
  },
};

export function getStartOfLocalDay(now = new Date()): Date {
  const localDay = new Date(now);
  localDay.setHours(0, 0, 0, 0);
  return localDay;
}

export function normalizeDateOnly(value: string): string {
  return value.includes('T') ? value.split('T')[0] : value;
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = normalizeDateOnly(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isActiveTimeWindow(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (startAt && new Date(startAt) > now) {
    return false;
  }

  if (endAt && new Date(endAt) < now) {
    return false;
  }

  return true;
}

export function getWindowStatus(content: WindowedContent, now = new Date()): WindowStatus {
  if (!content.is_published) {
    return 'hidden';
  }

  if (content.start_at && new Date(content.start_at) > now) {
    return 'scheduled';
  }

  if (content.end_at && new Date(content.end_at) < now) {
    return 'expired';
  }

  return 'active';
}

export function isVisibleWindowContent(content: WindowedContent, now = new Date()): boolean {
  return getWindowStatus(content, now) === 'active';
}

export function isUpcomingEvent(eventDate: string, now = new Date()): boolean {
  return parseDateOnly(eventDate) >= getStartOfLocalDay(now);
}

export function getEventStatus(event: EventContent, now = new Date()): EventStatus {
  if (!event.is_published) {
    return 'hidden';
  }

  return isUpcomingEvent(event.event_date, now) ? 'active' : 'past';
}

export function getAdminStatusBadge(status: AdminStatus) {
  return adminStatusBadges[status];
}

export function toLocalDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return normalizeDateOnly(value);
}

export function fromLocalDateInputValue(value: string): string | null {
  if (!value) {
    return null;
  }

  return normalizeDateOnly(value);
}

export function toLocalDateTimeInputValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

export function fromLocalDateTimeInputValue(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
