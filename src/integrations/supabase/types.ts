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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          actor: string
          created_at: string
          id: string
          message: string
          type: string
        }
        Insert: {
          actor?: string
          created_at?: string
          id?: string
          message?: string
          type?: string
        }
        Update: {
          actor?: string
          created_at?: string
          id?: string
          message?: string
          type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_by: string[]
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          read_by?: string[]
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_by?: string[]
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          badge: string
          category: string
          created_at: string
          description: string
          download_link: string
          files: Json
          id: string
          image_url: string | null
          in_stock: boolean
          name: string
          price: number
          price_monthly: number | null
          price_weekly: number | null
          video_url: string
        }
        Insert: {
          badge?: string
          category: string
          created_at?: string
          description?: string
          download_link?: string
          files?: Json
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name: string
          price: number
          price_monthly?: number | null
          price_weekly?: number | null
          video_url?: string
        }
        Update: {
          badge?: string
          category?: string
          created_at?: string
          description?: string
          download_link?: string
          files?: Json
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name?: string
          price?: number
          price_monthly?: number | null
          price_weekly?: number | null
          video_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          created_at: string
          email: string
          full_name: string | null
          id: string
          level: number
          total_spent: number
          username: string | null
          whatsapp: string | null
          xp: number
        }
        Insert: {
          balance?: number
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          level?: number
          total_spent?: number
          username?: string | null
          whatsapp?: string | null
          xp?: number
        }
        Update: {
          balance?: number
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          level?: number
          total_spent?: number
          username?: string | null
          whatsapp?: string | null
          xp?: number
        }
        Relationships: []
      }
      purchases: {
        Row: {
          credentials: string
          download_link: string
          files: Json
          id: string
          is_redeem: boolean
          plan: string
          price: number
          product_id: string | null
          product_name: string
          purchase_date: string
          status: string
          user_id: string
        }
        Insert: {
          credentials?: string
          download_link?: string
          files?: Json
          id?: string
          is_redeem?: boolean
          plan?: string
          price?: number
          product_id?: string | null
          product_name?: string
          purchase_date?: string
          status?: string
          user_id: string
        }
        Update: {
          credentials?: string
          download_link?: string
          files?: Json
          id?: string
          is_redeem?: boolean
          plan?: string
          price?: number
          product_id?: string | null
          product_name?: string
          purchase_date?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      redeem_codes: {
        Row: {
          access_key: string
          claimed_at: string | null
          claimed_by: string | null
          code: string
          created_at: string
          created_by: string | null
          download_link: string
          files: string | null
          id: string
          note: string
          product_id: string | null
          product_name: string
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          access_key?: string
          claimed_at?: string | null
          claimed_by?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          download_link?: string
          files?: string | null
          id?: string
          note?: string
          product_id?: string | null
          product_name?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          access_key?: string
          claimed_at?: string | null
          claimed_by?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          download_link?: string
          files?: string | null
          id?: string
          note?: string
          product_id?: string | null
          product_name?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          brand_name: string | null
          buy_template: string | null
          discord_url: string | null
          features: Json | null
          features_heading: string | null
          footer_status: string | null
          footer_text: string | null
          hero_badge: string | null
          hero_images: Json | null
          hero_primary_cta: string | null
          hero_secondary_cta: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          logo_emoji: string | null
          logo_image_url: string | null
          secure_heading: string | null
          secure_text: string | null
          stats: Json | null
          store_heading: string | null
          store_sub: string | null
          top_up_template: string | null
          updated_at: string | null
          videos: Json | null
          videos_heading: string | null
          videos_sub: string | null
          whatsapp_number: string | null
        }
        Insert: {
          brand_name?: string | null
          buy_template?: string | null
          discord_url?: string | null
          features?: Json | null
          features_heading?: string | null
          footer_status?: string | null
          footer_text?: string | null
          hero_badge?: string | null
          hero_images?: Json | null
          hero_primary_cta?: string | null
          hero_secondary_cta?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_emoji?: string | null
          logo_image_url?: string | null
          secure_heading?: string | null
          secure_text?: string | null
          stats?: Json | null
          store_heading?: string | null
          store_sub?: string | null
          top_up_template?: string | null
          updated_at?: string | null
          videos?: Json | null
          videos_heading?: string | null
          videos_sub?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          brand_name?: string | null
          buy_template?: string | null
          discord_url?: string | null
          features?: Json | null
          features_heading?: string | null
          footer_status?: string | null
          footer_text?: string | null
          hero_badge?: string | null
          hero_images?: Json | null
          hero_primary_cta?: string | null
          hero_secondary_cta?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_emoji?: string | null
          logo_image_url?: string | null
          secure_heading?: string | null
          secure_text?: string | null
          stats?: Json | null
          store_heading?: string | null
          store_sub?: string | null
          top_up_template?: string | null
          updated_at?: string | null
          videos?: Json | null
          videos_heading?: string | null
          videos_sub?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      ensure_profile: {
        Args: { _full_name?: string; _username?: string; _whatsapp?: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_code: {
        Args: { _code: string }
        Returns: {
          access_key: string
          claimed_at: string | null
          claimed_by: string | null
          code: string
          created_at: string
          created_by: string | null
          download_link: string
          files: string | null
          id: string
          note: string
          product_id: string | null
          product_name: string
          usage_count: number | null
          usage_limit: number | null
        }
        SetofOptions: {
          from: "*"
          to: "redeem_codes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
