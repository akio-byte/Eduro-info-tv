import { useEffect, useRef, useState } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockAnnouncements, mockEvents, mockHighlights, mockQrLinks, mockSettings } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Calendar, MapPin, Info, Pin } from 'lucide-react';
import eduroLogo from '../../assets/branding/eduro/211119_Eduro_logo_sininen_RGB.jpg';

type Announcement = Tables<'announcements'>;
type Event = Tables<'events'>;
type Highlight = Tables<'highlights'>;
type QrLink = Tables<'qr_links'>;
type Settings = Tables<'display_settings'>;

type RssItem = {
  title: string;
  description: string;
  source: string;
  pubDate: string | null;
};

type ContentItem =
  | { type: 'hero' }
  | { type: 'announcement'; data: Announcement }
  | { type: 'event'; data: Event }
  | { type: 'highlight'; data: Highlight }
  | { type: 'rss'; data: RssItem };

function normalizeAccentColor(value: string | null | undefined) {
  if (!value) return '#0ea5e9';
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value) ? value : '#0ea5e9';
}

function isVisibleWindowContent(
  item: { is_published: boolean; start_at: string | null; end_at: string | null },
  now: Date,
) {
  if (!item.is_published) return false;
  if (item.start_at && new Date(item.start_at) > now) return false;
  if (item.end_at && new Date(item.end_at) < now) return false;
  return true;
}

