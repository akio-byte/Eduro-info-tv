import { useState, useEffect, FormEvent } from 'react';
import { db, isMockFirebase } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';
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

type Announcement = Tables<'announcements'>;

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [isPublished, setIsPublished] = useState(true);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  useEffect(() => {
    if (isMockFirebase) {
      setAnnouncements(mockAnnouncements);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'announcements'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          // Convert Firestore Timestamps to ISO strings for compatibility with existing UI
          created_at: d.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: d.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          start_at: d.start_at?.toDate?.()?.toISOString() || d.start_at || null,
          end_at: d.end_at?.toDate?.()?.toISOString() || d.end_at || null,
        } as Announcement;
      });
      setAnnouncements(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'announcements'));

    return () => unsubscribe();
  }, []);

  function resetForm() {
    setTitle('');
    setBody('');
    setPriority('normal');
    setIsPublished(true);
    setStartAt('');
    setEndAt('');
    setEditingId(null);
    setIsFormOpen(false);
    setMessage(null);
  }

  function openEditForm(announcement: Announcement) {
    setTitle(announcement.title || '');
    setBody(announcement.body || '');
    setPriority(announcement.priority || 'normal');
    setIsPublished(announcement.is_published ?? true);
    setStartAt(announcement.start_at ? announcement.start_at.substring(0, 16) : '');
    setEndAt(announcement.end_at ? announcement.end_at.substring(0, 16) : '');
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
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
    };

    if (isMockFirebase) {
      if (editingId) {
        setAnnouncements(prev => prev.map(a => a.id === editingId ? { ...a, ...payload, updated_at: new Date().toISOString() } : a));
      } else {
        const newAnnouncement: Announcement = {
          ...payload,
          id: Math.random().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Announcement;
        setAnnouncements([newAnnouncement, ...announcements]);
      }
      resetForm();
      setMessage({ type: 'success', text: 'Tiedote tallennettu (Mock).' });
      return;
    }

    try {
      const data = {
        ...payload,
        updated_at: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'announcements', editingId), data);
        setMessage({ type: 'success', text: 'Tiedote päivitetty.' });
      } else {
        await addDoc(collection(db, 'announcements'), {
          ...data,
          created_at: serverTimestamp(),
        });
        setMessage({ type: 'success', text: 'Tiedote luotu.' });
      }
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: 'Virhe tallennettaessa tiedotetta.' });
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'announcements');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Haluatko varmasti poistaa tämän tiedotteen?')) return;

    if (isMockFirebase) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      setMessage({ type: 'success', text: 'Tiedote poistettu (Mock).' });
      return;
    }

    try {
      await deleteDoc(doc(db, 'announcements', id));
      setMessage({ type: 'success', text: 'Tiedote poistettu.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Virhe poistettaessa tiedotetta.' });
      handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
    }
  }

  async function togglePublish(id: string, currentStatus: boolean) {
    if (isMockFirebase) {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_published: !currentStatus } : a));
      return;
    }

    try {
      await updateDoc(doc(db, 'announcements', id), {
        is_published: !currentStatus,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `announcements/${id}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tiedotteet</h1>
          <p className="text-slate-500 mt-2">Hallitse näytöllä pyöriviä tiedotteita.</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Uusi tiedote
          </Button>
        )}
      </div>

      {message && !isFormOpen && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {isFormOpen && (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle>{editingId ? 'Muokkaa tiedotetta' : 'Luo uusi tiedote'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {message && (
              <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="body">Sisältö</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="startAt">Julkaisu alkaa (valinnainen)</Label>
                  <Input
                    id="startAt"
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endAt">Julkaisu päättyy (valinnainen)</Label>
                  <Input
                    id="endAt"
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioriteetti</Label>
                  <select
                    id="priority"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                  >
                    <option value="high">Korkea</option>
                    <option value="normal">Normaali</option>
                    <option value="low">Matala</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="published"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label htmlFor="published">Julkaistu näytöllä</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={resetForm}>Peruuta</Button>
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
            const now = new Date();
            const isScheduled = announcement.start_at && new Date(announcement.start_at) > now;
            const isExpired = announcement.end_at && new Date(announcement.end_at) < now;
            const isActive = announcement.is_published && !isScheduled && !isExpired;

            return (
              <Card key={announcement.id} className={!isActive ? 'opacity-60' : ''}>
                <CardContent className="flex items-start justify-between p-6">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
                      {announcement.priority === 'high' && (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Tärkeä</span>
                      )}
                      {!announcement.is_published && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">Piilotettu</span>
                      )}
                      {announcement.is_published && isScheduled && (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">Ajastettu</span>
                      )}
                      {announcement.is_published && isExpired && (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Päättynyt</span>
                      )}
                      {isActive && (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Aktiivinen</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{announcement.body}</p>
                    <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400">
                      <span>Luotu: {format(new Date(announcement.created_at), 'd.M.yyyy HH:mm', { locale: fi })}</span>
                      {(announcement.start_at || announcement.end_at) && (
                        <span className="flex items-center">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {announcement.start_at ? format(new Date(announcement.start_at), 'd.M.yyyy HH:mm') : 'Heti'} - 
                          {announcement.end_at ? format(new Date(announcement.end_at), 'd.M.yyyy HH:mm') : 'Toistaiseksi'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="flex items-center space-x-2 mr-4">
                      <Label htmlFor={`pub-${announcement.id}`} className="sr-only">Julkaistu</Label>
                      <Switch
                        id={`pub-${announcement.id}`}
                        checked={announcement.is_published}
                        onCheckedChange={() => togglePublish(announcement.id, announcement.is_published)}
                      />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => openEditForm(announcement)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(announcement.id)}>
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
