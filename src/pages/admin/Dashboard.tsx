import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Megaphone, Calendar, Star, QrCode } from 'lucide-react';
import { db, isMockFirebase } from '../../lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
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
      if (isMockFirebase) {
        const now = new Date();
        setStats({
          announcements: mockAnnouncements.filter(a => {
            if (!a.is_published) return false;
            if (a.start_at && new Date(a.start_at as string) > now) return false;
            if (a.end_at && new Date(a.end_at as string) < now) return false;
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
            if (h.start_at && new Date(h.start_at as string) > now) return false;
            if (h.end_at && new Date(h.end_at as string) < now) return false;
            return true;
          }).length,
          qrLinks: mockQrLinks.filter(q => {
            if (!q.is_published) return false;
            if (q.start_at && new Date(q.start_at as string) > now) return false;
            if (q.end_at && new Date(q.end_at as string) < now) return false;
            return true;
          }).length,
        });
        return;
      }

      try {
        const now = new Date();
        
        // Firestore doesn't support complex OR queries for counts easily without multiple queries or composite indexes
        // For simplicity, we'll just count all published ones for now, or filter by date if possible.
        // Actually, we can use multiple where clauses if they are on the same field or if we have indexes.
        
        const annQuery = query(collection(db, 'announcements'), where('is_published', '==', true));
        const evQuery = query(collection(db, 'events'), where('is_published', '==', true));
        const highQuery = query(collection(db, 'highlights'), where('is_published', '==', true));
        const qrQuery = query(collection(db, 'qr_links'), where('is_published', '==', true));

        const [annSnap, evSnap, highSnap, qrSnap] = await Promise.all([
          getCountFromServer(annQuery),
          getCountFromServer(evQuery),
          getCountFromServer(highQuery),
          getCountFromServer(qrQuery),
        ]);

        setStats({
          announcements: annSnap.data().count,
          events: evSnap.data().count,
          highlights: highSnap.data().count,
          qrLinks: qrSnap.data().count,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
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
