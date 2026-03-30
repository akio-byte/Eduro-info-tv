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
        setStats({
          announcements: mockAnnouncements.filter(a => a.is_published).length,
          events: mockEvents.filter(e => e.is_published).length,
          highlights: mockHighlights.filter(h => h.is_published).length,
          qrLinks: mockQrLinks.filter(q => q.is_published).length,
        });
        return;
      }

      // In a real app, you might want to run these in parallel with Promise.all
      const [announcements, events, highlights, qrLinks] = await Promise.all([
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('highlights').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('qr_links').select('*', { count: 'exact', head: true }).eq('is_published', true),
      ]);

      setStats({
        announcements: announcements.count || 0,
        events: events.count || 0,
        highlights: highlights.count || 0,
        qrLinks: qrLinks.count || 0,
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
