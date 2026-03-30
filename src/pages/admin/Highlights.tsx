import { useState, useEffect, FormEvent } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockHighlights } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from 'lucide-react';

type Highlight = Tables<'highlights'>;

export function Highlights() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    fetchHighlights();
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
    setCtaLabel('');
    setCtaUrl('');
    setIsPublished(true);
    setEditingId(null);
    setIsFormOpen(false);
  }

  function openEditForm(highlight: Highlight) {
    setTitle(highlight.title || '');
    setSubtitle(highlight.subtitle || '');
    setBody(highlight.body || '');
    setImageUrl(highlight.image_url || '');
    setCtaLabel(highlight.cta_label || '');
    setCtaUrl(highlight.cta_url || '');
    setIsPublished(highlight.is_published ?? true);
    setEditingId(highlight.id);
    setIsFormOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    const payload = {
      title,
      subtitle: subtitle || null,
      body: body || null,
      image_url: imageUrl || null,
      cta_label: ctaLabel || null,
      cta_url: ctaUrl || null,
      is_published: isPublished,
    };

    if (isMockSupabase) {
      if (editingId) {
        setHighlights(prev => prev.map(h => h.id === editingId ? { ...h, ...payload, updated_at: new Date().toISOString() } : h));
      } else {
        const newHighlight: Highlight = {
          ...payload,
          id: Math.random().toString(),
          sort_order: highlights.length + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setHighlights([...highlights, newHighlight]);
      }
      resetForm();
      return;
    }

    if (editingId) {
      await supabase.from('highlights').update(payload).eq('id', editingId);
    } else {
      await supabase.from('highlights').insert({ ...payload, sort_order: highlights.length + 1 });
    }
    
    resetForm();
    fetchHighlights();
  }

  async function handleDelete(id: string) {
    if (!confirm('Haluatko varmasti poistaa tämän noston?')) return;

    if (isMockSupabase) {
      setHighlights(prev => prev.filter(h => h.id !== id));
      return;
    }

    await supabase.from('highlights').delete().eq('id', id);
    fetchHighlights();
  }

  async function togglePublish(id: string, currentStatus: boolean) {
    if (isMockSupabase) {
      setHighlights(prev => prev.map(h => h.id === id ? { ...h, is_published: !currentStatus } : h));
      return;
    }

    await supabase.from('highlights').update({ is_published: !currentStatus }).eq('id', id);
    fetchHighlights();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nostot</h1>
          <p className="text-slate-500 mt-2">Hallitse isompia kuvallisia nostoja ja kampanjoita.</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Uusi nosto
          </Button>
        )}
      </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Otsikko</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Alaotsikko (valinnainen)</Label>
                  <Input
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Sisältö (valinnainen)</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Kuvan URL (valinnainen)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://esimerkki.fi/kuva.jpg"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ctaLabel">Painikkeen teksti (valinnainen)</Label>
                  <Input
                    id="ctaLabel"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="Lue lisää"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaUrl">Painikkeen URL (valinnainen)</Label>
                  <Input
                    id="ctaUrl"
                    type="url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label htmlFor="published">Julkaistu näytöllä</Label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>Peruuta</Button>
                <Button type="submit">Tallenna</Button>
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
          highlights.map((highlight) => (
            <Card key={highlight.id} className={`overflow-hidden flex flex-col ${!highlight.is_published ? 'opacity-60' : ''}`}>
              {highlight.image_url ? (
                <div className="aspect-video w-full overflow-hidden bg-slate-100">
                  <img src={highlight.image_url} alt={highlight.title} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video w-full flex items-center justify-center bg-slate-100 text-slate-400">
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
                    {!highlight.is_published && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">Piilotettu</span>
                    )}
                  </div>
                  {highlight.body && <p className="text-sm text-slate-600 line-clamp-3">{highlight.body}</p>}
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`pub-${highlight.id}`} className="sr-only">Julkaistu</Label>
                    <Switch
                      id={`pub-${highlight.id}`}
                      checked={highlight.is_published}
                      onCheckedChange={() => togglePublish(highlight.id, highlight.is_published)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditForm(highlight)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(highlight.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
