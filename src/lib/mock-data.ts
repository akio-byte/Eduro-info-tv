import type { Database } from '../types/database';

type Tables = Database['public']['Tables'];

export const mockAnnouncements: Tables['announcements']['Row'][] = [
  {
    id: '1',
    title: 'Tervetuloa uuteen lukukauteen!',
    body: 'Eduro toivottaa kaikki opiskelijat ja henkilökunnan tervetulleeksi. Muistathan tarkistaa uudet turvallisuusohjeet intrasta.',
    priority: 'high',
    is_pinned: true,
    start_at: new Date().toISOString(),
    end_at: null,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'IT-huoltokatko viikonloppuna',
    body: 'Verkkopalveluissa saattaa esiintyä katkoksia lauantaina klo 08:00 - 12:00 välisenä aikana päivitysten vuoksi.',
    priority: 'normal',
    is_pinned: false,
    start_at: new Date().toISOString(),
    end_at: null,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockEvents: Tables['events']['Row'][] = [
  {
    id: '1',
    title: 'Eduro Innovaatiopäivä',
    description: 'Tule kuulemaan alan asiantuntijoita ja verkostoitumaan.',
    event_date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    start_time: '10:00',
    end_time: '15:00',
    location: 'Pääauditorio',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Koodauskerho kokoontuu',
    description: 'Avoin kaikille tasoille. Tällä viikolla aiheena React ja TypeScript.',
    event_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    start_time: '16:00',
    end_time: '18:00',
    location: 'Luokka B204',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockHighlights: Tables['highlights']['Row'][] = [
  {
    id: '1',
    title: 'Hae nyt syksyn koulutuksiin',
    subtitle: 'Vielä ehdit mukaan!',
    body: 'Tarjoamme laajan valikoiman täydennyskoulutuksia IT-alalle. Katso tarjonta ja hae mukaan.',
    image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000',
    image_path: null,
    video_url: null,
    cta_label: 'Lue lisää',
    cta_url: 'https://eduro.fi/koulutukset',
    start_at: null,
    end_at: null,
    is_published: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Uusi kampus avautuu',
    subtitle: 'Modernit tilat opiskeluun',
    body: 'Olemme avanneet uuden kampuksen keskustaan. Tervetuloa tutustumaan!',
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000',
    image_path: null,
    video_url: null,
    cta_label: 'Katso kuvat',
    cta_url: 'https://eduro.fi/kampus',
    start_at: null,
    end_at: null,
    is_published: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const mockQrLinks: Tables['qr_links']['Row'][] = [
  {
    id: '1',
    title: 'Lounaslista',
    url: 'https://eduro.fi/lounas',
    description: 'Katso viikon ruokalista',
    start_at: null,
    end_at: null,
    is_published: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Anna palautetta',
    url: 'https://eduro.fi/palaute',
    description: 'Miten voimme parantaa?',
    start_at: null,
    end_at: null,
    is_published: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const mockJobs: Tables['jobs']['Row'][] = [
  {
    id: '1',
    title: 'IT-asiantuntija',
    department: 'IT-palvelut',
    location: 'Rovaniemi',
    description: 'Haemme kokenutta IT-asiantuntijaa tukemaan organisaatiomme digitaalista kehitystä.',
    apply_url: 'https://eduro.fi/rekrytointi',
    is_published: true,
    start_at: null,
    end_at: null,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Kouluttaja / Opettaja',
    department: 'Koulutus',
    location: 'Rovaniemi / Etätyö',
    description: 'Etsimme innostunutta kouluttajaa digitaalisten taitojen opettamiseen aikuisopiskelijoille.',
    apply_url: 'https://eduro.fi/rekrytointi',
    is_published: true,
    start_at: null,
    end_at: null,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockSettings: Tables['display_settings']['Row'] = {
  id: '1',
  org_name: 'Eduro',
  welcome_text: 'Tervetuloa Eduroon!',
  hero_subtitle: 'Lapin johtava aikuiskouluttaja',
  rotation_interval_seconds: 15,
  show_announcements: true,
  show_events: true,
  show_highlights: true,
  show_qr_links: true,
  show_opening_hours: true,
  show_jobs: false,
  show_rss: false,
  opening_hours_text: 'Ma-Pe 08:00 - 16:00',
  opening_hours_mon_fri: 'Ma–Pe 8:00–16:00',
  opening_hours_sat: 'La suljettu',
  opening_hours_sun: 'Su suljettu',
  rss_feed_url: null,
  rss_max_items: 3,
  fallback_message: 'Ei uusia tiedotteita tällä hetkellä. Mukavaa päivää!',
  accent_color: '#0ea5e9', // sky-500
  updated_at: new Date().toISOString(),
};
