import { useState, useEffect, FormEvent } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockJobs } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Pencil, Trash2, X, Briefcase, MapPin, ArrowUp, ArrowDown } from 'lucide-react';

type Job = Tables<'jobs'>;

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    if (isMockSupabase) {
      setJobs(mockJobs);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching jobs:', error);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  }

  function resetForm() {
    setTitle('');
    setDepartment('');
    setLocation('');
    setDescription('');
    setApplyUrl('');
    setStartAt('');
    setEndAt('');
    setIsPublished(true);
    setEditingId(null);
    setIsFormOpen(false);
    setMessage(null);
  }

  function openEditForm(job: Job) {
    setTitle(job.title || '');
    setDepartment(job.department || '');
    setLocation(job.location || '');
    setDescription(job.description || '');
    setApplyUrl(job.apply_url || '');
    setStartAt(job.start_at ? job.start_at.substring(0, 16) : '');
    setEndAt(job.end_at ? job.end_at.substring(0, 16) : '');
    setIsPublished(job.is_published ?? true);
    setEditingId(job.id);
    setIsFormOpen(true);
    setMessage(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const payload = {
      title,
      department: department || null,
      location: location || null,
      description: description || null,
      apply_url: applyUrl || null,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
      is_published: isPublished,
    };

    if (isMockSupabase) {
      if (editingId) {
        setJobs(prev => prev.map(j => j.id === editingId ? { ...j, ...payload, updated_at: new Date().toISOString() } : j));
        setMessage({ type: 'success', text: 'Työpaikkailmoitus päivitetty (Mock).' });
      } else {
        const newJob: Job = {
          ...payload,
          id: Math.random().toString(),
          sort_order: jobs.length + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setJobs([...jobs, newJob]);
        setMessage({ type: 'success', text: 'Työpaikkailmoitus luotu (Mock).' });
      }
      resetForm();
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('jobs').update(payload).eq('id', editingId);
      if (error) {
        setMessage({ type: 'error', text: 'Päivitys epäonnistui.' });
        return;
      }
      setMessage({ type: 'success', text: 'Työpaikkailmoitus päivitetty.' });
    } else {
      const { error } = await supabase.from('jobs').insert({ ...payload, sort_order: jobs.length + 1 });
      if (error) {
        setMessage({ type: 'error', text: 'Luonti epäonnistui.' });
        return;
      }
      setMessage({ type: 'success', text: 'Työpaikkailmoitus luotu.' });
    }

    resetForm();
    fetchJobs();
  }

  async function handleDelete(id: string) {
    if (!confirm('Haluatko varmasti poistaa tämän työpaikkailmoituksen?')) return;

    if (isMockSupabase) {
      setJobs(prev => prev.filter(j => j.id !== id));
      setMessage({ type: 'success', text: 'Poistettu (Mock).' });
      return;
    }

    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: 'Poisto epäonnistui.' });
    } else {
      setMessage({ type: 'success', text: 'Työpaikkailmoitus poistettu.' });
      fetchJobs();
    }
  }

  async function moveJob(id: string, direction: 'up' | 'down') {
    const currentIndex = jobs.findIndex(j => j.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === jobs.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentItem = jobs[currentIndex];
    const swapItem = jobs[newIndex];

    if (isMockSupabase) {
      const newJobs = [...jobs];
      newJobs[currentIndex] = { ...swapItem, sort_order: currentItem.sort_order };
      newJobs[newIndex] = { ...currentItem, sort_order: swapItem.sort_order };
      setJobs(newJobs.sort((a, b) => a.sort_order - b.sort_order));
      return;
    }

    await supabase.from('jobs').update({ sort_order: swapItem.sort_order }).eq('id', currentItem.id);
    await supabase.from('jobs').update({ sort_order: currentItem.sort_order }).eq('id', swapItem.id);
    fetchJobs();
  }

  async function togglePublish(id: string, currentStatus: boolean) {
    if (isMockSupabase) {
      setJobs(prev => prev.map(j => j.id === id ? { ...j, is_published: !currentStatus } : j));
      return;
    }

    await supabase.from('jobs').update({ is_published: !currentStatus }).eq('id', id);
    fetchJobs();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Avoimet työpaikat</h1>
          <p className="text-slate-500 mt-2">Hallitse InfoTV:llä näytettäviä työpaikkailmoituksia.</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Uusi ilmoitus
          </Button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {isFormOpen && (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle>{editingId ? 'Muokkaa ilmoitusta' : 'Uusi työpaikkailmoitus'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tehtävänimike</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="esim. IT-asiantuntija"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Osasto (valinnainen)</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="esim. IT-palvelut"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Sijainti (valinnainen)</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="esim. Rovaniemi"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Kuvaus (valinnainen)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Lyhyt kuvaus tehtävästä ja vaatimuksista"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applyUrl">Hakuosoite (valinnainen)</Label>
                <Input
                  id="applyUrl"
                  type="url"
                  value={applyUrl}
                  onChange={(e) => setApplyUrl(e.target.value)}
                  placeholder="https://eduro.fi/rekrytointi"
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
              <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label htmlFor="published">Julkaistu näytöllä</Label>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={resetForm}>Peruuta</Button>
                <Button type="submit">Tallenna</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-slate-500">Ladataan...</div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Briefcase className="h-12 w-12 opacity-20 mb-4" />
              <p>Ei ilmoituksia. Luo ensimmäinen ilmoitus ylhäältä.</p>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job, index) => {
            const now = new Date();
            const isScheduled = job.start_at && new Date(job.start_at) > now;
            const isExpired = job.end_at && new Date(job.end_at) < now;
            const isActive = job.is_published && !isScheduled && !isExpired;

            return (
              <Card key={job.id} className={`${!isActive ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-slate-900 text-lg">{job.title}</h3>
                        {!job.is_published && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">Piilotettu</span>
                        )}
                        {job.is_published && isScheduled && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">Ajastettu</span>
                        )}
                        {job.is_published && isExpired && (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Päättynyt</span>
                        )}
                        {isActive && (
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Aktiivinen</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                        {job.department && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {job.department}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location}
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        id={`pub-${job.id}`}
                        checked={job.is_published}
                        onCheckedChange={() => togglePublish(job.id, job.is_published)}
                      />
                      <Button variant="outline" size="icon" onClick={() => moveJob(job.id, 'up')} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => moveJob(job.id, 'down')} disabled={index === jobs.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => openEditForm(job)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(job.id)}>
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
