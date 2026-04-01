import { useState, useEffect, FormEvent } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockSettings } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { createDefaultDisplaySettings, DISPLAY_SETTINGS_ID, getErrorMessage } from '../../lib/content';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

type Settings = Tables<'display_settings'>;

export function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    void fetchSettings();
  }, [user]);

  async function fetchSettings() {
    setLoading(true);

    if (isMockSupabase) {
      setSettings({ ...mockSettings, id: DISPLAY_SETTINGS_ID });
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
      setMessage({ type: 'error', text: getErrorMessage(error, 'Asetusten lataus epäonnistui.') });
      setSettings(createDefaultDisplaySettings());
    } else {
      setSettings(data ?? createDefaultDisplaySettings());
    }

    setLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    if (settings.rotation_interval_seconds < 5) {
      setMessage({ type: 'error', text: 'Kierron aikavälin on oltava vähintään 5 sekuntia.' });
      setSaving(false);
      return;
    }

    if (!/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(settings.accent_color)) {
      setMessage({ type: 'error', text: 'Korostusvärin on oltava kelvollinen HEX-arvo.' });
      setSaving(false);
      return;
    }

    if (settings.show_rss && !settings.rss_feed_url) {
      setMessage({ type: 'error', text: 'Anna RSS-syötteen URL tai poista RSS käytöstä.' });
      setSaving(false);
      return;
    }

    const payload: Settings = {
      ...settings,
      id: DISPLAY_SETTINGS_ID,
      show_rss: Boolean(settings.show_rss),
      rss_max_items: Math.min(Math.max(settings.rss_max_items || 3, 1), 10),
    };

    if (isMockSupabase) {
      setSettings({ ...payload, updated_at: new Date().toISOString() });
      setTimeout(() => {
        setSaving(false);
        setMessage({ type: 'success', text: 'Asetukset tallennettu onnistuneesti (Mock).' });
      }, 300);
      return;
    }

    const { error } = await supabase
      .from('display_settings')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Virhe tallennettaessa asetuksia.') });
      setSaving(false);
      return;
    }

    setMessage({ type: 'success', text: 'Asetukset tallennettu onnistuneesti.' });
    setSaving(false);
    await fetchSettings();
  }

  if (loading) {
    return <div className="text-slate-500">Ladataan asetuksia...</div>;
  }

  if (!settings) {
    return <div className="text-red-500">Asetuksia ei löytynyt.</div>;
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
                  onChange={(e) => setSettings({ ...settings, rotation_interval_seconds: parseInt(e.target.value, 10) || 15 })}
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
              <Label htmlFor="heroSubtitle">Hero-alaotsikko (näkyy tervetuloa-slidissa)</Label>
              <Input
                id="heroSubtitle"
                placeholder="esim. Lapin johtava aikuiskouluttaja"
                value={settings.hero_subtitle || ''}
                onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="hoursMonFri">Ma–Pe</Label>
                    <Input
                      id="hoursMonFri"
                      placeholder="esim. 8:00–16:00"
                      value={settings.opening_hours_mon_fri || ''}
                      onChange={(e) => setSettings({ ...settings, opening_hours_mon_fri: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hoursSat">La</Label>
                    <Input
                      id="hoursSat"
                      placeholder="esim. suljettu"
                      value={settings.opening_hours_sat || ''}
                      onChange={(e) => setSettings({ ...settings, opening_hours_sat: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hoursSun">Su</Label>
                    <Input
                      id="hoursSun"
                      placeholder="esim. suljettu"
                      value={settings.opening_hours_sun || ''}
                      onChange={(e) => setSettings({ ...settings, opening_hours_sun: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RSS-uutissyöte</CardTitle>
            <CardDescription>Valinnainen uutissyöte näytön sisältökiertoon. Oletuksena pois päältä.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showRss">Näytä RSS-uutiset</Label>
                <p className="text-sm text-slate-500">Lisää ulkoinen uutissyöte sisältökiertoon</p>
              </div>
              <Switch
                id="showRss"
                checked={settings.show_rss || false}
                onCheckedChange={(checked) => setSettings({ ...settings, show_rss: checked })}
              />
            </div>
            {settings.show_rss && (
              <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-2 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="rssFeedUrl">RSS-syötteen URL</Label>
                  <Input
                    id="rssFeedUrl"
                    type="url"
                    placeholder="https://esimerkki.fi/rss.xml"
                    value={settings.rss_feed_url || ''}
                    onChange={(e) => setSettings({ ...settings, rss_feed_url: e.target.value })}
                  />
                  <p className="text-xs text-slate-400">Syötteen palvelimen tulee sallia selainpyynnöt (CORS).</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rssMaxItems">Uutisia kerrallaan (max)</Label>
                  <Input
                    id="rssMaxItems"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.rss_max_items || 3}
                    onChange={(e) => setSettings({ ...settings, rss_max_items: parseInt(e.target.value, 10) || 3 })}
                  />
                </div>
              </div>
            )}
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
