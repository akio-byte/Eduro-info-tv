import { useEffect, useState, type FormEvent } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockEvents } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Pencil, Trash2, X, MapPin, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
  fromLocalDateInputValue,
  getAdminStatusBadge,
  getEventStatus,
  parseDateOnly,
  toLocalDateInputValue,
} from '../../lib/content-visibility';

type Event = Tables<'events'>;

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    void fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);

    if (isMockSupabase) {
      setEvents(mockEvents);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      setMessage({ type: 'error', text: 'Tapahtumien lataus epäonnistui.' });
    } else {
      setEvents(data || []);
    }

    setLoading(false);
  }

  function resetForm(options?: { preserveMessage?: boolean }) {
    setTitle('');
    setDescription('');
    setEventDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setIsPublished(true);
    setEditingId(null);
    setIsFormOpen(false);

    if (!options?.preserveMessage) {
      setMessage(null);
    }
  }

  function openEditForm(event: Event) {
    setTitle(event.title || '');
    setDescription(event.description || '');
    setEventDate(toLocalDateInputValue(event.event_date));
    setStartTime(event.start_time || '');
    setEndTime(event.end_time || '');
    setLocation(event.location || '');
    setIsPublished(event.is_published ?? true);
    setEditingId(event.id);
    setIsFormOpen(true);
    setMessage(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const normalizedEventDate = fromLocalDateInputValue(eventDate);
    if (!normalizedEventDate) {
      setMessage({ type: 'error', text: 'Anna tapahtumalle päivämäärä.' });
      return;
    }

    const payload = {
      title,
      description: description || null,
      event_date: normalizedEventDate,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location || null,
      is_published: isPublished,
    };

    const successMessage = editingId ? 'Tapahtuma päivitetty.' : 'Tapahtuma luotu.';

    if (isMockSupabase) {
      if (editingId) {
        setEvents((prev) =>
          prev.map((item) =>
            item.id === editingId ? { ...item, ...payload, updated_at: new Date().toISOString() } : item,
          ),
        );
      } else {
        const newEvent: Event = {
          ...payload,
          id: Math.random().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setEvents((prev) =>
          [...prev, newEvent].sort(
            (left, right) => new Date(left.event_date).getTime() - new Date(right.event_date).getTime(),
          ),
        );
      }

      resetForm({ preserveMessage: true });
      setMessage({ type: 'success', text: `${successMessage} (Mock).` });
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('events').update(payload).eq('id', editingId);
      if (error) {
        setMessage({ type: 'error', text: 'Tapahtuman päivitys epäonnistui.' });
        return;
      }
    } else {
      const { error } = await supabase.from('events').insert(payload);
      if (error) {
        setMessage({ type: 'error', text: 'Tapahtuman luonti epäonnistui.' });
        return;
      }
    }

    resetForm({ preserveMessage: true });
    setMessage({ type: 'success', text: successMessage });
    await fetchEvents();
  }

  async function handleDelete(id: string) {
    if (!confirm('Haluatko varmasti poistaa tämän tapahtuman?')) {
      return;
    }

    if (isMockSupabase) {
      setEvents((prev) => prev.filter((item) => item.id !== id));
      setMessage({ type: 'success', text: 'Tapahtuma poistettu (Mock).' });
      return;
    }

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: 'Tapahtuman poisto epäonnistui.' });
      return;
    }

    setMessage({ type: 'success', text: 'Tapahtuma poistettu.' });
    await fetchEvents();
  }

  async function togglePublish(id: string, currentStatus: boolean) {
    if (isMockSupabase) {
      setEvents((prev) => prev.map((item) => (item.id === id ? { ...item, is_published: !currentStatus } : item)));
      return;
    }

    const { error } = await supabase.from('events').update({ is_published: !currentStatus }).eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: 'Julkaisutilan päivitys epäonnistui.' });
      return;
    }

    await fetchEvents();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tapahtumat</h1>
          <p className="mt-2 text-slate-500">Hallitse tulevia tapahtumia.</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Uusi tapahtuma
          </Button>
        )}
      </div>

      {message && (
        <div className={`rounded-md p-4 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {isFormOpen && (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle>{editingId ? 'Muokkaa tapahtumaa' : 'Luo uusi tapahtuma'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => resetForm()}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Otsikko</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Kuvaus</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Päivämäärä</Label>
                  <Input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Alkamisaika (valinnainen)</Label>
                  <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Päättymisaika (valinnainen)</Label>
                  <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Sijainti (valinnainen)</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="esim. Pääauditorio"
                />
              </div>
              <div className="flex items-center space-x-2 border-t border-slate-100 pt-4">
                <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
                <Label htmlFor="published">Julkaistu näytöllä</Label>
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
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
              <p>Ei tapahtumia. Luo ensimmäinen tapahtuma ylhäältä.</p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => {
            const status = getEventStatus(event);
            const statusBadge = getAdminStatusBadge(status);

            return (
              <Card key={event.id} className={status === 'active' ? '' : 'opacity-60'}>
                <CardContent className="flex items-start justify-between p-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-900">{event.title}</h3>
                      <span className={statusBadge.className}>{statusBadge.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {format(parseDateOnly(event.event_date), 'd.M.yyyy', { locale: fi })}
                      </div>
                      {(event.start_time || event.end_time) && (
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          {event.start_time}
                          {event.end_time ? ` - ${event.end_time}` : ''}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    {event.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{event.description}</p>}
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <div className="mr-4 flex items-center space-x-2">
                      <Label htmlFor={`pub-${event.id}`} className="sr-only">
                        Julkaistu
                      </Label>
                      <Switch
                        id={`pub-${event.id}`}
                        checked={event.is_published}
                        onCheckedChange={() => void togglePublish(event.id, event.is_published)}
                      />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => openEditForm(event)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => void handleDelete(event.id)}
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
