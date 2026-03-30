import { useEffect, useState, type FormEvent } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockSettings } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { DISPLAY_SETTINGS_ID } from '../../lib/display-settings';

type Settings = Tables<'display_settings'>;

function createDefaultSettings(): Settings {
  return { ...mockSettings, id: DISPLAY_SETTINGS_ID };
}

export function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { role } = useAuth();

  useEffect(() => {
    if (role === 'admin') {
      void fetchSettings();
    } else {
      setLoading(false);
    }
  }, [role]);

  async function fetchSettings() {
    setLoading(true);

    if (isMockSupabase) {
      setSettings(createDefaultSettings());
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('display_settings')
      .select('*')
      .eq('id', DISPLAY_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Asetusten lataus epäonnistui.' });
      setSettings(createDefaultSettings());
    } else {
      setSettings(data || createDefaultSettings());
    }

    setLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) {
      return;
    }

    setSaving(true);
    setMessage(null);

    if (settings.rotation_interval_seconds < 5) {
      setMessage({ type: 'error', text: 'Kierron aikavälin on oltava vähintään 5 sekuntia.' });
      setSaving(false);
      return;
    }

    if (isMockSupabase) {
      setSettings({ ...settings, id: DISPLAY_SETTINGS_ID, updated_at: new Date().toISOString() });
      setSaving(false);
      setMessage({ type: 'success', text: 'Asetukset tallennettu onnistuneesti (Mock).' });
      return;
    }

    const payload = {
      id: DISPLAY_SETTINGS_ID,
      org_name: settings.org_name,
      welcome_text: settings.welcome_text,
      rotation_interval_seconds: settings.rotation_interval_seconds,
      show_announcements: settings.show_announcements,
      show_events: settings.show_events,
      show_highlights: settings.show_highlights,
      show_qr_links: settings.show_qr_links,
      show_opening_hours: settings.show_opening_hours,
      opening_hours_text: settings.opening_hours_text,
      fallback_message: settings.fallback_message,
      accent_color: settings.accent_color,
    };

    const { error } = await supabase.from('display_settings').upsert(payload, { onConflict: 'id' });
    if (error) {
      setMessage({ type: 'error', text: 'Virhe tallennettaessa asetuksia.' });
      setSaving(false);
      return;
    }

    setMessage({ type: 'success', text: 'Asetukset tallennettu onnistuneesti.' });
    setSaving(false);
    await fetchSettings();
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
        <p className="mt-2 text-slate-500">Hallitse InfoTV:n yleisiä asetuksia ja ulkoasua.</p>
      </div>

      {message && (
        <div className={`rounded-md p-4 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Yleiset asetukset</CardTitle>
            <CardDescription>Perustiedot ja näytön käyttäytyminen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      rotation_interval_seconds: parseInt(e.target.value, 10) || 15,
                    })
                  }
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
            <div className="space-y-2">
              <Label htmlFor="accentColor">Teeman korostusväri (HEX)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="accentColor"
                  type="color"
                  className="h-10 w-16 p-1"
                  value={settings.accent_color || '#0ea5e9'}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  required
                />
                <Input
                  type="text"
                  value={settings.accent_color || '#0ea5e9'}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  className="flex-1"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  required
                />
              </div>
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
            <div className="border-t border-slate-100 pt-4">
              <div className="mb-4 flex items-center justify-between">
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