function parseEventDate(value: string) {
  if (value.includes('T')) return new Date(value);
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isUpcomingEvent(eventDate: string, now: Date) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return parseEventDate(eventDate) >= startOfToday;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function HighlightMedia({ highlight }: { highlight: Highlight }) {
  const [imgError, setImgError] = useState(false);

  if (highlight.video_url) {
    return (
      <div className="relative w-1/2 flex-shrink-0 overflow-hidden">
        <video
          src={highlight.video_url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-900/10 to-slate-900/60" />
      </div>
    );
  }

  if (highlight.image_url && !imgError) {
    return (
      <div className="relative w-1/2 flex-shrink-0">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-900/20 to-slate-900/70" />
        <img
          src={highlight.image_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return null;
}

function HeroSlide({ settings, accentColor }: { settings: Settings; accentColor: string }) {
  return (
    <motion.div
      key="hero"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 px-16 text-center"
    >
      <div
        className="mb-8 h-2 w-24 rounded-full"
        style={{ backgroundColor: accentColor }}
      />
      <h1 className="mb-6 text-8xl font-bold tracking-tight text-slate-50">
        {settings.org_name || 'Eduro'}
      </h1>
      {settings.welcome_text && (
        <p className="mb-4 text-4xl font-medium text-slate-300">{settings.welcome_text}</p>
      )}
      {settings.hero_subtitle && (
        <p className="text-2xl text-slate-500">{settings.hero_subtitle}</p>
      )}
    </motion.div>
  );
}

function AnnouncementSlide({
  announcement,
  accentColor,
}: {
  announcement: Announcement;
  accentColor: string;
}) {
  return (
    <motion.div
      key={`announcement-${announcement.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full flex-col justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 px-16 py-12"
    >
      {announcement.priority === 'high' ? (
        <div className="absolute left-0 top-0 h-2 w-full bg-red-500" />
      ) : (
        <div className="absolute left-0 top-0 h-2 w-full" style={{ backgroundColor: accentColor }} />
      )}
      <div className="mb-8 flex items-center space-x-4">
        <div className="rounded-full bg-slate-800 p-4">
          <Info className="h-10 w-10 text-slate-300" />
        </div>
        <span className="text-2xl font-semibold uppercase tracking-widest text-slate-500">
          Tiedote
        </span>
      </div>
      <h2 className="mb-8 text-6xl font-bold leading-tight text-slate-50">{announcement.title}</h2>
      <p className="max-w-5xl whitespace-pre-wrap text-3xl leading-relaxed text-slate-300">
        {announcement.body}
      </p>
    </motion.div>
  );
}

function EventSlide({ event, accentColor }: { event: Event; accentColor: string }) {
  return (
    <motion.div
      key={`event-${event.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full flex-col justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 px-16 py-12"
    >
      <div className="absolute left-0 top-0 h-2 w-full" style={{ backgroundColor: accentColor }} />
      <div className="mb-8 flex items-center space-x-4">
        <div className="rounded-full bg-slate-800 p-4">
          <Calendar className="h-10 w-10 text-slate-300" />
        </div>
        <span className="text-2xl font-semibold uppercase tracking-widest text-slate-500">
          Tuleva tapahtuma
        </span>
      </div>
      <h2 className="mb-10 text-6xl font-bold leading-tight text-slate-50">{event.title}</h2>

      <div className="mb-10 flex flex-wrap gap-6">
        <div className="flex items-center space-x-4 rounded-2xl border border-slate-800/50 bg-slate-950/50 px-8 py-5">
          <Clock className="h-10 w-10 flex-shrink-0" style={{ color: accentColor }} />
          <div>
            <div className="text-lg text-slate-400">Aika</div>
            <div className="text-3xl font-semibold text-slate-100">
              {format(parseEventDate(event.event_date), 'd.M.yyyy')}
              {(event.start_time || event.end_time) && (
                <span className="ml-3 text-slate-300">
                  klo {event.start_time}
                  {event.end_time ? `–${event.end_time}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {event.location && (
          <div className="flex items-center space-x-4 rounded-2xl border border-slate-800/50 bg-slate-950/50 px-8 py-5">
            <MapPin className="h-10 w-10 flex-shrink-0" style={{ color: accentColor }} />
            <div>
              <div className="text-lg text-slate-400">Paikka</div>
              <div className="text-3xl font-semibold text-slate-100">{event.location}</div>
            </div>
          </div>
        )}
      </div>

      {event.description && (
        <p className="max-w-4xl text-3xl leading-relaxed text-slate-300">{event.description}</p>
      )}
    </motion.div>
  );
}

function HighlightSlide({
  highlight,
  accentColor,
}: {
  highlight: Highlight;
  accentColor: string;
}) {
  const hasMedia = !!(highlight.image_url || highlight.video_url);
  return (
    <motion.div
      key={`highlight-${highlight.id}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
    >
      <HighlightMedia highlight={highlight} />
      <div
        className={`flex flex-col justify-center px-16 py-12 ${hasMedia ? 'w-1/2' : 'w-full items-center text-center'}`}
      >
        {highlight.subtitle && (
          <span
            className="mb-4 text-xl font-semibold uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            {highlight.subtitle}
          </span>
        )}
        <h2 className="mb-8 text-6xl font-bold leading-tight text-slate-50">{highlight.title}</h2>
        {highlight.body && (
          <p className="max-w-3xl text-2xl leading-relaxed text-slate-300">{highlight.body}</p>
        )}
        {highlight.cta_label && (
          <div
            className="mt-10 inline-flex items-center self-start rounded-full px-8 py-4 text-xl font-semibold"
            style={{ backgroundColor: accentColor, color: '#fff' }}
          >
            {highlight.cta_label}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptySlide({ message }: { message: string }) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full flex-col items-center justify-center space-y-6 text-center"
    >
      <Info className="h-20 w-20 text-slate-800" />
      <h2 className="max-w-3xl text-4xl font-medium leading-relaxed text-slate-500">{message}</h2>
    </motion.div>
  );
}

function RssSlide({ item, accentColor }: { item: RssItem; accentColor: string }) {
  return (
    <motion.div
      key={`rss-${item.title}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full flex-col justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 px-16 py-12"
    >
      <div className="absolute left-0 top-0 h-2 w-full" style={{ backgroundColor: accentColor }} />
      <div className="mb-6 flex items-center space-x-3">
        <span className="text-xl font-semibold uppercase tracking-widest text-slate-500">
          {item.source}
        </span>
        {item.pubDate && (
          <span className="text-lg text-slate-600">· {item.pubDate}</span>
        )}
      </div>
      <h2 className="mb-8 text-5xl font-bold leading-tight text-slate-50">{item.title}</h2>
      {item.description && (
        <p className="max-w-5xl text-2xl leading-relaxed text-slate-300">{item.description}</p>
      )}
    </motion.div>
  );
}

async function fetchRssItems(url: string, maxItems: number): Promise<RssItem[]> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return [];
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) return [];

    const channelTitle =
      doc.querySelector('channel > title')?.textContent?.trim() ?? new URL(url).hostname;
    const items = Array.from(doc.querySelectorAll('item')).slice(0, maxItems);

    return items.map((item) => {
      const rawDesc =
        item.querySelector('description')?.textContent?.trim() ?? '';
      // Strip HTML tags from description
      const descEl = document.createElement('div');
      descEl.innerHTML = rawDesc;
      const description = (descEl.textContent ?? '').slice(0, 200).trim();

      const pubDateRaw = item.querySelector('pubDate')?.textContent?.trim() ?? null;
      let pubDate: string | null = null;
      if (pubDateRaw) {
        try {
          pubDate = new Date(pubDateRaw).toLocaleDateString('fi-FI', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
          });
        } catch {
          pubDate = null;
        }
      }

      return {
        title: item.querySelector('title')?.textContent?.trim() ?? '',
        description,
        source: channelTitle,
        pubDate,
      };
    }).filter((i) => i.title.length > 0);
  } catch {
    return [];
  }
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({
  settings,
  qrLinks,
  pinnedAnnouncement,
  accentColor,
}: {
  settings: Settings;
  qrLinks: QrLink[];
  pinnedAnnouncement: Announcement | null;
  accentColor: string;
}) {
  const showSidebar =
    settings.show_opening_hours || settings.show_qr_links || pinnedAnnouncement !== null;

  if (!showSidebar) return null;

  return (
    <aside className="z-20 flex w-80 flex-shrink-0 flex-col border-l border-slate-800 bg-slate-900/60">
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-8">
        {/* Kiinnitetty tiedote */}
        {pinnedAnnouncement && (
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: accentColor + '40', backgroundColor: accentColor + '12' }}
          >
            <div className="mb-3 flex items-center space-x-2">
              <Pin className="h-4 w-4" style={{ color: accentColor }} />
              <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
                Tärkeää
              </span>
            </div>
            <p className="text-lg font-semibold leading-snug text-slate-100">
              {pinnedAnnouncement.title}
            </p>
            {pinnedAnnouncement.body && (
              <p className="mt-2 text-base leading-relaxed text-slate-400">
                {pinnedAnnouncement.body}
              </p>
            )}
          </div>
        )}

        {/* Aukioloajat */}
        {settings.show_opening_hours && (
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
              Aukioloajat
            </h3>
            <div className="space-y-2">
              {settings.opening_hours_mon_fri ? (
                <>
                  <div className="flex justify-between text-lg text-slate-300">
                    <span className="text-slate-500">Ma–Pe</span>
                    <span className="font-medium">
                      {settings.opening_hours_mon_fri.replace(/^Ma.Pe\s*/i, '').trim() ||
                        settings.opening_hours_mon_fri}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg text-slate-300">
                    <span className="text-slate-500">La</span>
                    <span className="font-medium">
                      {settings.opening_hours_sat?.replace(/^La\s*/i, '').trim() ||
                        settings.opening_hours_sat ||
                        'suljettu'}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg text-slate-300">
                    <span className="text-slate-500">Su</span>
                    <span className="font-medium">
                      {settings.opening_hours_sun?.replace(/^Su\s*/i, '').trim() ||
                        settings.opening_hours_sun ||
                        'suljettu'}
                    </span>
                  </div>
                </>
              ) : settings.opening_hours_text ? (
                <div className="whitespace-pre-wrap text-lg font-medium text-slate-300">
                  {settings.opening_hours_text}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Divider */}
        {settings.show_opening_hours && settings.show_qr_links && qrLinks.length > 0 && (
          <div className="h-px bg-slate-800" />
        )}

        {/* QR-linkit */}
        {settings.show_qr_links && qrLinks.length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
              Pikalinkit
            </h3>
            <div className="space-y-6">
              {qrLinks.map((link) => (
                <div key={link.id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 rounded-xl bg-white p-2">
                    <QRCodeSVG value={link.url} size={80} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold leading-snug text-slate-200">
                      {link.title}
                    </p>
                    {link.description && (
                      <p className="mt-1 text-sm text-slate-500">{link.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Main Display ─────────────────────────────────────────────────────────────

export function Display() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [settings, setSettings] = useState<Settings | null>(null);
  const [qrLinks, setQrLinks] = useState<QrLink[]>([]);
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([]);
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState<Announcement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetchedOnce = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void fetchData();
    const pollTimer = setInterval(() => void fetchData(), 5 * 60 * 1000);
    return () => clearInterval(pollTimer);
  }, []);

  useEffect(() => {
    if (contentQueue.length <= 1 || !settings) return;
    const interval = (settings.rotation_interval_seconds || 15) * 1000;
    const rotationTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % contentQueue.length);
    }, interval);
    return () => clearInterval(rotationTimer);
  }, [contentQueue.length, settings?.rotation_interval_seconds]);

  async function fetchData() {
    if (isMockSupabase) {
      const now = new Date();
      setSettings(mockSettings);
      setQrLinks(mockQrLinks.filter((item) => isVisibleWindowContent(item, now)));

      const visibleAnnouncements = mockAnnouncements.filter((item) =>
        isVisibleWindowContent(item, now),
      );
      const pinned = visibleAnnouncements.find((a) => a.is_pinned) ?? null;
      setPinnedAnnouncement(pinned);

      const rssItems =
        mockSettings.show_rss && mockSettings.rss_feed_url
          ? await fetchRssItems(mockSettings.rss_feed_url, mockSettings.rss_max_items || 3)
          : [];

      const queue = buildQueue(mockSettings, visibleAnnouncements, mockEvents, mockHighlights, rssItems, now);
      applyQueue(queue);
      setLoading(false);
      return;
    }

    try {
      const [settingsRes, qrRes, annRes, evRes, highRes] = await Promise.allSettled([
        supabase.from('display_settings').select('*').limit(1).maybeSingle(),
        supabase.from('qr_links').select('*').eq('is_published', true).order('sort_order'),
        supabase
          .from('announcements')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false }),
        supabase.from('events').select('*').eq('is_published', true).order('event_date'),
        supabase.from('highlights').select('*').eq('is_published', true).order('sort_order'),
      ]);

      const read = <T,>(
        label: string,
        result: PromiseSettledResult<{ data: T | null; error: unknown }>,
        fallback: T,
      ): T => {
        if (result.status === 'rejected') {
          console.error(`Display query failed: ${label}`, result.reason);
          return fallback;
        }
        if (result.value.error) {
          console.error(`Display query error: ${label}`, result.value.error);
          return fallback;
        }
        return result.value.data ?? fallback;
      };

      const now = new Date();
      const currentSettings = read('display_settings', settingsRes, mockSettings);
      const qrItems = read('qr_links', qrRes, [] as QrLink[]);
      const announcementItems = read('announcements', annRes, [] as Announcement[]);
      const eventItems = read('events', evRes, [] as Event[]);
      const highlightItems = read('highlights', highRes, [] as Highlight[]);

      setSettings(currentSettings);
      setQrLinks(qrItems.filter((item) => isVisibleWindowContent(item, now)));

      const visibleAnnouncements = announcementItems.filter((item) =>
        isVisibleWindowContent(item, now),
      );
      const pinned = visibleAnnouncements.find((a) => a.is_pinned) ?? null;
      setPinnedAnnouncement(pinned);

      const rssItems =
        currentSettings.show_rss && currentSettings.rss_feed_url
          ? await fetchRssItems(currentSettings.rss_feed_url, currentSettings.rss_max_items || 3)
          : [];

      const queue = buildQueue(currentSettings, visibleAnnouncements, eventItems, highlightItems, rssItems, now);
      applyQueue(queue);
    } catch (error) {
      console.error('Error fetching display data:', error);
      setSettings(mockSettings);
      setQrLinks([]);
      setContentQueue([{ type: 'hero' }]);
      setPinnedAnnouncement(null);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  }

  function buildQueue(
    s: Settings,
    announcements: Announcement[],
    events: Event[],
    highlights: Highlight[],
    rssItems: RssItem[],
    now: Date,
  ): ContentItem[] {
    const queue: ContentItem[] = [{ type: 'hero' }];

    if (s.show_highlights) {
      highlights
        .filter((item) => isVisibleWindowContent(item, now))
        .forEach((item) => queue.push({ type: 'highlight', data: item }));
    }
    if (s.show_announcements) {
      // Non-pinned announcements rotate; pinned stays in sidebar
      announcements
        .filter((a) => !a.is_pinned)
        .forEach((item) => queue.push({ type: 'announcement', data: item }));
    }
    if (s.show_events) {
      events
        .filter((item) => item.is_published && isUpcomingEvent(item.event_date, now))
        .forEach((item) => queue.push({ type: 'event', data: item }));
    }
    if (s.show_rss && rssItems.length > 0) {
      rssItems.forEach((item) => queue.push({ type: 'rss', data: item }));
    }

    return queue;
  }

  function applyQueue(queue: ContentItem[]) {
    setContentQueue(queue);
    if (!fetchedOnce.current) {
      setCurrentIndex(0);
      fetchedOnce.current = true;
    } else {
      setCurrentIndex((prev) => (queue.length === 0 ? 0 : prev % queue.length));
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading || !settings) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400">
        <p className="text-2xl">Ladataan InfoTV...</p>
      </div>
    );
  }

  const currentContent = contentQueue[currentIndex] ?? contentQueue[0];
  const accentColor = normalizeAccentColor(settings.accent_color);
  const rotationSeconds = settings.rotation_interval_seconds || 15;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 font-sans text-slate-50 selection:bg-slate-800">
      {/* ── Pysyvä header ── */}
      <header className="z-30 flex flex-shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-10 py-4 backdrop-blur-sm">
        <div className="flex items-center space-x-5">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
            <img
              src={eduroLogo}
              alt="Eduro"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">
              {settings.org_name || 'Eduro'}
            </h1>
            {settings.welcome_text && (
              <p className="text-sm text-slate-500">{settings.welcome_text}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold tabular-nums tracking-tighter text-slate-50">
            {format(currentTime, 'HH:mm')}
          </div>
          <div className="mt-0.5 text-base capitalize text-slate-500">
            {format(currentTime, 'EEEE d. MMMM yyyy', { locale: fi })}
          </div>
        </div>
      </header>

      {/* ── Sisältöalue + sivupalkki ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Pääsisältöalue */}
        <main className="relative flex flex-1 flex-col overflow-hidden p-8">
          <AnimatePresence mode="wait">
            {contentQueue.length === 0 || !currentContent ? (
              <EmptySlide
                message={settings.fallback_message || 'Ei uusia tiedotteita tällä hetkellä.'}
              />
            ) : currentContent.type === 'hero' ? (
              <HeroSlide settings={settings} accentColor={accentColor} />
            ) : currentContent.type === 'highlight' ? (
              <HighlightSlide highlight={currentContent.data} accentColor={accentColor} />
            ) : currentContent.type === 'announcement' ? (
              <AnnouncementSlide announcement={currentContent.data} accentColor={accentColor} />
            ) : currentContent.type === 'event' ? (
              <EventSlide event={currentContent.data} accentColor={accentColor} />
            ) : currentContent.type === 'rss' ? (
              <RssSlide item={currentContent.data} accentColor={accentColor} />
            ) : null}
          </AnimatePresence>

          {/* Rotaatiopalkki */}
          {contentQueue.length > 1 && (
            <div className="absolute bottom-8 left-8 right-8 h-1 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                key={`progress-${currentIndex}`}
                className="h-full rounded-full"
                style={{ backgroundColor: accentColor }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: rotationSeconds, ease: 'linear' }}
              />
            </div>
          )}
        </main>

        {/* Sivupalkki */}
        <Sidebar
          settings={settings}
          qrLinks={qrLinks}
          pinnedAnnouncement={pinnedAnnouncement}
          accentColor={accentColor}
        />
      </div>
    </div>
  );
}
