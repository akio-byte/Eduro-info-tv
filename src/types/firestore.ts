import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'editor';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: Timestamp | string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'normal' | 'low';
  start_at: Timestamp | string | null;
  end_at: Timestamp | string | null;
  is_published: boolean;
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string; // Keep as string for date input compatibility
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_published: boolean;
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

export interface Highlight {
  id: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  image_path: string | null;
  cta_label: string | null;
  cta_url: string | null;
  start_at: Timestamp | string | null;
  end_at: Timestamp | string | null;
  is_published: boolean;
  sort_order: number;
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

export interface QrLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  start_at: Timestamp | string | null;
  end_at: Timestamp | string | null;
  is_published: boolean;
  sort_order: number;
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

export interface DisplaySettings {
  id: string;
  org_name: string;
  welcome_text: string | null;
  rotation_interval_seconds: number;
  show_announcements: boolean;
  show_events: boolean;
  show_highlights: boolean;
  show_qr_links: boolean;
  show_opening_hours: boolean;
  opening_hours_text: string | null;
  fallback_message: string | null;
  accent_color: string;
  updated_at: Timestamp | string;
}
