import { useEffect, useState } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockAnnouncements, mockEvents, mockHighlights, mockQrLinks, mockSettings } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Calendar, MapPin, Info } from 'lucide-react';
import { DISPLAY_SETTINGS_ID } from '../../lib/display-settings';
import { isUpcomingEvent, isVisibleWindowContent, parseDateOnly } from '../../lib/content-visibility';

type Announcement = Tables<'announcements'>;
type Event = Tables<'events'>;
type Highlight = Tables<'highlights'>;
type QrLink = Tables<'qr_links'>;
type Settings = Tables<'display_settings'>;

type ContentItem =
  | { type: 'announcement'; data: Announcement }
  | { type: 'event'; data: Event }
  | { type: 'highlight'; data: Highlight };

export function Display() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [settings, setSettings] = useState<Settings | null>(null);
  const [qrLinks, setQrLinks] = useState<QrLink[]>([]);
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [brokenHighlightImages, setBrokenHighlightImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void fetchData();
    const pollTimer = setInterval(() => {
      void fetchData();
    }, 5 * 60 * 1000);

    return () => clearInterval(pollTimer);
  }, []);

  useEffect(() => {
    if (contentQueue.length <= 1 || !settings) {
      return;
    }

    const interval = (settings.rotation_interval_seconds || 15) * 1000;
    const rotationTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % contentQueue.length);
    }, interval);

    return () => clearInterval(rotationTimer);
  }, [contentQueue.length, settings?.rotation_interval_seconds]);

  async function fetchData() {
    if (isMockSupabase) {
      setSettings(mockSettings);
      setQrLinks(mockQrLinks.filter((item) => isVisibleWindowContent(item)));

      const queue: ContentItem[] = [];
      if (mockSettings.show_highlights) {
        mockHighlights
          .filter((item) => isVisibleWindowContent(item))
          .forEach((item) => queue.push({ type: 'highlight', data: item }));
      }
      if (mockSettings.show_announcements) {
        mockAnnouncements
          .filter((item) => isVisibleWindowContent(item))
          .forEach((item) => queue.push({ type: 'announcement', data: item }));
      }
      if (mockSettings.show_events) {
        mockEvents
          .filter((item) => item.is_published && isUpcomingEvent(item.event_date))
          .forEach((item) => queue.push({ type: 'event', data: item }));
      }

      setContentQueue(queue);
      setCurrentIndex((prev) => (queue.length === 0 ? 0 : prev % queue.length));
      setLoading(false);
      return;
    }

    try {
      const [settingsRes, qrRes, annRes, evRes, highRes] = await Promise.all([
        supabase.from('display_settings').select('*').eq('id', DISPLAY_SETTINGS_ID).maybeSingle(),
        supabase.from('qr_links').select('*').eq('is_published', true).order('sort_order'),
        supabase.from('announcements').select('*').eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('events').select('*').eq('is_published', true).order('event_date'),
        supabase.from('highlights').select('*').eq('is_published', true).order('sort_order'),
      ]);

      const currentSettings = settingsRes.data || mockSettings;
      setSettings(currentSettings);
      setQrLinks((qrRes.data || []).filter((item) => isVisibleWindowContent(item)));

      const queue: ContentItem[] = [];
      if (currentSettings.show_highlights) {
        (highRes.data || [])
          .filter((item) => isVisibleWindowContent(item))
          .forEach((item) => queue.push({ type: 'highlight', data: item }));
      }
      if (currentSettings.show_announcements) {
        (annRes.data || [])
          .filter((item) => isVisibleWindowContent(item))
          .forEach((item) => queue.push({ type: 'announcement', data: item }));
      }
      if (currentSettings.show_events) {
        (evRes.data || [])
          .filter((item) => item.is_published && isUpcomingEvent(item.event_date))
          .forEach((item) => queue.push({ type: 'event', data: item }));
      }

      setContentQueue(queue);
      setCurrentIndex((prev) => (queue.length === 0 ? 0 : prev % queue.length));
    } catch (error) {
      console.error('Error fetching display data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400">
        <p className="text-2xl">Ladataan InfoTV...</p>
      </div>
    );
  }

  const currentContent = contentQueue[currentIndex] || contentQueue[0];
  const highlightImageKey =
    currentContent?.type === 'highlight' ? `${currentContent.data.id}:${currentContent.data.image_url || 'empty'}` : null;
  const isHighlightImageBroken = highlightImageKey ? brokenHighlightImages[highlightImageKey] : false;
  const showHighlightImage =
    currentContent?.type === 'highlight' &&
    Boolean(currentContent.data.image_url) &&
    Boolean(highlightImageKey) &&
    !isHighlightImageBroken;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-50 selection:bg-slate-800">
      <main className="relative flex flex-1 flex-col">
        <header className="z-10 flex items-center justify-between px-12 py-8">
          <div className="flex items-center space-x-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-bold text-white"
              style={{ backgroundColor: settings.accent_color || '#0ea5e9' }}
            >
              {(settings.org_name || 'E').charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{settings.org_name || 'Eduro'}</h1>
              {settings.welcome_text && <p className="text-lg text-slate-400">{settings.welcome_text}</p>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold tracking-tighter">{format(currentTime, 'HH:mm')}</div>
            <div className="mt-1 text-xl capitalize text-slate-400">
              {format(currentTime, 'EEEE, d. MMMM yyyy', { locale: fi })}
            </div>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden px-12 pb-12">
          <AnimatePresence mode="wait">
            {contentQueue.length === 0 || !currentContent ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex h-full flex-col items-center justify-center space-y-6 text-center"
              >
                <Info className="h-24 w-24 text-slate-800" />
                <h2 className="max-w-3xl text-4xl font-medium leading-relaxed text-slate-500">
                  {settings.fallback_message || 'Ei uusia tiedotteita tällä hetkellä.'}
                </h2>
              </motion.div>
            ) : currentContent.type === 'highlight' ? (
              <motion.div
                key={`highlight-${currentContent.data.id}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex h-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
              >
                {showHighlightImage && (
                  <div className="relative w-1/2">
                    <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-900/20 to-slate-900/80" />
                    <img
                      src={currentContent.data.image_url || undefined}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => {
                        if (highlightImageKey) {
                          setBrokenHighlightImages((prev) => ({ ...prev, [highlightImageKey]: true }));
                        }
                      }}
                    />
                  </div>
                )}
                <div
                  className={`flex flex-col justify-center p-16 ${
                    showHighlightImage ? 'w-1/2' : 'w-full items-center text-center'
                  }`}
                >
                  {currentContent.data.subtitle && (
                    <span
                      className="mb-4 text-xl font-semibold uppercase tracking-wider"
                      style={{ color: settings.accent_color || '#0ea5e9' }}
                    >
                      {currentContent.data.subtitle}
                    </span>
                  )}
                  <h2 className="mb-8 text-6xl font-bold leading-tight">{currentContent.data.title}</h2>
                  {currentContent.data.body && (
                    <p className="max-w-3xl text-2xl leading-relaxed text-slate-300">{currentContent.data.body}</p>
                  )}
                  {currentContent.data.cta_label && (
                    <div
                      className="mt-12 inline-flex items-center rounded-full px-8 py-4 text-xl font-semibold"
                      style={{ backgroundColor: settings.accent_color || '#0ea5e9', color: '#fff' }}
                    >
                      {currentContent.data.cta_label}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : currentContent.type === 'announcement' ? (
              <motion.div
                key={`announcement-${currentContent.data.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex h-full flex-col justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-16"
              >
                {currentContent.data.priority === 'high' && <div className="absolute left-0 top-0 h-2 w-full bg-red-500" />}
                <div className="mb-8 flex items-center space-x-4">
                  <div className="rounded-full bg-slate-800 p-4">
                    <Info className="h-10 w-10 text-slate-300" />
                  </div>
                  <span className="text-2xl font-medium uppercase tracking-wide text-slate-400">Tiedote</span>
                </div>
                <h2 className="mb-10 text-6xl font-bold leading-tight text-slate-50">{currentContent.data.title}</h2>
                <p className="max-w-5xl whitespace-pre-wrap text-3xl leading-relaxed text-slate-300">
                  {currentContent.data.body}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`event-${currentContent.data.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex h-full flex-col justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-16"
              >
                <div className="absolute left-0 top-0 h-2 w-full" style={{ backgroundColor: settings.accent_color || '#0ea5e9' }} />
                <div className="mb-8 flex items-center space-x-4">
                  <div className="rounded-full bg-slate-800 p-4">
                    <Calendar className="h-10 w-10 text-slate-300" />
                  </div>
                  <span className="text-2xl font-medium uppercase tracking-wide text-slate-400">Tuleva tapahtuma</span>
                </div>
                <h2 className="mb-12 text-6xl font-bold leading-tight text-slate-50">{currentContent.data.title}</h2>

                <div className="mb-12 grid grid-cols-2 gap-12">
                  <div className="flex items-center space-x-6 rounded-2xl border border-slate-800/50 bg-slate-950/50 p-8">
                    <Clock className="h-12 w-12" style={{ color: settings.accent_color || '#0ea5e9' }} />
                    <div>
                      <div className="mb-1 text-xl text-slate-400">Aika</div>
                      <div className="text-3xl font-semibold">
                        {format(parseDateOnly(currentContent.data.event_date), 'd.M.yyyy')}
                        {(currentContent.data.start_time || currentContent.data.end_time) && (
                          <span className="ml-4 text-slate-300">
                            klo {currentContent.data.start_time}
                            {currentContent.data.end_time ? ` - ${currentContent.data.end_time}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {currentContent.data.location && (
                    <div className="flex items-center space-x-6 rounded-2xl border border-slate-800/50 bg-slate-950/50 p-8">
                      <MapPin className="h-12 w-12" style={{ color: settings.accent_color || '#0ea5e9' }} />
                      <div>
                        <div className="mb-1 text-xl text-slate-400">Paikka</div>
                        <div className="text-3xl font-semibold">{currentContent.data.location}</div>
                      </div>
                    </div>
                  )}
                </div>

                {currentContent.data.description && (
                  <p className="max-w-4xl text-3xl leading-relaxed text-slate-300">{currentContent.data.description}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {contentQueue.length > 1 && (
            <div className="absolute bottom-12 left-12 right-12 h-1 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                key={`progress-${currentIndex}`}
                className="h-full"
                style={{ backgroundColor: settings.accent_color || '#0ea5e9' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: settings.rotation_interval_seconds || 15, ease: 'linear' }}
              />
            </div>
          )}
        </div>
      </main>

      {(settings.show_qr_links || settings.show_opening_hours) && (
        <aside className="z-20 flex w-96 flex-col border-l border-slate-800 bg-slate-900">
          <div className="flex flex-1 flex-col gap-12 overflow-y-auto p-10">
            {settings.show_opening_hours && settings.opening_hours_text && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold uppercase tracking-wide text-slate-400">Aukioloajat</h3>
                <div className="whitespace-pre-wrap text-2xl font-medium text-slate-200">{settings.opening_hours_text}</div>
              </div>
            )}

            {settings.show_qr_links && qrLinks.length > 0 && (
              <div className="space-y-8">
                <h3 className="text-xl font-semibold uppercase tracking-wide text-slate-400">Pikalinkit</h3>
                <div className="space-y-8">
                  {qrLinks.map((link) => (
                    <div key={link.id} className="flex flex-col space-y-4 rounded-2xl border border-slate-800/50 bg-slate-950/50 p-6">
                      <div className="self-start rounded-xl bg-white p-4">
                        <QRCodeSVG value={link.url} size={120} />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-slate-200">{link.title}</h4>
                        {link.description && <p className="mt-1 text-slate-400">{link.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
