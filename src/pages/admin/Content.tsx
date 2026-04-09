import React, { useState, useEffect, FormEvent } from 'react';
import { db, isMockFirebase } from '../../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/Switch';
import { AIAssistant } from '../../components/ui/AIAssistant';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  Image as ImageIcon, 
  Megaphone, 
  QrCode,
  Clock,
  CheckCircle2,
  Circle,
  Archive,
  Trash2,
  Eye,
  Edit3,
  ExternalLink,
  Upload,
  Loader2,
  AlertTriangle,
  X,
  Rss
} from 'lucide-react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import type { ContentItem, ContentType } from '../../types/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../lib/firebase';

export function Content() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'active' | 'archived'>('active');
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ContentItem> | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const { user, orgId } = useAuth();

  useEffect(() => {
    if (!orgId) return;

    if (isMockFirebase) {
      setItems([
        {
          id: '1',
          org_id: orgId,
          type: 'announcement',
          title: 'Tervetuloa Eduroon!',
          body: 'Tämä on esimerkkitiedote.',
          media_url: null,
          media_type: 'none',
          event_date: null,
          start_time: null,
          end_time: null,
          location: null,
          qr_url: null,
          publish_start: null,
          publish_end: null,
          duration_seconds: 15,
          is_published: true,
          is_archived: false,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'mock',
          updated_by: 'mock'
        }
      ]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'content_items'),
      where('org_id', '==', orgId),
      where('is_archived', '==', filterStatus === 'archived'),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
        updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || doc.data().updated_at,
        publish_start: doc.data().publish_start?.toDate?.()?.toISOString() || doc.data().publish_start,
        publish_end: doc.data().publish_end?.toDate?.()?.toISOString() || doc.data().publish_end,
      } as ContentItem));
      setItems(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'content_items'));

    return () => unsubscribe();
  }, [orgId, filterStatus]);

  const handleCreate = () => {
    setCurrentItem({
      type: 'announcement',
      title: '',
      body: '',
      media_type: 'none',
      duration_seconds: 15,
      is_published: true,
      is_archived: false,
      sort_order: 0
    });
    setIsEditing(true);
  };

  const handleEdit = (item: ContentItem) => {
    setCurrentItem(item);
    setIsEditing(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;

    setUploading(true);
    setMessage(null);

    if (isMockFirebase) {
      // Mock upload delay
      setTimeout(() => {
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        const mockUrl = mediaType === 'video' 
          ? 'https://www.w3schools.com/html/mov_bbb.mp4' 
          : `https://picsum.photos/seed/${Date.now()}/1920/1080`;
        
        setCurrentItem(prev => ({ 
          ...prev, 
          media_url: mockUrl, 
          media_type: mediaType 
        }));
        setUploading(false);
        setMessage({ type: 'success', text: 'Tiedosto "ladattu" onnistuneesti (Mock-tila).' });
      }, 1500);
      return;
    }

    try {
      const fileRef = ref(storage, `content/${orgId}/${Date.now()}_${file.name}`);
      
      // Use a timeout to prevent indefinite hanging
      const uploadPromise = uploadBytes(fileRef, file);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Lataus aikakatkaistiin. Tarkista yhteys ja Firebase Storage -asetukset.')), 30000)
      );

      await Promise.race([uploadPromise, timeoutPromise]);
      const url = await getDownloadURL(fileRef);
      
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      setCurrentItem(prev => ({ 
        ...prev, 
        media_url: url, 
        media_type: mediaType 
      }));
      setMessage({ type: 'success', text: 'Tiedosto ladattu onnistuneesti.' });
    } catch (error: any) {
      console.error('Upload error:', error);
      let errorText = 'Tiedoston lataus epäonnistui.';
      
      if (error.code === 'storage/unauthorized') {
        errorText = 'Ei oikeuksia tallennustilaan. Varmista, että Storage on otettu käyttöön Firebase-konsolissa.';
      } else if (error.message) {
        errorText = error.message;
      }
      
      setMessage({ type: 'error', text: errorText });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentItem || !user || !orgId) return;

    // Clean up data for Firestore
    const { id, created_at, updated_at, ...rest } = currentItem;
    
    const data: Partial<ContentItem> = {
      ...rest,
      org_id: orgId,
      updated_at: serverTimestamp() as any,
      updated_by: user.uid,
      publish_start: rest.publish_start ? Timestamp.fromDate(new Date(rest.publish_start as string)) : null,
      publish_end: rest.publish_end ? Timestamp.fromDate(new Date(rest.publish_end as string)) : null,
    };

    // Ensure numeric fields are numbers
    if (data.duration_seconds) data.duration_seconds = parseInt(String(data.duration_seconds));
    if (data.sort_order) data.sort_order = parseInt(String(data.sort_order));

    if (isMockFirebase) {
      if (id) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, ...currentItem } as ContentItem : i));
      } else {
        setItems(prev => [{ ...currentItem, id: Math.random().toString(), created_at: new Date().toISOString() } as ContentItem, ...prev]);
      }
      setIsEditing(false);
      return;
    }

    try {
      if (id) {
        await updateDoc(doc(db, 'content_items', id), data);
        setMessage({ type: 'success', text: 'Julkaisu päivitetty.' });
      } else {
        await addDoc(collection(db, 'content_items'), {
          ...data,
          created_at: serverTimestamp(),
          created_by: user.uid,
        });
        setMessage({ type: 'success', text: 'Uusi julkaisu luotu.' });
      }
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Tallennus epäonnistui.' });
      handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, 'content_items');
    }
  };

  const handleDelete = async (id: string) => {
    if (isMockFirebase) {
      setItems(prev => prev.filter(i => i.id !== id));
      setDeleteConfirmId(null);
      return;
    }

    try {
      const itemToDelete = items.find(i => i.id === id);
      if (itemToDelete?.media_url && itemToDelete.media_url.includes('firebasestorage.googleapis.com')) {
        try {
          const fileRef = ref(storage, itemToDelete.media_url);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.error('Virhe poistettaessa mediatiedostoa:', storageError);
        }
      }

      await deleteDoc(doc(db, 'content_items', id));
      setMessage({ type: 'success', text: 'Julkaisu poistettu.' });
      setDeleteConfirmId(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Poisto epäonnistui.' });
      handleFirestoreError(error, OperationType.DELETE, `content_items/${id}`);
    }
  };

  const handleArchive = async (id: string) => {
    if (isMockFirebase) {
      setItems(prev => prev.filter(i => i.id !== id));
      return;
    }

    try {
      await updateDoc(doc(db, 'content_items', id), {
        is_archived: true,
        is_published: false,
        updated_at: serverTimestamp()
      });
      setMessage({ type: 'success', text: 'Julkaisu arkistoitu.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Arkistointi epäonnistui.' });
      handleFirestoreError(error, OperationType.UPDATE, `content_items/${id}`);
    }
  };

  const handleRestore = async (id: string) => {
    if (isMockFirebase) {
      setItems(prev => prev.filter(i => i.id !== id));
      return;
    }

    try {
      await updateDoc(doc(db, 'content_items', id), {
        is_archived: false,
        is_published: false,
        updated_at: serverTimestamp()
      });
      setMessage({ type: 'success', text: 'Julkaisu palautettu arkistosta.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Palautus epäonnistui.' });
      handleFirestoreError(error, OperationType.UPDATE, `content_items/${id}`);
    }
  };

  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (item.body?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [items, searchTerm, filterType]);

  if (isEditing && currentItem) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {currentItem.id ? 'Muokkaa julkaisua' : 'Uusi julkaisu'}
          </h1>
          <Button variant="ghost" onClick={() => setIsEditing(false)}>Peruuta</Button>
        </div>

        {message && (
          <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Julkaisutyyppi</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'announcement', label: 'Tiedote', icon: Megaphone },
                      { id: 'event', label: 'Tapahtuma', icon: Calendar },
                      { id: 'media', label: 'Media', icon: ImageIcon },
                      { id: 'qr', label: 'QR-linkki', icon: QrCode },
                      { id: 'mixed', label: 'Yhdistelmä', icon: Filter },
                      { id: 'rss', label: 'RSS-syöte', icon: Rss },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          const updates: any = { type: t.id as ContentType };
                          if ((t.id === 'media' || t.id === 'mixed') && currentItem.media_type === 'none') {
                            updates.media_type = 'image';
                          }
                          setCurrentItem({ ...currentItem, ...updates });
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                          currentItem.type === t.id 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
                        }`}
                      >
                        <t.icon className="h-4 w-4" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Otsikko</Label>
                  <div className="relative">
                    <Input
                      id="title"
                      value={currentItem.title}
                      onChange={(e) => setCurrentItem({ ...currentItem, title: e.target.value })}
                      placeholder="Anna julkaisulle selkeä otsikko"
                      required
                      className="pr-10"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <AIAssistant 
                        onAccept={(val) => setCurrentItem({ ...currentItem, title: val })}
                        currentText={currentItem.body || ''}
                        allowedActions={['SUGGEST_TITLES']}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {(currentItem.type === 'announcement' || currentItem.type === 'mixed' || currentItem.type === 'event') && (
                <div className="space-y-2">
                  <Label htmlFor="body">Sisältöteksti</Label>
                  <div className="relative">
                    <Textarea
                      id="body"
                      value={currentItem.body || ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, body: e.target.value })}
                      placeholder="Kirjoita julkaisun sisältö tähän..."
                      rows={6}
                      className="pr-10"
                    />
                    <div className="absolute right-2 top-4">
                      <AIAssistant 
                        onAccept={(val) => setCurrentItem({ ...currentItem, body: val })}
                        currentText={currentItem.body || ''}
                        allowedActions={['SUMMARIZE', 'REWRITE_TONE', 'SHORTEN']}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentItem.type === 'event' && (
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Päivämäärä</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={currentItem.event_date || ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, event_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Alkaa klo</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={currentItem.start_time || ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Paikka</Label>
                    <Input
                      id="location"
                      value={currentItem.location || ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, location: e.target.value })}
                      placeholder="Esim. Auditorio"
                    />
                  </div>
                </div>
              )}

              {/* Media Settings - Show for all types now to be more flexible */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-900 font-semibold">Media-asetukset</Label>
                    <p className="text-xs text-slate-500">Lisää kuva tai video julkaisuun</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant={currentItem.media_type === 'image' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentItem({ ...currentItem, media_type: 'image' })}
                    >
                      Kuva
                    </Button>
                    <Button 
                      type="button" 
                      variant={currentItem.media_type === 'video' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentItem({ ...currentItem, media_type: 'video' })}
                    >
                      Video
                    </Button>
                    {currentItem.media_url && (
                      <Button 
                        type="button" 
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setCurrentItem({ ...currentItem, media_url: null, media_type: 'none' })}
                      >
                        Poista media
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {currentItem.media_url ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      {currentItem.media_type === 'video' ? (
                        <video src={currentItem.media_url} className="w-full h-full object-cover" controls />
                      ) : (
                        <img src={currentItem.media_url} alt="Esikatselu" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                        onClick={() => setCurrentItem({ ...currentItem, media_url: null, media_type: 'none' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-24 border-dashed border-2 flex flex-col gap-2 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                          ) : (
                            <Upload className="h-6 w-6 text-slate-400" />
                          )}
                          <span className="text-xs text-slate-500">
                            {uploading ? 'Ladataan...' : 'Klikkaa valitaksesi kuva tai video'}
                          </span>
                        </Button>
                        <input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                        />
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-50 px-2 text-slate-500">tai käytä URL-osoitetta</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="media_url">Median URL-osoite</Label>
                    <Input
                      id="media_url"
                      value={currentItem.media_url || ''}
                      onChange={(e) => {
                        const url = e.target.value;
                        let type = currentItem.media_type;
                        if (url && type === 'none') {
                          type = url.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image';
                        }
                        setCurrentItem({ ...currentItem, media_url: url, media_type: type });
                      }}
                      placeholder="https://esimerkki.fi/kuva.jpg"
                    />
                  </div>
                </div>
              </div>

              {currentItem.type === 'qr' && (
                <div className="space-y-2">
                  <Label htmlFor="qr_url">QR-koodin linkki</Label>
                  <Input
                    id="qr_url"
                    value={currentItem.qr_url || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem, qr_url: e.target.value })}
                    placeholder="https://eduro.fi/lue-lisaa"
                  />
                </div>
              )}

              {currentItem.type === 'rss' && (
                <div className="space-y-2">
                  <Label htmlFor="rss_url">RSS-syötteen URL</Label>
                  <Input
                    id="rss_url"
                    value={currentItem.rss_url || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem, rss_url: e.target.value })}
                    placeholder="https://yle.fi/rss/t/18-139752/fi"
                  />
                  <p className="text-xs text-slate-500">
                    Syötteen sisältö haetaan automaattisesti ja näytetään InfoTV:ssä.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Julkaisuasetukset</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Julkaistu</Label>
                      <p className="text-xs text-slate-500">Näkyykö julkaisu näytöllä heti</p>
                    </div>
                    <Switch
                      checked={currentItem.is_published}
                      onCheckedChange={(val) => setCurrentItem({ ...currentItem, is_published: val })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Näyttöaika (sekuntia)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="5"
                      max="60"
                      value={currentItem.duration_seconds}
                      onChange={(e) => setCurrentItem({ ...currentItem, duration_seconds: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="publish_start">Ajastettu alkamisaika (valinnainen)</Label>
                    <Input
                      id="publish_start"
                      type="datetime-local"
                      value={currentItem.publish_start ? format(new Date(currentItem.publish_start as string), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, publish_start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publish_end">Ajastettu päättymisaika (valinnainen)</Label>
                    <Input
                      id="publish_end"
                      type="datetime-local"
                      value={currentItem.publish_end ? format(new Date(currentItem.publish_end as string), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, publish_end: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Peruuta</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">Tallenna julkaisu</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Julkaisut</h1>
          <p className="text-slate-500 mt-2">Hallitse InfoTV:n sisältöä yhdestä paikasta.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Button 
              variant={filterStatus === 'active' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setFilterStatus('active')}
              className="h-8"
            >
              Aktiiviset
            </Button>
            <Button 
              variant={filterStatus === 'archived' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setFilterStatus('archived')}
              className="h-8"
            >
              Arkisto
            </Button>
          </div>
          <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus className="h-5 w-5" />
            Uusi julkaisu
          </Button>
        </div>
      </div>

      {message && (
        <div 
          role="alert" 
          aria-live="polite"
          className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
        >
          {message.text}
        </div>
      )}

      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Hae julkaisuja..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Kaikki' },
              { id: 'announcement', label: 'Tiedotteet' },
              { id: 'event', label: 'Tapahtumat' },
              { id: 'media', label: 'Media' },
              { id: 'qr', label: 'Linkit' },
            ].map((t) => (
              <Button
                key={t.id}
                variant={filterType === t.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(t.id as any)}
                className="rounded-full"
              >
                {t.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col h-[400px]">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="aspect-video w-full rounded-lg" />
                </CardContent>
                <div className="p-4 pt-0 border-t border-slate-50 flex justify-between items-center">
                  <Skeleton className="h-3 w-24" />
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-20 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-slate-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-slate-900">Ei julkaisuja löytynyt</h3>
                <p className="text-slate-500">Kokeile eri hakusanaa tai luo uusi julkaisu.</p>
              </div>
              <Button onClick={handleCreate} variant="outline">Luo ensimmäinen julkaisu</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="group hover:border-indigo-200 transition-all duration-200 flex flex-col">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${
                      item.type === 'announcement' ? 'bg-blue-50 text-blue-600' :
                      item.type === 'event' ? 'bg-orange-50 text-orange-600' :
                      item.type === 'media' ? 'bg-purple-50 text-purple-600' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {item.type === 'announcement' ? <Megaphone className="h-4 w-4" /> :
                       item.type === 'event' ? <Calendar className="h-4 w-4" /> :
                       item.type === 'media' ? <ImageIcon className="h-4 w-4" /> :
                       <QrCode className="h-4 w-4" />}
                    </div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {item.type === 'announcement' ? 'Tiedote' :
                       item.type === 'event' ? 'Tapahtuma' :
                       item.type === 'media' ? 'Media' :
                       'QR-linkki'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.is_published ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="h-3 w-3" /> JULKAISTU
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                        <Circle className="h-3 w-3" /> LUONNOS
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex-1 space-y-3">
                  <h3 className="font-bold text-slate-900 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  {item.body && (
                    <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                      {item.body}
                    </p>
                  )}
                  {item.type === 'event' && item.event_date && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(item.event_date), 'd.M.yyyy', { locale: fi })}
                      {item.start_time && ` klo ${item.start_time}`}
                    </div>
                  )}
                  {item.media_url && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      {item.media_type === 'video' ? (
                        <video src={item.media_url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.media_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )}
                    </div>
                  )}
                </CardContent>
                <div className="p-4 pt-0 mt-auto flex items-center justify-between border-t border-slate-50">
                  <span className="text-[10px] text-slate-400">
                    Päivitetty {format(new Date(item.updated_at), 'd.M. HH:mm', { locale: fi })}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-indigo-600" 
                      onClick={() => handleEdit(item)}
                      aria-label={`Muokkaa julkaisua: ${item.title}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    {item.is_archived ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-green-600" 
                        onClick={() => handleRestore(item.id)}
                        aria-label={`Palauta arkistosta: ${item.title}`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-amber-600" 
                        onClick={() => handleArchive(item.id)}
                        aria-label={`Arkistoi julkaisu: ${item.title}`}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    {item.is_archived && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-600" 
                        onClick={() => setDeleteConfirmId(item.id)}
                        aria-label={`Poista julkaisu pysyvästi: ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Overlay */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border-red-100">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="text-lg">Vahvista poisto</CardTitle>
              </div>
              <CardDescription>
                Haluatko varmasti poistaa tämän julkaisun? Tätä toimintoa ei voi peruuttaa.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Peruuta
              </Button>
              <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Poista julkaisu
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
