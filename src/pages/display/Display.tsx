import { useState, useEffect } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockAnnouncements, mockEvents, mockHighlights, mockQrLinks, mockSettings } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Calendar, MapPin, Info } from 'lucide-react';

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

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data initially and set up polling
  useEffect(() => {
    fetchData();
    // Poll for new data every 5 minutes
    const pollTimer = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(pollTimer);
  }, []);

  // Handle content rotation
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
      setSettings(mockSettings);
      setQrLinks(mockQrLinks.filter(q => q.is_published));
      
      const queue: ContentItem[] = [];
      if (mockSettings.show_highlights) {
        mockHighlights.filter(h => h.is_published).forEach(h => queue.push({ type: 'highlight', data: h }));
      }
      if (mockSettings.show_announcements) {
        mockAnnouncements.filter(a => a.is_published).forEach(a => queue.push({ type: 'announcement', data: a }));
      }
      if (mockSettings.show_events) {
        mockEvents.filter(e => e.is_published).forEach(e => queue.push({ type: 'event', data: e }));
      }
      
      setContentQueue(queue);
      setLoading(false);
      return;
    }

    try {
      const [settingsRes, qrRes, annRes, evRes, highRes] = await Promise.all([
        supabase.from('display_settings').select('*').limit(1).single(),
        supabase.from('qr_links').select('*').eq('is_published', true).order('sort_order'),
        supabase.from('announcements').select('*').eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('events').select('*').eq('is_published', true).gte('event_date', new Date().toISOString().split('T')[0]).order('event_date'),
        supabase.from('highlights').select('*').eq('is_published', true).order('sort_order'),
      ]);

      const currentSettings = settingsRes.data || mockSettings;
      setSettings(currentSettings);
      setQrLinks(qrRes.data || []);

      const queue: ContentItem[] = [];
      if (currentSettings.show_highlights && highRes.data) {
        highRes.data.forEach(h => queue.push({ type: 'highlight', data: h }));
      }
      if (currentSettings.show_announcements && annRes.data) {
        annRes.data.forEach(a => queue.push({ type: 'announcement', data: a }));
      }
      if (currentSettings.show_events && evRes.data) {
        evRes.data.forEach(e => queue.push({ type: 'event', data: e }));
      }

      setContentQueue(queue);
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

  const currentContent = contentQueue[currentIndex];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-50 font-sans selection:bg-slate-800">
      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-12 py-8 z-10">
          <div className="flex items-center space-x-4">
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: settings.accent_color || '#0ea5e9' }}
            >
              {(settings.org_name || 'E').charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{settings.org_name || 'Eduro'}</h1>
              {settings.welcome_text && (
                <p className="text-lg text-slate-400">{settings.welcome_text}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold tracking-tighter">
              {format(currentTime, 'HH:mm')}
            </div>
            <div className="text-xl text-slate-400 mt-1 capitalize">
              {format(currentTime, 'EEEE, d. MMMM yyyy', { locale: fi })}
            </div>
          </div>
        </header>

        {/* Content Rotation Area */}
        <div className="flex-1 relative overflow-hidden px-12 pb-12">
          <AnimatePresence mode="wait">
            {contentQueue.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex h-full flex-col items-center justify-center text-center space-y-6"
              >
                <Info className="h-24 w-24 text-slate-800" />
                <h2 className="text-4xl font-medium text-slate-500 max-w-3xl leading-relaxed">
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
                className="flex h-full overflow-hidden rounded-3xl bg-slate-900 border border-slate-800"
              >
                {currentContent.data.image_url && (
                  <div className="w-1/2 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 to-slate-900/80 z-10" />
                    <img 
                      src={currentContent.data.image_url} 
                      alt="" 
                      className="absolute inset-0 h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className={`flex flex-col justify-center p-16 ${currentContent.data.image_url ? 'w-1/2' : 'w-full items-center text-center'}`}>
                  {currentContent.data.subtitle && (
                    <span 
                      className="text-xl font-semibold tracking-wider uppercase mb-4"
                      style={{ color: settings.accent_color || '#0ea5e9' }}
                    >
                      {currentContent.data.subtitle}
                    </span>
                  )}
                  <h2 className="text-6xl font-bold leading-tight mb-8">
                    {currentContent.data.title}
                  </h2>
                  {currentContent.data.body && (
                    <p className="text-2xl text-slate-300 leading-relaxed max-w-3xl">
                      {currentContent.data.body}
                    </p>
                  )}
                  {currentContent.data.cta_label && (
                    <div className="mt-12 inline-flex items-center rounded-full px-8 py-4 text-xl font-semibold" style={{ backgroundColor: settings.accent_color || '#0ea5e9', color: '#fff' }}>
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
                className="flex h-full flex-col justify-center p-16 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden"
              >
                {currentContent.data.priority === 'high' && (
                  <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                )}
                <div className="flex items-center space-x-4 mb-8">
                  <div className="rounded-full bg-slate-800 p-4">
                    <Info className="h-10 w-10 text-slate-300" />
                  </div>
                  <span className="text-2xl font-medium text-slate-400 tracking-wide uppercase">
                    Tiedote
                  </span>
                </div>
                <h2 className="text-6xl font-bold leading-tight mb-10 text-slate-50">
                  {currentContent.data.title}
                </h2>
                <p className="text-3xl text-slate-300 leading-relaxed max-w-5xl whitespace-pre-wrap">
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
                className="flex h-full flex-col justify-center p-16 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: settings.accent_color || '#0ea5e9' }} />
                <div className="flex items-center space-x-4 mb-8">
                  <div className="rounded-full bg-slate-800 p-4">
                    <Calendar className="h-10 w-10 text-slate-300" />
                  </div>
                  <span className="text-2xl font-medium text-slate-400 tracking-wide uppercase">
                    Tuleva tapahtuma
                  </span>
                </div>
                <h2 className="text-6xl font-bold leading-tight mb-12 text-slate-50">
                  {currentContent.data.title}
                </h2>
                
                <div className="grid grid-cols-2 gap-12 mb-12">
                  <div className="flex items-center space-x-6 bg-slate-950/50 p-8 rounded-2xl border border-slate-800/50">
                    <Clock className="h-12 w-12" style={{ color: settings.accent_color || '#0ea5e9' }} />
                    <div>
                      <div className="text-xl text-slate-400 mb-1">Aika</div>
                      <div className="text-3xl font-semibold">
                        {format(new Date(currentContent.data.event_date), 'd.M.yyyy')}
                        {(currentContent.data.start_time || currentContent.data.end_time) && (
                          <span className="ml-4 text-slate-300">
                            klo {currentContent.data.start_time} {currentContent.data.end_time ? `- ${currentContent.data.end_time}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {currentContent.data.location && (
                    <div className="flex items-center space-x-6 bg-slate-950/50 p-8 rounded-2xl border border-slate-800/50">
                      <MapPin className="h-12 w-12" style={{ color: settings.accent_color || '#0ea5e9' }} />
                      <div>
                        <div className="text-xl text-slate-400 mb-1">Paikka</div>
                        <div className="text-3xl font-semibold">{currentContent.data.location}</div>
                      </div>
                    </div>
                  )}
                </div>

                {currentContent.data.description && (
                  <p className="text-3xl text-slate-300 leading-relaxed max-w-4xl">
                    {currentContent.data.description}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Progress Bar */}
          {contentQueue.length > 1 && (
            <div className="absolute bottom-12 left-12 right-12 h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                key={`progress-${currentIndex}`}
                className="h-full"
                style={{ backgroundColor: settings.accent_color || '#0ea5e9' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: settings.rotation_interval_seconds || 15, ease: "linear" }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Sidebar / Info Panel */}
      {(settings.show_qr_links || settings.show_opening_hours) && (
        <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-20">
          <div className="flex-1 p-10 flex flex-col gap-12 overflow-y-auto">
            
            {settings.show_opening_hours && settings.opening_hours_text && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold tracking-wide text-slate-400 uppercase">Aukioloajat</h3>
                <div className="text-2xl font-medium text-slate-200 whitespace-pre-wrap">
                  {settings.opening_hours_text}
                </div>
              </div>
            )}

            {settings.show_qr_links && qrLinks.length > 0 && (
              <div className="space-y-8">
                <h3 className="text-xl font-semibold tracking-wide text-slate-400 uppercase">Pikalinkit</h3>
                <div className="space-y-8">
                  {qrLinks.map((link) => (
                    <div key={link.id} className="flex flex-col space-y-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                      <div className="bg-white p-4 rounded-xl self-start">
                        <QRCodeSVG value={link.url} size={120} />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-slate-200">{link.title}</h4>
                        {link.description && (
                          <p className="text-slate-400 mt-1">{link.description}</p>
                        )}
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
