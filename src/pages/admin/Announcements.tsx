import { useEffect, useState, type FormEvent } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockAnnouncements } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Pencil, Trash2, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
  fromLocalDateTimeInputValue,
  getAdminStatusBadge,
  getWindowStatus,
  toLocalDateTimeInputValue,
} from '../../lib/content-visibility';

type Announcement = Tables<'announcements'>;

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [isPublished, setIsPublished] = useState(true);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  useEffect(() => {
    void fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    setLoading(true);

    if (isMockSupabase) {
      setAnnouncements(mockAnnouncements);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      setMessage({ type: 'error', text: 'Tiedotteiden lataus epäonnistui.' });
    } else {
      setAnnouncements(data || []);
    }

    setLoading(false);
  }

  function resetForm(options?: { preserveMessage?: boolean }) {
    setTitle('');
    setBody('');
    setPriority('normal');
    setIsPublished(true);
    setStartAt('');
    setEndAt('');
    setEditingId(null);
    setIsFormOpen(false);

    if (!options?.preserveMessage) {
      setMessage(null);
    }
  }

  function openEditForm(announcement: Announcement) {
    setTitle(announcement.title || '');
    setBody(announcement.body || '');
    setPriority(announcement.priority || 'normal');
    setIsPublished(announcement.is_published ?? true);
    setStartAt(toLocalDateTimeInputValue(announcement.start_at));
    setEndAt(toLocalDateTimeInputValue(announcement.end_at));
    setEditingId(announcement.id);
    setIsFormOpen(true);
    setMessage(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const payload = {
      title,
      body,
      priority,
      is_published: isPublished,
      start_at: fromLocalDateTimeInputValue(startAt),
      end_at: fromLocalDateTimeInputValue(endAt),
    };

    const successMessage = editingId ? 'Tiedote päivitetty.' : 'Tiedote luotu.';

    if (isMockSupabase) {
      if (editingId) {
        setAnnouncements((prev) =>
          prev.map((item) =>
            item.id === editingId ? { ...item, ...payload, updated_at: new Date().toISOString() } : item,
          ),
        );
      } else {
        const newAnnouncement: Announcement = {
          ...payload,
          id: Math.random().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setAnnouncements((prev) => [newAnnouncement, ...prev]);
      }

      resetForm({ preserveMessage: true });
      setMessage({ type: 'success', text: `${successMessage} (Mock).` });
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('announcements').update(payload).eq('id', editingId);
      if (error) {
        setMessage({ type: 'error', text: 'Virhe tallennettaessa tiedotetta.' });
        return;
      }
    } else {
      const { error } = await supabase.from('announcements').insert(payload);
      if (error) {
        setMessage({ type: 'error', text: 'Virhe luotaessa tiedotetta.' });
        return;
      }
    }

    resetForm({ preserveMessage: true });
    setMessage({ type: 'success', text: successMessage });
    await fetchAnnouncements();
  }

  async function handleDelete(id: string) {
    if (!confirm('Haluatko varmasti poistaa tämän tiedotteen?')) {
      return;
    }

    if (isMockSupabase) {
      setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      setMessage({ type: 'success', text: 'Tiedote poistettu (Mock).' });
      return;
    }

    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: 'Virhe poistettaessa tiedotetta.' });
      return;
    }

    setMessage({ type: 'success', text: 'Tiedote poistettu.' });
    await fetchAnnouncements();
  }

  async function togglePublish(id: string, currentStatus: boolean) {
    if (isMockSupabase) {
      setAnnouncements((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_published: !currentStatus } : item)),
      );
      return;
    }

    const { error } = await supabase
      .from('announcements')
      .update({ is_published: !currentStatus })
      .eq('id', id);

    if (error) {
      setMessage({ type: 'error', text: 'Julkaisutilan päivitys epäonnistui.' });
      return;
    }

    await fetchAnnouncements();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tiedotteet</h1>
          <p className="mt-2 text-slate-500">Hallitse näytöllä pyöriviä tiedotteita.</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Uusi tiedote
          </Button>
        )}
      </div>

      {message && !isFormOpen && (
        <div className={`rounded-md p-4 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {isFormOpen && (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle>{editingId ? 'Muokkaa tiedotetta' : 'Luo uusi tiedote'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => resetForm()}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {message && (
              <div className={`mb-4 rounded-md p-4 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Otsikko</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Sisältö</Label>
                <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} required rows={4} />
              </div>
              <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startAt">Julkaisu alkaa (valinnainen)</Label>
                  <Input id="startAt" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endAt">Julkaisu päättyy (valinnainen)</Label>
                  <Input id="endAt" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioriteetti</Label>
                  <select
                    id="priority"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'high' | 'normal' | 'low')}
                  >
                    <option value="high">Korkea</option>
                    <option value="normal">Normaali</option>
                    <option value="low">Matala</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
                  <Label htmlFor="published">Julkaistu näytöllä</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" onClick={() => resetForm()}>
                  Peruuta
                </Button>
                <Button type="submit">Tallenna</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-slate-500">Ladataan...</div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
              <p>Ei tiedotteita. Luo ensimmäinen tiedote ylhäältä.</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => {
            const status = getWindowStatus(announcement);
            const statusBadge = getAdminStatusBadge(status);

            return (
              <Card key={announcement.id} className={status === 'active' ? '' : 'opacity-60'}>
                <CardContent className="flex items-start justify-between p-6">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
                      {announcement.priority === 'high' && (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Tärkeä</span>
                      )}
                      <span className={statusBadge.className}>{statusBadge.label}</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-500">{announcement.body}</p>
                    <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400">
                      <span>Luotu: {format(new Date(announcement.created_at), 'd.M.yyyy HH:mm', { locale: fi })}</span>
                      {(announcement.start_at || announcement.end_at) && (
                        <span className="flex items-center">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {announcement.start_at ? format(new Date(announcement.start_at), 'd.M.yyyy HH:mm') : 'Heti'} -
                          {announcement.end_at ? ` ${format(new Date(announcement.end_at), 'd.M.yyyy HH:mm')}` : ' Toistaiseksi'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <div className="mr-4 flex items-center space-x-2">
                      <Label htmlFor={`pub-${announcement.id}`} className="sr-only">
                        Julkaistu
                      </Label>
                      <Switch
                        id={`pub-${announcement.id}`}
                        checked={announcement.is_published}
                        onCheckedChange={() => void togglePublish(announcement.id, announcement.is_published)}
                      />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => openEditForm(announcement)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => void handleDelete(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
