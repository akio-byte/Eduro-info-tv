import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockHighlights } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { getErrorMessage, hasValidDateTimeWindow, toDateTimeInputValue, toDateTimeRange } from '../../lib/content';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Pencil, Trash2, X, Image as ImageIcon, Upload, Calendar as CalendarIcon, ArrowUp, ArrowDown, Video } from 'lucide-react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';

type Highlight = Tables<'highlights'>;

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function Highlights() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    void fetchHighlights();
  }, []);

  async function fetchHighlights() {
    setLoading(true);

    if (isMockSupabase) {
      setHighlights(mockHighlights);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching highlights:', error);
      setMessage({ type: 'error', text: getErrorMessage(error, 'Nostojen lataus epäonnistui.') });
    } else {
      setHighlights(data || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setTitle('');
    setSubtitle('');
    setBody('');
    setImageUrl('');
    setImagePath('');
    setVideoUrl('');
    setCtaLabel('');
    setCtaUrl('');
    setStartAt('');
    setEndAt('');
    setIsPublished(true);
    setEditingId(null);
    setIsFormOpen(false);
    setMessage(null);
  }

  function openEditForm(highlight: Highlight) {
    setTitle(highlight.title || '');
    setSubtitle(highlight.subtitle || '');
    setBody(highlight.body || '');
    setImageUrl(highlight.image_url || '');
    setImagePath(highlight.image_path || '');
    setVideoUrl(highlight.video_url || '');
    setCtaLabel(highlight.cta_label || '');
    setCtaUrl(highlight.cta_url || '');
    setStartAt(toDateTimeInputValue(highlight.start_at));
    setEndAt(toDateTimeInputValue(highlight.end_at));
    setIsPublished(highlight.is_published ?? true);
    setEditingId(highlight.id);
    setIsFormOpen(true);
    setMessage(null);
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    if (file.size > MAX_IMAGE_BYTES) {
      setMessage({ type: 'error', text: `Kuva on liian suuri (${(file.size / 1024 / 1024).toFixed(1)} MB). Enimmäiskoko on 2 MB.` });
      e.target.value = '';
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

    setUploading(true);
    setMessage(null);

    if (isMockSupabase) {
      setTimeout(() => {
        setImageUrl(URL.createObjectURL(file));
        setImagePath(fileName);
        setUploading(false);
        setMessage({ type: 'success', text: 'Kuva ladattu onnistuneesti (Mock).' });
      }, 500);
      return;
    }

    const { error: uploadError } = await supabase.storage
      .from('infotv-highlights')
      .upload(fileName, file, { upsert: false });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      setMessage({ type: 'error', text: getErrorMessage(uploadError, 'Kuvan lataus epäonnistui.') });
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from('infotv-highlights')
      .getPublicUrl(fileName);

    setImageUrl(data.publicUrl);
    setImagePath(fileName);
    setUploading(false);
    setMessage({ type: 'success', text: 'Kuva ladattu onnistuneesti.' });
  }

  async function removeImage() {
    if (imagePath && !isMockSupabase) {
      const { error } = await supabase.storage.from('infotv-highlights').remove([imagePath]);
      if (error) {
        setMessage({ type: 'error', text: getErrorMessage(error, 'Kuvan poisto epäonnistui.') });
        return;
      }
    }

    setImageUrl('');
    setImagePath('');
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
      subtitle: subtitle || null,
      body: body || null,
      image_url: imageUrl || null,
      image_path: imagePath || null,
      video_url: videoUrl || null,
      cta_label: ctaLabel || null,
      cta_url: ctaUrl || null,
      is_published: isPublished,
      ...toDateTimeRange(startAt, endAt),
    };

    if (isMockSupabase) {
      if (editingId) {
        setHighlights((prev) => prev.map((highlight) => (
          highlight.id === editingId ? { ...highlight, ...payload, updated_at: new Date().toISOString() } : highlight
        )));
        setMessage({ type: 'success', text: 'Nosto päivitetty (Mock).' });
      } else {
        const newHighlight: Highlight = {
          ...payload,
          id: Math.random().toString(),
          sort_order: highlights.length + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setHighlights([...highlights, newHighlight]);
        setMessage({ type: 'success', text: 'Nosto luotu (Mock).' });
      }

      resetForm();
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('highlights').update(payload).eq('id', editingId);
      if (error) {
        setMessage({ type: 'error', text: getErrorMessage(error, 'Noston päivitys epäonnistui.') });
        return;
      }

      setMessage({ type: 'success', text: 'Nosto päivitetty.' });
    } else {
      const { error } = await supabase.from('highlights').insert({ ...payload, sort_order: highlights.length + 1 });
      if (error) {
        setMessage({ type: 'error', text: getErrorMessage(error, 'Noston luonti epäonnistui.') });
        return;
      }

      setMessage({ type: 'success', text: 'Nosto luotu.' });
    }

    resetForm();
    await fetchHighlights();
  }

  async function handleDelete(id: string) {
    if (!confirm('Haluatko varmasti poistaa tämän noston?')) return;

    if (isMockSupabase) {
      setHighlights((prev) => prev.filter((highlight) => highlight.id !== id));
      setMessage({ type: 'success', text: 'Nosto poistettu (Mock).' });
      return;
    }

    const highlight = highlights.find((item) => item.id === id);
    if (highlight?.image_path) {
      const { error: storageError } = await supabase.storage.from('infotv-highlights').remove([highlight.image_path]);
      if (storageError) {
        setMessage({ type: 'error', text: getErrorMessage(storageError, 'Noston kuvan poisto epäonnistui.') });
        return;
      }
    }

    const { error } = await supabase.from('highlights').delete().eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Noston poisto epäonnistui.') });
      return;
    }

    setMessage({ type: 'success', text: 'Nosto poistettu.' });
    await fetchHighlights();
  }

  async function moveHighlight(id: string, direction: 'up' | 'down') {
    const currentIndex = highlights.findIndex((highlight) => highlight.id === id);
    if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === highlights.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentItem = highlights[currentIndex];
    const swapItem = highlights[newIndex];

    if (!currentItem || !swapItem) {
      return;
    }

    if (isMockSupabase) {
      const nextHighlights = [...highlights];
      nextHighlights[currentIndex] = { ...swapItem, sort_order: currentItem.sort_order };
      nextHighlights[newIndex] = { ...currentItem, sort_order: swapItem.sort_order };
      setHighlights(nextHighlights.sort((a, b) => a.sort_order - b.sort_order));
      return;
    }

    const [firstUpdate, secondUpdate] = await Promise.all([
      supabase.from('highlights').update({ sort_order: swapItem.sort_order }).eq('id', currentItem.id),
      supabase.from('highlights').update({ sort_order: currentItem.sort_order }).eq('id', swapItem.id),
    ]);

    if (firstUpdate.error || secondUpdate.error) {
      setMessage({
        type: 'error',
        text: getErrorMessage(firstUpdate.error || secondUpdate.error, 'Nostojen järjestyksen vaihto epäonnistui.'),
      });
      return;
    }

    await fetchHighlights();
  }

  async function togglePublish(id: string, currentStatus: boolean) {
    if (isMockSupabase) {
      setHighlights((prev) => prev.map((highlight) => (
        highlight.id === id ? { ...highlight, is_published: !currentStatus } : highlight
      )));
      return;
    }

    const { error } = await supabase.from('highlights').update({ is_published: !currentStatus }).eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Julkaisutilan vaihto epäonnistui.') });
      return;
    }

    await fetchHighlights();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nostot</h1>
          <p className="mt-2 text-slate-500">Hallitse isompia kuvallisia nostoja ja kampanjoita.</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Uusi nosto
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
            <CardTitle>{editingId ? 'Muokkaa nostoa' : 'Luo uusi nosto'}</CardTitle>
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
                  <Label htmlFor="subtitle">Alaotsikko (valinnainen)</Label>
                  <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Sisältö (valinnainen)</Label>
                <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <Label>Kuva</Label>

                {imageUrl ? (
                  <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-md border border-slate-200">
                    <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={() => void removeImage()}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex w-full max-w-md items-center justify-center">
                    <label htmlFor="dropzone-file" className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100">
                      <div className="flex flex-col items-center justify-center pb-6 pt-5">
                        <Upload className="mb-4 h-8 w-8 text-slate-500" />
                        <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Klikkaa ladataksesi</span> tai raahaa kuva tähän</p>
                        <p className="text-xs text-slate-500">PNG, JPG tai WEBP (max. 2 Mt)</p>
                      </div>
                      <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading || !!videoUrl} />
                    </label>
                  </div>
                )}

                {uploading && <p className="text-sm text-slate-500">Ladataan kuvaa...</p>}

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Tai syötä kuvan URL (valinnainen)</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://esimerkki.fi/kuva.jpg"
                    disabled={!!imagePath || !!videoUrl}
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <Label htmlFor="videoUrl" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Videosilmukka (valinnainen, korvaa kuvan)
                </Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://esimerkki.fi/video.mp4"
                  disabled={!!imageUrl}
                />
                <p className="text-xs text-slate-500">Suositellaan lyhyttä MP4-videota. Video toistetaan äänettömästi silmukassa.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ctaLabel">Painikkeen teksti (valinnainen)</Label>
                  <Input id="ctaLabel" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Lue lisää" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaUrl">Painikkeen URL (valinnainen)</Label>
                  <Input id="ctaUrl" type="url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://..." />
                </div>
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
                <Button type="submit" disabled={uploading}>Tallenna</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="text-slate-500">Ladataan...</div>
        ) : highlights.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
              <p>Ei nostoja. Luo ensimmäinen nosto ylhäältä.</p>
            </CardContent>
          </Card>
        ) : (
          highlights.map((highlight, index) => {
            const now = new Date();
            const isScheduled = highlight.start_at && new Date(highlight.start_at) > now;
            const isExpired = highlight.end_at && new Date(highlight.end_at) < now;
            const isActive = highlight.is_published && !isScheduled && !isExpired;

            return (
              <Card key={highlight.id} className={`flex flex-col overflow-hidden ${!isActive ? 'opacity-60' : ''}`}>
                {highlight.video_url ? (
                  <div className="flex aspect-video w-full items-center justify-center overflow-hidden bg-slate-900">
                    <Video className="h-10 w-10 text-slate-500" />
                    <span className="ml-3 text-sm text-slate-400">Video</span>
                  </div>
                ) : highlight.image_url ? (
                  <div className="aspect-video w-full overflow-hidden bg-slate-100">
                    <img src={highlight.image_url} alt={highlight.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-slate-100 text-slate-400">
                    <ImageIcon className="h-12 w-12 opacity-20" />
                  </div>
                )}
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{highlight.title}</h3>
                        {highlight.subtitle && <p className="text-sm font-medium text-slate-500">{highlight.subtitle}</p>}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {!highlight.is_published && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">Piilotettu</span>
                        )}
                        {highlight.is_published && isScheduled && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">Ajastettu</span>
                        )}
                        {highlight.is_published && isExpired && (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Päättynyt</span>
                        )}
                        {isActive && (
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Aktiivinen</span>
                        )}
                      </div>
                    </div>
                    {highlight.body && <p className="line-clamp-3 text-sm text-slate-600">{highlight.body}</p>}
                    {(highlight.start_at || highlight.end_at) && (
                      <div className="mt-2 flex items-center text-xs text-slate-500">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {highlight.start_at ? format(new Date(highlight.start_at), 'd.M.yyyy HH:mm', { locale: fi }) : 'Nyt'} - {highlight.end_at ? format(new Date(highlight.end_at), 'd.M.yyyy HH:mm', { locale: fi }) : 'Toistaiseksi'}
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`pub-${highlight.id}`} className="sr-only">Julkaistu</Label>
                      <Switch
                        id={`pub-${highlight.id}`}
                        checked={highlight.is_published}
                        onCheckedChange={() => void togglePublish(highlight.id, highlight.is_published)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" onClick={() => void moveHighlight(highlight.id, 'up')} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => void moveHighlight(highlight.id, 'down')} disabled={index === highlights.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => openEditForm(highlight)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => void handleDelete(highlight.id)}>
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
