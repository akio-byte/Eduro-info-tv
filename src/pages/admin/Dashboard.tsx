import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Megaphone, Calendar, ImageIcon, QrCode, FileText } from 'lucide-react';
import { db, isMockFirebase } from '../../lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export function Dashboard() {
  const [stats, setStats] = useState({
    announcements: 0,
    events: 0,
    media: 0,
    qrLinks: 0,
    total: 0
  });
  
  const { orgId } = useAuth();

  useEffect(() => {
    if (!orgId) return;

    async function fetchStats() {
      if (isMockFirebase) {
        setStats({
          announcements: 1,
          events: 0,
          media: 1,
          qrLinks: 0,
          total: 2
        });
        return;
      }

      try {
        const baseQuery = query(
          collection(db, 'content_items'), 
          where('org_id', '==', orgId),
          where('is_archived', '==', false)
        );

        const [annSnap, evSnap, mediaSnap, qrSnap, totalSnap] = await Promise.all([
          getCountFromServer(query(baseQuery, where('type', '==', 'announcement'), where('is_published', '==', true))),
          getCountFromServer(query(baseQuery, where('type', '==', 'event'), where('is_published', '==', true))),
          getCountFromServer(query(baseQuery, where('type', '==', 'media'), where('is_published', '==', true))),
          getCountFromServer(query(baseQuery, where('type', '==', 'qr'), where('is_published', '==', true))),
          getCountFromServer(baseQuery)
        ]);

        setStats({
          announcements: annSnap.data().count,
          events: evSnap.data().count,
          media: mediaSnap.data().count,
          qrLinks: qrSnap.data().count,
          total: totalSnap.data().count
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }

    fetchStats();
  }, [orgId]);

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
      color: 'text-orange-500',
    },
    {
      title: 'Aktiivinen media',
      value: stats.media,
      icon: ImageIcon,
      color: 'text-purple-500',
    },
    {
      title: 'QR-linkit',
      value: stats.qrLinks,
      icon: QrCode,
      color: 'text-indigo-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kojelauta</h1>
          <p className="text-slate-500 mt-2">Yhteenveto organisaatiosi InfoTV-sisällöstä.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Julkaisuja yhteensä</div>
          <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-indigo-600 text-white overflow-hidden relative">
        <CardContent className="p-8 relative z-10">
          <div className="max-w-xl space-y-4">
            <h2 className="text-2xl font-bold">Tervetuloa Eduro InfoTV:hen!</h2>
            <p className="text-indigo-100 leading-relaxed">
              Tämä on uusi, yksinkertaistettu versio hallintapaneelista. 
              Kaikki sisällöt on nyt yhdistetty yhden "Julkaisut"-näkymän alle, 
              mikä tekee InfoTV:n hallinnasta helpompaa ja nopeampaa.
            </p>
          </div>
          <FileText className="absolute right-[-20px] bottom-[-20px] h-64 w-64 text-white/10 rotate-12" />
        </CardContent>
      </Card>
    </div>
  );
}
