import { useState, useEffect, FormEvent } from 'react';
import { db, isMockFirebase } from '../../lib/firebase';
import { collection, onSnapshot, query, limit, updateDoc, doc, setDoc, getDocs, Timestamp, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';
import { mockSettings } from '../../lib/mock-data';
import type { DisplaySettings } from '../../types/firestore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

type Settings = DisplaySettings;

import { 
  Settings as SettingsIcon, 
  Palette, 
  Layout, 
  Eye, 
  Clock, 
  Sun, 
  Moon,
  Monitor
} from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { role } = useAuth();

  useEffect(() => {
    if (role !== 'admin') {
      setLoading(false);
      return;
    }

    if (isMockFirebase) {
      setSettings({ ...mockSettings, theme: 'dark' });
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'display_settings', 'default');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setSettings({
          id: docSnap.id,
          ...d,
          theme: d.theme || 'dark',
          created_at: d.created_at instanceof Timestamp ? d.created_at.toDate().toISOString() : d.created_at,
          updated_at: d.updated_at instanceof Timestamp ? d.updated_at.toDate().toISOString() : d.updated_at,
        } as any as Settings);
      } else {
        // If no settings exist, provide default settings so the user can save them
        setSettings({
          id: 'default',
          org_name: 'Eduro',
          welcome_text: 'Tervetuloa InfoTV:hen',
          rotation_interval_seconds: 15,
          show_announcements: true,
          show_events: true,
          show_highlights: true,
          show_qr_links: true,
          show_opening_hours: false,
          opening_hours_text: '',
          fallback_message: 'Ei uusia tiedotteita tällä hetkellä.',
          accent_color: '#4f46e5',
          theme: 'dark',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any as Settings);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'display_settings/default'));

    return () => unsubscribe();
  }, [role]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    
    setSaving(true);
    setMessage(null);

    // Validate rotation interval
    if (settings.rotation_interval_seconds < 5) {
      setMessage({ type: 'error', text: 'Kierron aikavälin on oltava vähintään 5 sekuntia.' });
      setSaving(false);
      return;
    }

    if (isMockFirebase) {
      setSettings({ ...settings, updated_at: new Date().toISOString() });
      setTimeout(() => {
        setSaving(false);
        setMessage({ type: 'success', text: 'Asetukset tallennettu onnistuneesti (Mock).' });
      }, 500);
      return;
    }

    try {
      const { id, created_at, updated_at, ...rest } = settings as any;
      const payload = {
        ...rest,
        theme: rest.theme || 'dark',
        updated_at: serverTimestamp(),
      };

      if (id && id !== 'default') {
        // Migration: if somehow it was saved with a random ID, we should probably delete it, 
        // but for now let's just ensure we write to 'default'
      }
      
      await setDoc(doc(db, 'display_settings', 'default'), {
        ...payload,
        created_at: settings.created_at ? (settings.created_at instanceof Timestamp ? settings.created_at : Timestamp.fromDate(new Date(settings.created_at))) : serverTimestamp(),
      }, { merge: true });
      
      setMessage({ type: 'success', text: 'Asetukset tallennettu onnistuneesti.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Virhe tallennettaessa asetuksia.' });
      handleFirestoreError(error, OperationType.UPDATE, 'display_settings');
    } finally {
      setSaving(false);
    }
  }

  if (role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Ei käyttöoikeutta</h2>
          <p className="mt-2 text-slate-500">Vain ylläpitäjät voivat muokata järjestelmän asetuksia.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-slate-500">Ladataan asetuksia...</div>;
  }

  if (!settings) {
    return <div className="text-red-500">Asetuksia ei löytynyt. Ota yhteyttä ylläpitoon.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Asetukset</h1>
        <p className="text-slate-500 mt-2">Hallitse InfoTV:n yleisiä asetuksia ja ulkoasua.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              <CardTitle>Ulkoasu ja teema</CardTitle>
            </div>
            <CardDescription>Määritä InfoTV-näytön visuaalinen ilme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Värimaailma (Teema)</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, theme: 'light' })}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    settings.theme === 'light' 
                      ? 'border-indigo-600 bg-indigo-50/50' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="h-12 w-full bg-slate-50 rounded border border-slate-200 flex items-center justify-center">
                    <Sun className="h-6 w-6 text-amber-500" />
                  </div>
                  <span className="font-medium text-sm">Vaalea</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    settings.theme === 'dark' 
                      ? 'border-indigo-600 bg-indigo-50/50' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="h-12 w-full bg-slate-950 rounded border border-slate-800 flex items-center justify-center">
                    <Moon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <span className="font-medium text-sm">Tumma</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Teeman korostusväri</Label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-xl border shadow-sm"
                  style={{ backgroundColor: settings.accent_color }}
                />
                <Input
                  id="accentColor"
                  type="text"
                  value={settings.accent_color || '#0ea5e9'}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  className="flex-1 font-mono"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  required
                />
                <Input
                  type="color"
                  className="w-12 h-10 p-1 cursor-pointer"
                  value={settings.accent_color || '#0ea5e9'}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-indigo-600" />
              <CardTitle>Yleiset asetukset</CardTitle>
            </div>
            <CardDescription>Perustiedot ja näytön käyttäytyminen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organisaation nimi</Label>
                <Input
                  id="orgName"
                  value={settings.org_name || ''}
                  onChange={(e) => setSettings({ ...settings, org_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rotationInterval">Kierron aikaväli (sekunteja)</Label>
                <Input
                  id="rotationInterval"
                  type="number"
                  min="5"
                  max="60"
                  value={settings.rotation_interval_seconds || 15}
                  onChange={(e) => setSettings({ ...settings, rotation_interval_seconds: parseInt(e.target.value) || 15 })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcomeText">Tervetuloteksti (näkyy yläpalkissa)</Label>
              <Input
                id="welcomeText"
                value={settings.welcome_text || ''}
                onChange={(e) => setSettings({ ...settings, welcome_text: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fallbackMessage">Varaviesti (kun ei muuta sisältöä)</Label>
              <Textarea
                id="fallbackMessage"
                value={settings.fallback_message || ''}
                onChange={(e) => setSettings({ ...settings, fallback_message: e.target.value })}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Näkyvät osiot</CardTitle>
            <CardDescription>Valitse mitä sisältöä näytöllä esitetään</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showAnnouncements">Tiedotteet</Label>
                <p className="text-sm text-slate-500">Näytä julkaistut tiedotteet</p>
              </div>
              <Switch
                id="showAnnouncements"
                checked={settings.show_announcements || false}
                onCheckedChange={(checked) => setSettings({ ...settings, show_announcements: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showEvents">Tapahtumat</Label>
                <p className="text-sm text-slate-500">Näytä tulevat tapahtumat</p>
              </div>
              <Switch
                id="showEvents"
                checked={settings.show_events || false}
                onCheckedChange={(checked) => setSettings({ ...settings, show_events: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showHighlights">Nostot</Label>
                <p className="text-sm text-slate-500">Näytä kuvalliset nostot</p>
              </div>
              <Switch
                id="showHighlights"
                checked={settings.show_highlights || false}
                onCheckedChange={(checked) => setSettings({ ...settings, show_highlights: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showQrLinks">QR-linkit</Label>
                <p className="text-sm text-slate-500">Näytä QR-koodit sivupalkissa</p>
              </div>
              <Switch
                id="showQrLinks"
                checked={settings.show_qr_links || false}
                onCheckedChange={(checked) => setSettings({ ...settings, show_qr_links: checked })}
              />
            </div>
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <Label htmlFor="showOpeningHours">Aukioloajat</Label>
                  <p className="text-sm text-slate-500">Näytä aukioloajat sivupalkissa</p>
                </div>
                <Switch
                  id="showOpeningHours"
                  checked={settings.show_opening_hours || false}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_opening_hours: checked })}
                />
              </div>
              {settings.show_opening_hours && (
                <div className="space-y-2">
                  <Label htmlFor="openingHoursText">Aukioloaikojen teksti</Label>
                  <Input
                    id="openingHoursText"
                    value={settings.opening_hours_text || ''}
                    onChange={(e) => setSettings({ ...settings, opening_hours_text: e.target.value })}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Tallennetaan...' : 'Tallenna asetukset'}
          </Button>
        </div>
      </form>
    </div>
  );
}
