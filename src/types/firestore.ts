import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'editor';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  org_id: string;
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

export interface Invitation {
  id: string;
  email: string;
  org_id: string;
  role: UserRole;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: Timestamp | string;
  expires_at: Timestamp | string;
}

export type ContentType = 'announcement' | 'event' | 'media' | 'qr' | 'mixed' | 'rss';

export interface ContentItem {
  id: string;
  org_id: string;
  type: ContentType;
  title: string;
  body: string | null;
  media_url: string | null;
  rss_url?: string | null;
  media_type: 'none' | 'image' | 'video';
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  qr_url: string | null;
  publish_start: Timestamp | string | null;
  publish_end: Timestamp | string | null;
  duration_seconds: number;
  is_published: boolean;
  is_archived: boolean;
  sort_order: number;
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
  created_by: string;
  updated_by: string;
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
  theme: 'light' | 'dark';
  updated_at: Timestamp | string;
}
