import { useState, useEffect } from 'react';
import { supabase, isMockSupabase } from '../../lib/supabase';
import { mockSettings } from '../../lib/mock-data';
import type { Tables } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';

type Settings = Tables<'display_settings'>;

export function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    if (isMockSupabase) {
      setSettings(mockSettings);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('display_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching settings:', error);
    } else {
      setSettings(data || null);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    
    setSaving(true);

    if (isMockSupabase) {
      setSettings({ ...settings, updated_at: new Date().toISOString() });
      setTimeout(() => setSaving(false), 500);
      return;
    }

    if (settings.id) {
      await supabase.from('display_settings').update(settings).eq('id', settings.id);
    } else {
      await supabase.from('display_settings').insert(settings);
    }
    
    setSaving(false);
    fetchSettings();
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Yleiset asetukset</CardTitle>
            <CardDescription>Perustiedot ja näytön käyttäytyminen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organisaation nimi</Label>
                <Input
                  id="orgName"
                  value={settings.org_name}
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
                  value={settings.rotation_interval_seconds}
                  onChange={(e) => setSettings({ ...settings, rotation_interval_seconds: parseInt(e.target.value) })}
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
                  className="w-16 h-10 p-1"
                  value={settings.accent_color}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  required
                />
                <Input
                  type="text"
                  value={settings.accent_color}
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
                checked={settings.show_announcements}
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
                checked={settings.show_events}
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
                checked={settings.show_highlights}
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
                checked={settings.show_qr_links}
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
                  checked={settings.show_opening_hours}
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
