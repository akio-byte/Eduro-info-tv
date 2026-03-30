import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Megaphone, Calendar, Star, QrCode } from 'lucide-react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockAnnouncements, mockEvents, mockHighlights, mockQrLinks } from '../../lib/mock-data';

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
        const now = new Date();
        setStats({
          announcements: mockAnnouncements.filter(a => {
            if (!a.is_published) return false;
            if (a.start_at && new Date(a.start_at) > now) return false;
            if (a.end_at && new Date(a.end_at) < now) return false;
            return true;
          }).length,
          events: mockEvents.filter(e => {
            if (!e.is_published) return false;
            const eventDate = new Date(e.event_date);
            if (eventDate < new Date(now.setHours(0, 0, 0, 0))) return false;
            return true;
          }).length,
          highlights: mockHighlights.filter(h => {
            if (!h.is_published) return false;
            if (h.start_at && new Date(h.start_at) > now) return false;
            if (h.end_at && new Date(h.end_at) < now) return false;
            return true;
          }).length,
          qrLinks: mockQrLinks.filter(q => {
            if (!q.is_published) return false;
            if (q.start_at && new Date(q.start_at) > now) return false;
            if (q.end_at && new Date(q.end_at) < now) return false;
            return true;
          }).length,
        });
        return;
      }

      const now = new Date().toISOString();
      const [announcements, events, highlights, qrLinks] = await Promise.all([
        supabase.from('announcements').select('*', { count: 'exact', head: true })
          .eq('is_published', true)
          .or(`start_at.is.null,start_at.lte.${now}`)
          .or(`end_at.is.null,end_at.gte.${now}`),
        supabase.from('events').select('*', { count: 'exact', head: true })
          .eq('is_published', true)
          .gte('event_date', new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0]),
        supabase.from('highlights').select('*', { count: 'exact', head: true })
          .eq('is_published', true)
          .or(`start_at.is.null,start_at.lte.${now}`)
          .or(`end_at.is.null,end_at.gte.${now}`),
        supabase.from('qr_links').select('*', { count: 'exact', head: true })
          .eq('is_published', true)
          .or(`start_at.is.null,start_at.lte.${now}`)
          .or(`end_at.is.null,end_at.gte.${now}`),
      ]);

      setStats({
        announcements: announcements.count || 0,
        events: events.count || 0,
        highlights: highlights.count || 0,
        qrLinks: qrLinks.count || 0,
      });
    }

    void fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Julkaistut tiedotteet',
      value: stats.announcements,
      icon: Megaphone,
    },
    {
      title: 'Julkaistut tapahtumat',
      value: stats.events,
      icon: Calendar,
    },
    {
      title: 'Aktiiviset nostot',
      value: stats.highlights,
      icon: Star,
    },
    {
      title: 'QR-linkit näytöllä',
      value: stats.qrLinks,
      icon: QrCode,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kojelauta</h1>
        <p className="mt-2 text-slate-500">Yhteenveto InfoTV:n sisällöstä.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{stat.title}</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-surface-muted)] text-[var(--color-brand-primary)]">
                <stat.icon className="h-4 w-4" />
              </div>
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
