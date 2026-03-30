import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockHighlights } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Pencil, Trash2, X, Image as ImageIcon, Upload, Calendar as CalendarIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
  fromLocalDateTimeInputValue,
  getAdminStatusBadge,
  getWindowStatus,
  toLocalDateTimeInputValue,
} from '../../lib/content-visibility';

type Highlight = Tables<'highlights'>;

function createStoragePath(file: File) {
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  return `${Math.random().toString(36).slice(2, 10)}_${Date.now()}.${extension}`;
}

export function Highlights() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [localImagePreviewUrl, setLocalImagePreviewUrl] = useState<string | null>(null);
  const [originalImagePath, setOriginalImagePath] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    void fetchHighlights();
  }, []);

  useEffect(() => {
    return () => {
      if (localImagePreviewUrl) {
        URL.revokeObjectURL(localImagePreviewUrl);
      }
    };
  }, [localImagePreviewUrl]);

  async function fetchHighlights() {
    setLoading(true);

    if (isMockSupabase) {
      setHighlights(mockHighlights);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from('highlights').select('*').order('sort_order', { ascending: true });
    if (error) {
      console.error('Error fetching highlights:', error);
      setMessage({ type: 'error', text: 'Nostojen lataus epäonnistui.' });
    } else {
      setHighlights(data || []);
    }

    setLoading(false);
  }

  function resetLocalPreview() {
    if (localImagePreviewUrl) {
      URL.revokeObjectURL(localImagePreviewUrl);
    }

    setLocalImagePreviewUrl(null);
    setSelectedImageFile(null);
  }

  function resetForm(options?: { preserveMessage?: boolean }) {
    resetLocalPreview();
    setTitle('');
    setSubtitle('');
    setBody('');
    setImageUrl('');
    setImagePath('');
    setOriginalImagePath(null);
    setCtaLabel('');
    setCtaUrl('');
    setStartAt('');
    setEndAt('');
    setIsPublished(true);
    setEditingId(null);
    setIsFormOpen(false);

    if (!options?.preserveMessage) {
      setMessage(null);
    }
  }

  function openEditForm(highlight: Highlight) {
    resetLocalPreview();
    setTitle(highlight.title || '');
    setSubtitle(highlight.subtitle || '');
    setBody(highlight.body || '');
    setImageUrl(highlight.image_url || '');
    setImagePath(highlight.image_path || '');
    setOriginalImagePath(highlight.image_path || null);
    setCtaLabel(highlight.cta_label || '');
    setCtaUrl(highlight.cta_url || '');
    setStartAt(toLocalDateTimeInputValue(highlight.start_at));
    setEndAt(toLocalDateTimeInputValue(highlight.end_at));
    setIsPublished(highlight.is_published ?? true);
    setEditingId(highlight.id);
    setIsFormOpen(true);
    setMessage(null);
  }

  function handleImageSelection(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    resetLocalPreview();
    setLocalImagePreviewUrl(URL.createObjectURL(file));
    setSelectedImageFile(file);
    setImageUrl('');
    setImagePath('');
    setMessage(null);
    e.target.value = '';
  }

  function removeImage() {
    resetLocalPreview();
    setImageUrl('');
    setImagePath('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    let uploadedImagePath: string | null = null;
    let uploadedImageUrl: string | null = null;

    try {
      if (!isMockSupabase && selectedImageFile) {
        setUploading(true);
        uploadedImagePath = createStoragePath(selectedImageFile);

        const uploadResult = await supabase.storage.from('infotv-highlights').upload(uploadedImagePath, selectedImageFile);
        if (uploadResult.error) {
          setMessage({ type: 'error', text: 'Kuvan lataus epäonnistui.' });
          return;
        }

        const { data } = supabase.storage.from('infotv-highlights').getPublicUrl(uploadedImagePath);
        uploadedImageUrl = data.publicUrl;
      }

      const resolvedImageUrl = isMockSupabase && selectedImageFile
        ? URL.createObjectURL(selectedImageFile)
        : uploadedImageUrl || imageUrl || null;

      const resolvedImagePath = uploadedImagePath || (selectedImageFile ? null : imagePath || null);

      const payload = {
        title,
        subtitle: subtitle || null,
        body: body || null,
        image_url: resolvedImageUrl,
        image_path: resolvedImagePath,
        cta_label: ctaLabel || null,
        cta_url: ctaUrl || null,
        start_at: fromLocalDateTimeInputValue(startAt),
        end_at: fromLocalDateTimeInputValue(endAt),
        is_published: isPublished,
      };

      const successMessage = editingId ? 'Nosto päivitetty.' : 'Nosto luotu.';

      if (isMockSupabase) {
        if (editingId) {
          setHighlights((prev) =>
            prev.map((item) =>
              item.id === editingId ? { ...item, ...payload, updated_at: new Date().toISOString() } : item,
            ),
          );
        } else {
          const newHighlight: Highlight = {
            ...payload,
            id: Math.random().toString(),
            sort_order: highlights.length + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setHighlights((prev) => [...prev, newHighlight]);
        }

        resetForm({ preserveMessage: true });
        setMessage({ type: 'success', text: `${successMessage} (Mock).` });
        return;
      }

      const result = editingId
        ? await supabase.from('highlights').update(payload).eq('id', editingId)
        : await supabase.from('highlights').insert({ ...payload, sort_order: highlights.length + 1 });

      if (result.error) {
        if (uploadedImagePath) {
          const cleanupResult = await supabase.storage.from('infotv-highlights').remove([uploadedImagePath]);
          if (cleanupResult.error) {
            console.error('Error cleaning up failed highlight upload:', cleanupResult.error);
          }
        }

        setMessage({ type: 'error', text: editingId ? 'Noston päivitys epäonnistui.' : 'Noston luonti epäonnistui.' });
        return;
      }

      if (originalImagePath && originalImagePath !== resolvedImagePath) {
        const removeResult = await supabase.storage.from('infotv-highlights').remove([originalImagePath]);
        if (removeResult.error) {
          console.error('Error removing replaced highlight image:', removeResult.error);
        }
      }

      resetForm({ preserveMessage: true });
      setMessage({ type: 'success', text: successMessage });
      await fetchHighlights();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Haluatko varmasti poistaa tämän noston?')) {
      return;
    }

    const highlight = highlights.find((item) => item.id === id);

    if (isMockSupabase) {
      setHighlights((prev) => prev.filter((item) => item.id !== id));
      setMessage({ type: 'success', text: 'Nosto poistettu (Mock).' });
      return;
    }

    const { error } = await supabase.from('highlights').delete().eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: 'Noston poisto epäonnistui.' });
      return;
    }

    if (highlight?.image_path) {
      const removeResult = await supabase.storage.from('infotv-highlights').remove([highlight.image_path]);
      if (removeResult.error) {
        console.error('Error deleting highlight image after row deletion:', removeResult.error);
      }
    }

    setMessage({ type: 'success', text: 'Nosto poistettu.' });
    await fetchHighlights();
  }

  async function moveHighlight(id: string, direction: 'up' | 'down') {
    const currentIndex = highlights.findIndex((item) => item.id === id);
    if (
      currentIndex === -1 ||
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === highlights.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentItem = highlights[currentIndex];
    const swapItem = highlights[newIndex];

    if (isMockSupabase) {
      const reordered = [...highlights];
      reordered[currentIndex] = { ...swapItem, sort_order: currentItem.sort_order };
      reordered[newIndex] = { ...currentItem, sort_order: swapItem.sort_order };
      setHighlights(reordered.sort((left, right) => left.sort_order - right.sort_order));
      return;
    }

    const firstUpdate = await supabase.from('highlights').update({ sort_order: swapItem.sort_order }).eq('id', currentItem.id);
    if (firstUpdate.error) {
      setMessage({ type: 'error', text: 'Nostojen järjestyksen päivitys epäonnistui.' });
      return;
    }

    const secondUpdate = await supabase.from('highlights').update({ sort_order: currentItem.sort_order }).eq('id', swapItem.id);
    if (secondUpdate.error) {
      setMessage({ type: 'error', text: 'Nostojen järjestyksen päivitys epäonnistui.' });
      return;
    }

    await fetchHighlights();
  }

  async function togglePublish(id: string, currentStatus: boolean) {
    if (isMockSupabase) {
      setHighlights((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_published: !currentStatus } : item)),
      );
      return;
    }

    const { error } = await supabase.from('highlights').update({ is_published: !currentStatus }).eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: 'Julkaisutilan päivitys epäonnistui.' });
      return;
    }

    await fetchHighlights();
  }

  const formPreviewSrc = localImagePreviewUrl || imageUrl;
  const formPreviewKey = `${editingId || 'new'}:${formPreviewSrc || 'empty'}`;
  const formHasVisibleImage = Boolean(formPreviewSrc) && !brokenImages[formPreviewKey];

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
            <Button variant="ghost" size="icon" onClick={() => resetForm()}>
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

                {formHasVisibleImage ? (
                  <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-md border border-slate-200">
                    <img
                      src={formPreviewSrc || undefined}
                      alt="Esikatselu"
                      className="h-full w-full object-cover"
                      onError={() => setBrokenImages((prev) => ({ ...prev, [formPreviewKey]: true }))}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex w-full max-w-md items-center justify-center">
                    <label
                      htmlFor="dropzone-file"
                      className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100"
                    >
                      <div className="flex flex-col items-center justify-center pb-6 pt-5">
                        <Upload className="mb-4 h-8 w-8 text-slate-500" />
                        <p className="mb-2 text-sm text-slate-500">
                          <span className="font-semibold">Klikkaa ladataksesi</span> tai raahaa kuva tähän
                        </p>
                        <p className="text-xs text-slate-500">PNG, JPG tai WEBP (MAX. 2MB)</p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelection}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Tai syötä kuvan URL (valinnainen)</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      resetLocalPreview();
                      setImageUrl(e.target.value);
                      setImagePath('');
                    }}
                    placeholder="https://esimerkki.fi/kuva.jpg"
                  />
                </div>
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
                <Button type="button" variant="outline" onClick={() => resetForm()}>
                  Peruuta
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Tallennetaan kuvaa...' : 'Tallenna'}
                </Button>
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
            const status = getWindowStatus(highlight);
            const statusBadge = getAdminStatusBadge(status);
            const cardImageKey = `${highlight.id}:${highlight.image_url || 'empty'}`;
            const hasCardImage = Boolean(highlight.image_url) && !brokenImages[cardImageKey];

            return (
              <Card key={highlight.id} className={`flex flex-col overflow-hidden ${status === 'active' ? '' : 'opacity-60'}`}>
                {hasCardImage ? (
                  <div className="aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={highlight.image_url || undefined}
                      alt={highlight.title}
                      className="h-full w-full object-cover"
                      onError={() => setBrokenImages((prev) => ({ ...prev, [cardImageKey]: true }))}
                    />
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
                        <span className={statusBadge.className}>{statusBadge.label}</span>
                      </div>
                    </div>
                    {highlight.body && <p className="line-clamp-3 text-sm text-slate-600">{highlight.body}</p>}
                    {(highlight.start_at || highlight.end_at) && (
                      <div className="mt-2 flex items-center text-xs text-slate-500">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {highlight.start_at ? format(new Date(highlight.start_at), 'd.M.yyyy HH:mm', { locale: fi }) : 'Nyt'} -
                        {highlight.end_at ? ` ${format(new Date(highlight.end_at), 'd.M.yyyy HH:mm', { locale: fi })}` : ' Toistaiseksi'}
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`pub-${highlight.id}`} className="sr-only">
                        Julkaistu
                      </Label>
                      <Switch
                        id={`pub-${highlight.id}`}
                        checked={highlight.is_published}
                        onCheckedChange={() => void togglePublish(highlight.id, highlight.is_published)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void moveHighlight(highlight.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void moveHighlight(highlight.id, 'down')}
                        disabled={index === highlights.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => openEditForm(highlight)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => void handleDelete(highlight.id)}
                      >
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
