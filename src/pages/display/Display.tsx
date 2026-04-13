import { useState, useEffect } from 'react';
import { db, isMockFirebase } from '../../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, doc, Timestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';
import { mockSettings } from '../../lib/mock-data';
import type { ContentItem, DisplaySettings as Settings } from '../../types/firestore';
import { format, parseISO } from 'date-fns';
import { fi } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock as ClockIcon, Calendar, MapPin, Info, Megaphone, QrCode, Rss, Sun, Moon, Cloud, CloudSun, CloudMoon, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';
import { RssFeed } from '../../components/display/RssFeed';
import { useWeather, weatherCodeToIcon } from '../../hooks/useWeather';
import { Clock } from '../../components/display/Clock';
import { DEFAULT_SLIDE_DURATION_SECONDS } from '../../lib/constants';

export function Display() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const { data: weatherData } = useWeather(
    settings?.weather_lat || 66.5039, 
    settings?.weather_lon || 25.7294, 
    !!settings?.show_weather
  );

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data initially and set up real-time listeners
  useEffect(() => {
    if (isMockFirebase) {
      setSettings(mockSettings);
      
      const now = new Date();
      const mockItems: ContentItem[] = [
        {
          id: '1',
          org_id: 'default-org',
          type: 'announcement',
          title: 'Tervetuloa Eduroon!',
          body: 'Tämä on esimerkkitiedote, joka näkyy InfoTV-näytöllä.',
          media_url: null,
          media_type: 'none',
          event_date: null,
          start_time: null,
          end_time: null,
          location: null,
          qr_url: null,
          publish_start: null,
          publish_end: null,
          duration_seconds: DEFAULT_SLIDE_DURATION_SECONDS,
          is_published: true,
          is_archived: false,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'mock',
          updated_by: 'mock'
        },
        {
          id: '2',
          org_id: 'default-org',
          type: 'media',
          title: 'Päivän kuva',
          body: 'Tässä on hieno kuva Edurolta.',
          media_url: 'https://picsum.photos/seed/eduro/1920/1080',
          media_type: 'image',
          event_date: null,
          start_time: null,
          end_time: null,
          location: null,
          qr_url: null,
          publish_start: null,
          publish_end: null,
          duration_seconds: 10,
          is_published: true,
          is_archived: false,
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'mock',
          updated_by: 'mock'
        }
      ];
      
      setContentQueue(mockItems);
      setLoading(false);
      return;
    }

    // Real-time listeners for Firebase
    const unsubscribers: (() => void)[] = [];

    // Settings
    const settingsRef = doc(db, 'display_settings', 'default');
    const unsubSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        const d = doc.data();
        setSettings({
          id: doc.id,
          ...d,
          updated_at: d.updated_at instanceof Timestamp ? d.updated_at.toDate().toISOString() : d.updated_at,
        } as any as Settings);
      } else {
        setSettings(mockSettings as any);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'display_settings/default'));
    unsubscribers.push(unsubSettings);

    // Content Items
    const contentQuery = query(
      collection(db, 'content_items'), 
      where('is_published', '==', true), 
      where('is_archived', '==', false),
      orderBy('sort_order', 'asc'),
      orderBy('created_at', 'desc')
    );
    
    const unsubContent = onSnapshot(contentQuery, (snapshot) => {
      const now = new Date();
      const items = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          publish_start: d.publish_start instanceof Timestamp ? d.publish_start.toDate().toISOString() : d.publish_start,
          publish_end: d.publish_end instanceof Timestamp ? d.publish_end.toDate().toISOString() : d.publish_end,
          created_at: d.created_at instanceof Timestamp ? d.created_at.toDate().toISOString() : d.created_at,
          updated_at: d.updated_at instanceof Timestamp ? d.updated_at.toDate().toISOString() : d.updated_at,
        } as ContentItem;
      }).filter(item => {
        const startAt = item.publish_start ? new Date(item.publish_start as string) : null;
        const endAt = item.publish_end ? new Date(item.publish_end as string) : null;
        if (startAt && startAt > now) return false;
        if (endAt && endAt < now) return false;
        return true;
      });
      setContentQueue(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'content_items'));
    unsubscribers.push(unsubContent);

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  // Handle content rotation
  useEffect(() => {
    if (contentQueue.length <= 1) return;

    const currentItem = contentQueue[currentIndex];
    const duration = (currentItem?.duration_seconds || DEFAULT_SLIDE_DURATION_SECONDS) * 1000;
    
    const rotationTimer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % contentQueue.length);
    }, duration);

    return () => clearTimeout(rotationTimer);
  }, [currentIndex, contentQueue]);

  if (loading || !settings) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400">
        <p className="text-2xl animate-pulse">Ladataan InfoTV...</p>
      </div>
    );
  }

  const currentContent = contentQueue[currentIndex];

  const isLight = settings.theme === 'light';

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans selection:bg-slate-800 transition-colors duration-700 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-50'
    }`}>
      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-10 py-6 z-10">
          <div className="flex items-center space-x-6">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.org_name} className="h-14 w-auto max-w-[240px] object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div 
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-indigo-500/20"
                style={{ backgroundColor: settings.accent_color || '#4f46e5' }}
              >
                {(settings.org_name || 'E').charAt(0)}
              </div>
            )}
            <div>
              <h1 className={`text-4xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {settings.org_name || 'Eduro'}
              </h1>
              {settings.welcome_text && (
                <p className={`text-xl font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {settings.welcome_text}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-8">
            {settings.show_weather && weatherData && (() => {
              const { icon } = weatherCodeToIcon(weatherData.weatherCode, weatherData.isDay);
              const IconComponent = { Sun, Moon, Cloud, CloudSun, CloudMoon, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning }[icon as keyof typeof import('lucide-react')] || Cloud;
              return (
                <div className="flex items-center gap-4">
                  <IconComponent className={`h-10 w-10 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                  <div>
                    <div className={`text-4xl font-bold tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {weatherData.temperature}°C
                    </div>
                    <div className={`text-lg font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {settings.weather_location_name || 'Sää'}
                    </div>
                  </div>
                  <div className={`h-12 w-px ml-4 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
                </div>
              );
            })()}
            <Clock isLight={isLight} />
          </div>
        </header>

        {/* Content Rotation Area */}
        <div className="flex-1 relative overflow-hidden px-10 pb-14">
          <AnimatePresence mode="wait">
            {!currentContent ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center text-center space-y-8"
              >
                <div className={`p-8 rounded-full border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                  <Info className={`h-20 w-20 ${isLight ? 'text-slate-200' : 'text-slate-700'}`} />
                </div>
                <h2 className={`text-4xl font-medium max-w-3xl leading-relaxed ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {settings.fallback_message || 'Ei uusia tiedotteita tällä hetkellä.'}
                </h2>
              </motion.div>
            ) : (
              <motion.div
                key={currentContent.id}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.02, y: -10 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className={`flex h-full overflow-hidden rounded-[2.5rem] border shadow-2xl ${
                  isLight 
                    ? 'bg-white border-slate-200 shadow-slate-200/50' 
                    : 'bg-slate-900 border-slate-800 shadow-black/50'
                }`}
              >
                {/* Media Side (if any) */}
                {currentContent.media_url && (
                  <div className={`relative ${currentContent.body ? 'w-1/2' : 'w-full'}`}>
                    <div className={`absolute inset-0 z-10 ${
                      isLight 
                        ? 'bg-gradient-to-r from-white/10 to-white/40' 
                        : 'bg-gradient-to-r from-slate-900/10 to-slate-900/40'
                    }`} />
                    {currentContent.media_type === 'video' ? (
                      <video 
                        src={currentContent.media_url} 
                        autoPlay 
                        muted 
                        loop 
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <img 
                        src={currentContent.media_url} 
                        alt={currentContent.title || 'Infonäytön kuva'} 
                        className="absolute inset-0 h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {/* Media-only title overlay */}
                    {!currentContent.body && (
                      <div className={`absolute bottom-0 left-0 right-0 p-10 z-20 ${
                        isLight 
                          ? 'bg-gradient-to-t from-white/90 to-transparent' 
                          : 'bg-gradient-to-t from-slate-950/90 to-transparent'
                      }`}>
                        <h2 className={`text-7xl font-bold leading-tight drop-shadow-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {currentContent.title}
                        </h2>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Side */}
                {(currentContent.body || currentContent.type === 'rss') && (
                  <div className={`flex flex-col justify-center p-12 ${currentContent.media_url ? 'w-1/2' : 'w-full max-w-6xl mx-auto'}`}>
                    <div className="flex items-center gap-4 mb-10">
                      <div className={`p-3 rounded-xl ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800/50 text-slate-400'}`}>
                        {currentContent.type === 'announcement' ? <Megaphone className="h-8 w-8" /> :
                         currentContent.type === 'event' ? <Calendar className="h-8 w-8" /> :
                         currentContent.type === 'qr' ? <QrCode className="h-8 w-8" /> :
                         currentContent.type === 'rss' ? <Rss className="h-8 w-8" /> :
                         <Info className="h-8 w-8" />}
                      </div>
                      <span className={`text-2xl font-bold tracking-widest uppercase ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {currentContent.type === 'announcement' ? 'Tiedote' :
                         currentContent.type === 'event' ? 'Tapahtuma' :
                         currentContent.type === 'qr' ? 'Pikalinkki' :
                         currentContent.type === 'rss' ? 'Uutiset' :
                         'Julkaisu'}
                      </span>
                    </div>

                    {currentContent.type === 'rss' && currentContent.rss_url ? (
                      <RssFeed url={currentContent.rss_url} isLight={isLight} />
                    ) : (
                      <>
                        <h2 className={`text-7xl font-bold leading-[1.1] mb-8 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {currentContent.title}
                        </h2>

                        <div className={`text-3xl leading-relaxed whitespace-pre-wrap font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                          {currentContent.body}
                        </div>
                      </>
                    )}

                    {currentContent.type === 'event' && currentContent.event_date && (
                      <div className="mt-10 grid grid-cols-2 gap-8">
                        <div className={`flex items-center space-x-6 p-6 rounded-3xl border ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800/50'
                        }`}>
                          <ClockIcon className="h-12 w-12" style={{ color: settings.accent_color || '#4f46e5' }} />
                          <div>
                            <div className={`text-xl mb-1 font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Aika</div>
                            <div className={`text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {format(parseISO(currentContent.event_date), 'd.M.yyyy')}
                              {currentContent.start_time && (
                                <span className={`ml-4 ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>klo {currentContent.start_time}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {currentContent.location && (
                          <div className={`flex items-center space-x-6 p-6 rounded-3xl border ${
                            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800/50'
                          }`}>
                            <MapPin className="h-12 w-12" style={{ color: settings.accent_color || '#4f46e5' }} />
                            <div>
                              <div className={`text-xl mb-1 font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Paikka</div>
                              <div className={`text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentContent.location}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentContent.qr_url && (
                      <div className={`mt-10 flex items-center gap-10 p-6 rounded-3xl border self-start ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}>
                        <div className="bg-white p-3 rounded-2xl shadow-sm">
                          <QRCodeSVG value={currentContent.qr_url} size={140} />
                        </div>
                        <div className="space-y-2">
                          <p className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Lue lisää</p>
                          <p className={`text-xl ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Skannaa QR-koodi puhelimellasi</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Strip */}
      {contentQueue.length > 0 && currentContent && (
        <div className="fixed bottom-0 left-0 right-0 z-20">
          {contentQueue.length > 1 && (
            <div className={`text-right px-6 pb-2 text-sm font-medium tracking-wider tabular-nums ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {currentIndex + 1} / {contentQueue.length}
            </div>
          )}
          <div className={`h-1.5 w-full ${isLight ? 'bg-slate-200/60' : 'bg-slate-900/40'}`}>
            {contentQueue.length > 1 && (
              <motion.div 
                key={`progress-${currentContent.id}-${currentIndex}`}
                className="h-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                style={{ backgroundColor: settings.accent_color || '#4f46e5' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: currentContent.duration_seconds || DEFAULT_SLIDE_DURATION_SECONDS, ease: "linear" }}
              />
            )}
          </div>
        </div>
      )}

      {/* Sidebar - Optional, only if settings say so and we have QR links specifically for sidebar */}
      {/* For V1, we've moved QR links into the main content rotation for better visibility */}
    </div>
  );
}
