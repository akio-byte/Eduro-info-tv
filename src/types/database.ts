export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          created_at: string
          end_at: string | null
          id: string
          is_pinned: boolean
          is_published: boolean
          priority: string
          start_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          end_at?: string | null
          id?: string
          is_pinned?: boolean
          is_published?: boolean
          priority?: string
          start_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          end_at?: string | null
          id?: string
          is_pinned?: boolean
          is_published?: boolean
          priority?: string
          start_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contents: {
        Row: {
          auto_qr: boolean
          body: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          created_by: string | null
          end_at: string | null
          external_link: string | null
          id: string
          image_url: string | null
          manual_order: number | null
          priority: number
          screen_target: string
          short_description: string | null
          start_at: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          auto_qr?: boolean
          body?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          created_by?: string | null
          end_at?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          manual_order?: number | null
          priority?: number
          screen_target?: string
          short_description?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          auto_qr?: boolean
          body?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          created_by?: string | null
          end_at?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          manual_order?: number | null
          priority?: number
          screen_target?: string
          short_description?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      display_settings: {
        Row: {
          accent_color: string
          fallback_message: string | null
          hero_subtitle: string | null
          id: string
          opening_hours_mon_fri: string | null
          opening_hours_sat: string | null
          opening_hours_sun: string | null
          opening_hours_text: string | null
          org_name: string
          rotation_interval_seconds: number
          rss_feed_url: string | null
          rss_max_items: number
          show_announcements: boolean
          show_events: boolean
          show_highlights: boolean
          show_jobs: boolean
          show_opening_hours: boolean
          show_qr_links: boolean
          show_rss: boolean
          updated_at: string
          welcome_text: string | null
        }
        Insert: {
          accent_color?: string
          fallback_message?: string | null
          hero_subtitle?: string | null
          id?: string
          opening_hours_mon_fri?: string | null
          opening_hours_sat?: string | null
          opening_hours_sun?: string | null
          opening_hours_text?: string | null
          org_name?: string
          rotation_interval_seconds?: number
          rss_feed_url?: string | null
          rss_max_items?: number
          show_announcements?: boolean
          show_events?: boolean
          show_highlights?: boolean
          show_jobs?: boolean
          show_opening_hours?: boolean
          show_qr_links?: boolean
          show_rss?: boolean
          updated_at?: string
          welcome_text?: string | null
        }
        Update: {
          accent_color?: string
          fallback_message?: string | null
          hero_subtitle?: string | null
          id?: string
          opening_hours_mon_fri?: string | null
          opening_hours_sat?: string | null
          opening_hours_sun?: string | null
          opening_hours_text?: string | null
          org_name?: string
          rotation_interval_seconds?: number
          rss_feed_url?: string | null
          rss_max_items?: number
          show_announcements?: boolean
          show_events?: boolean
          show_highlights?: boolean
          show_jobs?: boolean
          show_opening_hours?: boolean
          show_qr_links?: boolean
          show_rss?: boolean
          updated_at?: string
          welcome_text?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          is_published: boolean
          location: string | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          is_published?: boolean
          location?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          is_published?: boolean
          location?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      highlights: {
        Row: {
          body: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          end_at: string | null
          id: string
          image_path: string | null
          image_url: string | null
          is_published: boolean
          sort_order: number
          start_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          end_at?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_published?: boolean
          sort_order?: number
          start_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          end_at?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_published?: boolean
          sort_order?: number
          start_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          apply_url: string | null
          created_at: string
          department: string | null
          description: string | null
          end_at: string | null
          id: string
          is_published: boolean
          location: string | null
          sort_order: number
          start_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          apply_url?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          sort_order?: number
          start_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          apply_url?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          sort_order?: number
          start_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      qr_links: {
        Row: {
          created_at: string
          description: string | null
          end_at: string | null
          id: string
          is_published: boolean
          sort_order: number
          start_at: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_at?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          start_at?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_at?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          start_at?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_status: "draft" | "published" | "expired"
      content_type: "announcement" | "event" | "image" | "video" | "highlight"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_status: ["draft", "published", "expired"],
      content_type: ["announcement", "event", "image", "video", "highlight"],
    },
  },
} as const
