import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Megaphone, Calendar, ImageIcon, QrCode, FileText, Rss, Clock } from 'lucide-react';
import { db, isMockFirebase } from '../../lib/firebase';
import { collection, query, where, getCountFromServer, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Skeleton } from '../../components/ui/Skeleton';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [loadingRotation, setLoadingRotation] = useState(true);
  const [forceCalculateRotation, setForceCalculateRotation] = useState(false);
  const [tooManyItems, setTooManyItems] = useState(false);
  const [stats, setStats] = useState({
    announcements: 0,
    events: 0,
    media: 0,
    qrLinks: 0,
    rssFeeds: 0,
    total: 0
  });
  const [rotationStats, setRotationStats] = useState({
    totalDuration: 0,
    announcementsDuration: 0,
    eventsDuration: 0,
    mediaDuration: 0,
    qrDuration: 0,
    rssDuration: 0,
  });
  
  const { orgId } = useAuth();

  useEffect(() => {
    if (!orgId) return;

    async function fetchStats() {
      setLoading(true);
      if (isMockFirebase) {
        setStats({
          announcements: 1,
          events: 0,
          media: 1,
          qrLinks: 0,
          rssFeeds: 1,
          total: 3
        });
        setRotationStats({
          totalDuration: 40,
          announcementsDuration: 15,
          eventsDuration: 0,
          mediaDuration: 10,
          qrDuration: 0,
          rssDuration: 15,
        });
        setLoading(false);
        return;
      }

      try {
        const baseQuery = query(
          collection(db, 'content_items'), 
          where('org_id', '==', orgId),
          where('is_archived', '==', false)
        );

        const publishedQuery = query(baseQuery, where('is_published', '==', true));
        const totalSnap = await getCountFromServer(baseQuery);
        const publishedCountSnap = await getCountFromServer(publishedQuery);
        const publishedCount = publishedCountSnap.data().count;

        // Basic stats
        setStats({
          announcements: 0, // We don't have per-type counts without getDocs, but we can just show total for now, or keep them 0 if we don't want to do 5 count queries.
          events: 0,
          media: 0,
          qrLinks: 0,
          rssFeeds: 0,
          total: totalSnap.data().count
        });
        setLoading(false);

        // Rotation stats logic
        if (publishedCount > 200 && !forceCalculateRotation) {
          setTooManyItems(true);
          setLoadingRotation(false);
          return;
        }

        setTooManyItems(false);
        setLoadingRotation(true);
        
        const publishedSnap = await getDocs(publishedQuery);

        let announcements = 0;
        let events = 0;
        let media = 0;
        let qrLinks = 0;
        let rssFeeds = 0;

        let totalDuration = 0;
        let announcementsDuration = 0;
        let eventsDuration = 0;
        let mediaDuration = 0;
        let qrDuration = 0;
        let rssDuration = 0;

        publishedSnap.forEach(doc => {
          const data = doc.data();
          const duration = data.duration_seconds || 15;
          totalDuration += duration;
          
          switch(data.type) {
            case 'announcement':
              announcements++;
              announcementsDuration += duration;
              break;
            case 'event':
              events++;
              eventsDuration += duration;
              break;
            case 'media':
              media++;
              mediaDuration += duration;
              break;
            case 'qr':
              qrLinks++;
              qrDuration += duration;
              break;
            case 'rss':
              rssFeeds++;
              rssDuration += duration;
              break;
          }
        });

        setStats({
          announcements,
          events,
          media,
          qrLinks,
          rssFeeds,
          total: totalSnap.data().count
        });

        setRotationStats({
          totalDuration,
          announcementsDuration,
          eventsDuration,
          mediaDuration,
          qrDuration,
          rssDuration,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
        setLoadingRotation(false);
      }
    }

    fetchStats();
  }, [orgId, forceCalculateRotation]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) {
      return `${m} min ${s > 0 ? `${s} s` : ''}`;
    }
    return `${s} s`;
  };

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
    {
      title: 'RSS-syötteet',
      value: stats.rssFeeds,
      icon: Rss,
      color: 'text-orange-600',
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
          {loading ? (
            <Skeleton variant="text" className="h-8 w-12 mt-1" />
          ) : (
            <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton variant="text" className="h-4 w-24" />
                <Skeleton variant="circular" className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <Skeleton variant="text" className="h-8 w-12" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && tooManyItems && !forceCalculateRotation && (
        <Card className="bg-white border-indigo-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              Kierron kokonaiskesto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Liian paljon sisältöä laskettavaksi reaaliaikaisesti.</p>
            <button 
              onClick={() => setForceCalculateRotation(true)}
              className="text-sm bg-indigo-50 text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-100 transition-colors font-medium"
            >
              Laske silti
            </button>
          </CardContent>
        </Card>
      )}

      {!loadingRotation && !tooManyItems && rotationStats.totalDuration > 0 && (
        <Card className="bg-white border-indigo-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              Kierron kokonaiskesto: {formatDuration(rotationStats.totalDuration)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex mt-2">
              {rotationStats.announcementsDuration > 0 && (
                <div 
                  style={{ width: `${(rotationStats.announcementsDuration / rotationStats.totalDuration) * 100}%` }} 
                  className="bg-blue-500 h-full" 
                  title={`Tiedotteet: ${formatDuration(rotationStats.announcementsDuration)}`}
                />
              )}
              {rotationStats.eventsDuration > 0 && (
                <div 
                  style={{ width: `${(rotationStats.eventsDuration / rotationStats.totalDuration) * 100}%` }} 
                  className="bg-orange-500 h-full" 
                  title={`Tapahtumat: ${formatDuration(rotationStats.eventsDuration)}`}
                />
              )}
              {rotationStats.mediaDuration > 0 && (
                <div 
                  style={{ width: `${(rotationStats.mediaDuration / rotationStats.totalDuration) * 100}%` }} 
                  className="bg-purple-500 h-full" 
                  title={`Media: ${formatDuration(rotationStats.mediaDuration)}`}
                />
              )}
              {rotationStats.qrDuration > 0 && (
                <div 
                  style={{ width: `${(rotationStats.qrDuration / rotationStats.totalDuration) * 100}%` }} 
                  className="bg-indigo-500 h-full" 
                  title={`QR-linkit: ${formatDuration(rotationStats.qrDuration)}`}
                />
              )}
              {rotationStats.rssDuration > 0 && (
                <div 
                  style={{ width: `${(rotationStats.rssDuration / rotationStats.totalDuration) * 100}%` }} 
                  className="bg-orange-600 h-full" 
                  title={`RSS: ${formatDuration(rotationStats.rssDuration)}`}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
              {rotationStats.announcementsDuration > 0 && (
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Tiedotteet ({formatDuration(rotationStats.announcementsDuration)})</div>
              )}
              {rotationStats.eventsDuration > 0 && (
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> Tapahtumat ({formatDuration(rotationStats.eventsDuration)})</div>
              )}
              {rotationStats.mediaDuration > 0 && (
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> Media ({formatDuration(rotationStats.mediaDuration)})</div>
              )}
              {rotationStats.qrDuration > 0 && (
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> QR-linkit ({formatDuration(rotationStats.qrDuration)})</div>
              )}
              {rotationStats.rssDuration > 0 && (
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-600" /> RSS ({formatDuration(rotationStats.rssDuration)})</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-xl font-bold text-slate-800">Pikaohje – Näin käytät InfoTV:tä</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-1 bg-blue-100 text-blue-600 p-2 rounded-lg h-fit">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">1. Sisällön hallinta (Julkaisut)</h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Kaikki näytöllä pyörivä sisältö (tiedotteet, kuvat, tapahtumat, QR-koodit ja RSS-syötteet) lisätään ja hallitaan <strong>Julkaisut</strong>-välilehdellä. Voit ajastaa sisältöä näkymään vain tiettynä aikana ja määrittää, kuinka kauan kukin julkaisu näkyy ruudulla.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1 bg-indigo-100 text-indigo-600 p-2 rounded-lg h-fit">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">2. InfoTV-näytön avaaminen</h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Saat varsinaisen infonäytön auki vasemman valikon <strong>Avaa näyttö</strong> -painikkeesta. Tämä näkymä on tarkoitettu jätettäväksi auki varsinaisille infonäytöille (esim. aulan televisioon tai erilliselle näytölle).
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-1 bg-purple-100 text-purple-600 p-2 rounded-lg h-fit">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">3. Ulkoasu ja asetukset</h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    <strong>Asetukset</strong>-välilehdellä voit vaihtaa organisaatiosi logon, muokata näytön teemavärejä (tausta ja tekstit) sekä kytkeä sää-widgetin päälle haluamallesi paikkakunnalle.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1 bg-orange-100 text-orange-600 p-2 rounded-lg h-fit">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">4. Tekoälyavustaja (Gemini)</h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Sisältöä luodessa voit hyödyntää tekoälyä. Voit pyytää sitä esimerkiksi tiivistämään pitkän tekstin, ehdottamaan iskeviä otsikoita tai muuttamaan tekstin sävyä virallisemmaksi tai innostavammaksi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
