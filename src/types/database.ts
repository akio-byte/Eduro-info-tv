export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'editor';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: 'admin' | 'editor';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'editor';
          created_at?: string;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          priority: 'high' | 'normal' | 'low';
          start_at: string | null;
          end_at: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          priority?: 'high' | 'normal' | 'low';
          start_at?: string | null;
          end_at?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          priority?: 'high' | 'normal' | 'low';
          start_at?: string | null;
          end_at?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string;
          start_time: string | null;
          end_time: string | null;
          location: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      highlights: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          body: string | null;
          image_url: string | null;
          image_path: string | null;
          cta_label: string | null;
          cta_url: string | null;
          start_at: string | null;
          end_at: string | null;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          body?: string | null;
          image_url?: string | null;
          image_path?: string | null;
          cta_label?: string | null;
          cta_url?: string | null;
          start_at?: string | null;
          end_at?: string | null;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          body?: string | null;
          image_url?: string | null;
          image_path?: string | null;
          cta_label?: string | null;
          cta_url?: string | null;
          start_at?: string | null;
          end_at?: string | null;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      qr_links: {
        Row: {
          id: string;
          title: string;
          url: string;
          description: string | null;
          start_at: string | null;
          end_at: string | null;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          url: string;
          description?: string | null;
          start_at?: string | null;
          end_at?: string | null;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          url?: string;
          description?: string | null;
          start_at?: string | null;
          end_at?: string | null;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      display_settings: {
        Row: {
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
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_name?: string;
          welcome_text?: string | null;
          rotation_interval_seconds?: number;
          show_announcements?: boolean;
          show_events?: boolean;
          show_highlights?: boolean;
          show_qr_links?: boolean;
          show_opening_hours?: boolean;
          opening_hours_text?: string | null;
          fallback_message?: string | null;
          accent_color?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_name?: string;
          welcome_text?: string | null;
          rotation_interval_seconds?: number;
          show_announcements?: boolean;
          show_events?: boolean;
          show_highlights?: boolean;
          show_qr_links?: boolean;
          show_opening_hours?: boolean;
          opening_hours_text?: string | null;
          fallback_message?: string | null;
          accent_color?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
