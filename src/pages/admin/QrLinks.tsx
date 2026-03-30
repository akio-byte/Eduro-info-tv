import { useState, useEffect, FormEvent } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockQrLinks } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Pencil, Trash2, X, Link as LinkIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

type QrLink = Tables<'qr_links'>;

export function QrLinks() {
  const [qrLinks, setQrLinks] = useState<QrLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    fetchQrLinks();
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
    } else {
      setQrLinks(data || []);
    }
    setLoading(false);
  }

  function resetForm() {
    setTitle('');
    setUrl('');
    setDescription('');
    setIsPublished(true);
    setEditingId(null);
    setIsFormOpen(false);
  }

  function openEditForm(qrLink: QrLink) {
    setTitle(qrLink.title || '');
    setUrl(qrLink.url || '');
    setDescription(qrLink.description || '');
    setIsPublished(qrLink.is_published ?? true);
    setEditingId(qrLink.id);
    setIsFormOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    const payload = {
      title,
      url,
      description: description || null,
      is_published: isPublished,
    };

    if (isMockSupabase) {
      if (editingId) {
        setQrLinks(prev => prev.map(q => q.id === editingId ? { ...q, ...payload, updated_at: new Date().toISOString() } : q));
      } else {
        const newQrLink: QrLink = {
          ...payload,
          id: Math.random().toString(),
          sort_order: qrLinks.length + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setQrLinks([...qrLinks, newQrLink]);
      }
      resetForm();
      return;
    }

    if (editingId) {
      await supabase.from('qr_links').update(payload).eq('id', editingId);
    } else {
      await supabase.from('qr_links').insert({ ...payload, sort_order: qrLinks.length + 1 });
    }
    
    resetForm();
    fetchQrLinks();
  }

  async function handleDelete(id: string) {
    if (!confirm('Haluatko varmasti poistaa tämän QR-linkin?')) return;

    if (isMockSupabase) {
      setQrLinks(prev => prev.filter(q => q.id !== id));
      return;
    }

    await supabase.from('qr_links').delete().eq('id', id);
    fetchQrLinks();
  }

  async function togglePublish(id: string, currentStatus: boolean) {
    if (isMockSupabase) {
      setQrLinks(prev => prev.map(q => q.id === id ? { ...q, is_published: !currentStatus } : q));
      return;
    }

    await supabase.from('qr_links').update({ is_published: !currentStatus }).eq('id', id);
    fetchQrLinks();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">QR-linkit</h1>
          <p className="text-slate-500 mt-2">Hallitse näytöllä näkyviä QR-koodeja ja pikalinkkejä.</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Uusi linkki
          </Button>
        )}
      </div>

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
                  <Label htmlFor="url">URL-osoite</Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://eduro.fi/..."
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Kuvaus (valinnainen)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
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
          qrLinks.map((qrLink) => (
            <Card key={qrLink.id} className={!qrLink.is_published ? 'opacity-60' : ''}>
              <CardContent className="flex flex-col p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-900">{qrLink.title}</h3>
                    {!qrLink.is_published && (
                      <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">Piilotettu</span>
                    )}
                  </div>
                  <div className="rounded-lg bg-white p-2 shadow-sm border border-slate-100">
                    <QRCodeSVG value={qrLink.url} size={64} />
                  </div>
                </div>
                <div className="flex items-center text-sm text-slate-500 mb-2 truncate">
                  <LinkIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{qrLink.url}</span>
                </div>
                {qrLink.description && (
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">{qrLink.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`pub-${qrLink.id}`} className="sr-only">Julkaistu</Label>
                    <Switch
                      id={`pub-${qrLink.id}`}
                      checked={qrLink.is_published}
                      onCheckedChange={() => togglePublish(qrLink.id, qrLink.is_published)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditForm(qrLink)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(qrLink.id)}>
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
