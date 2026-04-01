import { useState, useEffect, FormEvent } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockQrLinks } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { getErrorMessage, hasValidDateTimeWindow, toDateTimeInputValue, toDateTimeRange } from '../../lib/content';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Pencil, Trash2, X, Link as LinkIcon, Calendar as CalendarIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';

type QrLink = Tables<'qr_links'>;

export function QrLinks() {
  const [qrLinks, setQrLinks] = useState<QrLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    void fetchQrLinks();
  }, []);

  async function fetchQrLinks() {
    setLoading(true);

    if (isMockSupabase) {
      setQrLinks(mockQrLinks);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('qr_links')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching QR links:', error);
      setMessage({ type: 'error', text: getErrorMessage(error, 'QR-linkkien lataus epäonnistui.') });
    } else {
      setQrLinks(data || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setTitle('');
    setUrl('');
    setDescription('');
    setStartAt('');
    setEndAt('');
    setIsPublished(true);
    setEditingId(null);
    setIsFormOpen(false);
    setMessage(null);
  }

  function openEditForm(qrLink: QrLink) {
    setTitle(qrLink.title || '');
    setUrl(qrLink.url || '');
    setDescription(qrLink.description || '');
    setStartAt(toDateTimeInputValue(qrLink.start_at));
    setEndAt(toDateTimeInputValue(qrLink.end_at));
    setIsPublished(qrLink.is_published ?? true);
    setEditingId(qrLink.id);
    setIsFormOpen(true);
    setMessage(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!hasValidDateTimeWindow(startAt, endAt)) {
      setMessage({ type: 'error', text: 'Julkaisun päättymisen on oltava alkamisen jälkeen.' });
      return;
    }

    const payload = {
      title,
      url,
      description: description || null,
      is_published: isPublished,
      ...toDateTimeRange(startAt, endAt),
    };

    if (isMockSupabase) {
      if (editingId) {
        setQrLinks((prev) => prev.map((qrLink) => (
          qrLink.id === editingId ? { ...qrLink, ...payload, updated_at: new Date().toISOString() } : qrLink
        )));
        setMessage({ type: 'success', text: 'Linkki päivitetty (Mock).' });
      } else {
        const newQrLink: QrLink = {
          ...payload,
          id: Math.random().toString(),
          sort_order: qrLinks.length + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setQrLinks([...qrLinks, newQrLink]);
        setMessage({ type: 'success', text: 'Linkki luotu (Mock).' });
      }

      resetForm();
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('qr_links').update(payload).eq('id', editingId);
      if (error) {
        setMessage({ type: 'error', text: getErrorMessage(error, 'Linkin päivitys epäonnistui.') });
        return;
      }

      setMessage({ type: 'success', text: 'Linkki päivitetty.' });
    } else {
      const { error } = await supabase.from('qr_links').insert({ ...payload, sort_order: qrLinks.length + 1 });
      if (error) {
        setMessage({ type: 'error', text: getErrorMessage(error, 'Linkin luonti epäonnistui.') });
        return;
      }

      setMessage({ type: 'success', text: 'Linkki luotu.' });
    }

    resetForm();
    await fetchQrLinks();
  }

  async function handleDelete(id: string) {
    if (!confirm('Haluatko varmasti poistaa tämän QR-linkin?')) return;

    if (isMockSupabase) {
      setQrLinks((prev) => prev.filter((qrLink) => qrLink.id !== id));
      setMessage({ type: 'success', text: 'Linkki poistettu (Mock).' });
      return;
    }

    const { error } = await supabase.from('qr_links').delete().eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Linkin poisto epäonnistui.') });
      return;
    }

    setMessage({ type: 'success', text: 'Linkki poistettu.' });
    await fetchQrLinks();
  }

  async function moveQrLink(id: string, direction: 'up' | 'down') {
    const currentIndex = qrLinks.findIndex((qrLink) => qrLink.id === id);
    if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === qrLinks.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentItem = qrLinks[currentIndex];
    const swapItem = qrLinks[newIndex];

    if (!currentItem || !swapItem) {
      return;
    }

    if (isMockSupabase) {
      const nextQrLinks = [...qrLinks];
      nextQrLinks[currentIndex] = { ...swapItem, sort_order: currentItem.sort_order };
      nextQrLinks[newIndex] = { ...currentItem, sort_order: swapItem.sort_order };
      setQrLinks(nextQrLinks.sort((a, b) => a.sort_order - b.sort_order));
      return;
    }

    const [firstUpdate, secondUpdate] = await Promise.all([
      supabase.from('qr_links').update({ sort_order: swapItem.sort_order }).eq('id', currentItem.id),
      supabase.from('qr_links').update({ sort_order: currentItem.sort_order }).eq('id', swapItem.id),
    ]);

    if (firstUpdate.error || secondUpdate.error) {
      setMessage({
        type: 'error',
        text: getErrorMessage(firstUpdate.error || secondUpdate.error, 'Linkkien järjestyksen vaihto epäonnistui.'),
      });
      return;
    }

    await fetchQrLinks();
  }

  async function togglePublish(id: string, currentStatus: boolean) {
    if (isMockSupabase) {
      setQrLinks((prev) => prev.map((qrLink) => (
        qrLink.id === id ? { ...qrLink, is_published: !currentStatus } : qrLink
      )));
      return;
    }

    const { error } = await supabase.from('qr_links').update({ is_published: !currentStatus }).eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Julkaisutilan vaihto epäonnistui.') });
      return;
    }

    await fetchQrLinks();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">QR-linkit</h1>
          <p className="mt-2 text-slate-500">Hallitse näytöllä näkyviä QR-koodeja ja pikalinkkejä.</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Uusi linkki
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
            <CardTitle>{editingId ? 'Muokkaa linkkiä' : 'Luo uusi linkki'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Otsikko</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL-osoite</Label>
                  <Input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://eduro.fi/..." required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Kuvaus (valinnainen)</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
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
              <div className="flex items-center space-x-2 border-t border-slate-100 pt-4">
                <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
                <Label htmlFor="published">Julkaistu näytöllä</Label>
              </div>
              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>Peruuta</Button>
                <Button type="submit">Tallenna</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="text-slate-500">Ladataan...</div>
        ) : qrLinks.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
              <p>Ei QR-linkkejä. Luo ensimmäinen linkki ylhäältä.</p>
            </CardContent>
          </Card>
        ) : (
          qrLinks.map((qrLink, index) => {
            const now = new Date();
            const isScheduled = qrLink.start_at && new Date(qrLink.start_at) > now;
            const isExpired = qrLink.end_at && new Date(qrLink.end_at) < now;
            const isActive = qrLink.is_published && !isScheduled && !isExpired;

            return (
              <Card key={qrLink.id} className={!isActive ? 'opacity-60' : ''}>
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-slate-900">{qrLink.title}</h3>
                      <div className="flex flex-col items-start space-y-1">
                        {!qrLink.is_published && (
                          <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">Piilotettu</span>
                        )}
                        {qrLink.is_published && isScheduled && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">Ajastettu</span>
                        )}
                        {qrLink.is_published && isExpired && (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Päättynyt</span>
                        )}
                        {isActive && (
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Aktiivinen</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                      <QRCodeSVG value={qrLink.url} size={64} />
                    </div>
                  </div>
                  <div className="mb-2 flex items-center truncate text-sm text-slate-500">
                    <LinkIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{qrLink.url}</span>
                  </div>
                  {qrLink.description && (
                    <p className="mb-4 line-clamp-2 flex-1 text-sm text-slate-600">{qrLink.description}</p>
                  )}
                  {(qrLink.start_at || qrLink.end_at) && (
                    <div className="mb-4 mt-2 flex items-center text-xs text-slate-500">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {qrLink.start_at ? format(new Date(qrLink.start_at), 'd.M.yyyy HH:mm', { locale: fi }) : 'Nyt'} - {qrLink.end_at ? format(new Date(qrLink.end_at), 'd.M.yyyy HH:mm', { locale: fi }) : 'Toistaiseksi'}
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`pub-${qrLink.id}`} className="sr-only">Julkaistu</Label>
                      <Switch
                        id={`pub-${qrLink.id}`}
                        checked={qrLink.is_published}
                        onCheckedChange={() => void togglePublish(qrLink.id, qrLink.is_published)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" onClick={() => void moveQrLink(qrLink.id, 'up')} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => void moveQrLink(qrLink.id, 'down')} disabled={index === qrLinks.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => openEditForm(qrLink)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => void handleDelete(qrLink.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
