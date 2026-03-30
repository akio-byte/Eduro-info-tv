import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Megaphone, Calendar, Star, QrCode } from 'lucide-react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockAnnouncements, mockEvents, mockHighlights, mockQrLinks, mockSettings } from '../../lib/mock-data';
import { DISPLAY_SETTINGS_ID } from '../../lib/display-settings';
import { isUpcomingEvent, isVisibleWindowContent } from '../../lib/content-visibility';

export function Dashboard() {
  const [stats, setStats] = useState({
    announcements: 0,
    events: 0,
    highlights: 0,
    qrLinks: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      if (isMockSupabase) {
        setStats({
          announcements: mockSettings.show_announcements
            ? mockAnnouncements.filter((item) => isVisibleWindowContent(item)).length
            : 0,
          events: mockSettings.show_events
            ? mockEvents.filter((item) => item.is_published && isUpcomingEvent(item.event_date)).length
            : 0,
          highlights: mockSettings.show_highlights
            ? mockHighlights.filter((item) => isVisibleWindowContent(item)).length
            : 0,
          qrLinks: mockSettings.show_qr_links
            ? mockQrLinks.filter((item) => isVisibleWindowContent(item)).length
            : 0,
        });
        return;
      }

      const [settingsRes, announcementsRes, eventsRes, highlightsRes, qrLinksRes] = await Promise.all([
        supabase.from('display_settings').select('*').eq('id', DISPLAY_SETTINGS_ID).maybeSingle(),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').order('event_date', { ascending: true }),
        supabase.from('highlights').select('*').order('sort_order', { ascending: true }),
        supabase.from('qr_links').select('*').order('sort_order', { ascending: true }),
      ]);

      const settings = settingsRes.data || mockSettings;

      setStats({
        announcements: settings.show_announcements
          ? (announcementsRes.data || []).filter((item) => isVisibleWindowContent(item)).length
          : 0,
        events: settings.show_events
          ? (eventsRes.data || []).filter((item) => item.is_published && isUpcomingEvent(item.event_date)).length
          : 0,
        highlights: settings.show_highlights
          ? (highlightsRes.data || []).filter((item) => isVisibleWindowContent(item)).length
          : 0,
        qrLinks: settings.show_qr_links
          ? (qrLinksRes.data || []).filter((item) => isVisibleWindowContent(item)).length
          : 0,
      });
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Julkaistut tiedotteet',
      value: stats.announcements,
      icon: Megaphone,
      color: 'text-blue-500',
    },
    {
      title: 'Julkaistut tapahtumat',
      value: stats.events,
      icon: Calendar,
      color: 'text-green-500',
    },
    {
      title: 'Aktiiviset nostot',
      value: stats.highlights,
      icon: Star,
      color: 'text-yellow-500',
    },
    {
      title: 'QR-linkit näytöllä',
      value: stats.qrLinks,
      icon: QrCode,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kojelauta</h1>
        <p className="text-slate-500 mt-2">Yhteenveto InfoTV:n sisällöstä.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
