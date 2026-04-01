import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Megaphone, Calendar, Star, QrCode } from 'lucide-react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockAnnouncements, mockEvents, mockHighlights, mockQrLinks } from '../../lib/mock-data';
import { isUpcomingEventDate, isVisibleInWindow } from '../../lib/content';

export function Dashboard() {
  const [stats, setStats] = useState({
    announcements: 0,
    events: 0,
    highlights: 0,
    qrLinks: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const now = new Date();

      if (isMockSupabase) {
        setStats({
          announcements: mockAnnouncements.filter((item) => isVisibleInWindow(item, now)).length,
          events: mockEvents.filter((item) => item.is_published && isUpcomingEventDate(item.event_date, now)).length,
          highlights: mockHighlights.filter((item) => isVisibleInWindow(item, now)).length,
          qrLinks: mockQrLinks.filter((item) => isVisibleInWindow(item, now)).length,
        });
        return;
      }

      const [announcementsRes, eventsRes, highlightsRes, qrLinksRes] = await Promise.all([
        supabase.from('announcements').select('id, is_published, start_at, end_at'),
        supabase.from('events').select('id, is_published, event_date'),
        supabase.from('highlights').select('id, is_published, start_at, end_at'),
        supabase.from('qr_links').select('id, is_published, start_at, end_at'),
      ]);

      if (announcementsRes.error || eventsRes.error || highlightsRes.error || qrLinksRes.error) {
        console.error('Error fetching dashboard stats:', {
          announcements: announcementsRes.error,
          events: eventsRes.error,
          highlights: highlightsRes.error,
          qrLinks: qrLinksRes.error,
        });
      }

      setStats({
        announcements: (announcementsRes.data ?? []).filter((item) => isVisibleInWindow(item, now)).length,
        events: (eventsRes.data ?? []).filter((item) => item.is_published && isUpcomingEventDate(item.event_date, now)).length,
        highlights: (highlightsRes.data ?? []).filter((item) => isVisibleInWindow(item, now)).length,
        qrLinks: (qrLinksRes.data ?? []).filter((item) => isVisibleInWindow(item, now)).length,
      });
    }

    void fetchStats();
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
