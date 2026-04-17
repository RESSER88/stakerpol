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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      deepl_api_keys: {
        Row: {
          api_key_encrypted: string
          api_key_masked: string
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          last_sync_at: string | null
          last_test_at: string | null
          name: string
          quota_limit: number | null
          quota_remaining: number | null
          quota_reset_date: string | null
          quota_used: number | null
          status: string
          updated_at: string
        }
        Insert: {
          api_key_encrypted: string
          api_key_masked: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          last_sync_at?: string | null
          last_test_at?: string | null
          name: string
          quota_limit?: number | null
          quota_remaining?: number | null
          quota_reset_date?: string | null
          quota_used?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          api_key_encrypted?: string
          api_key_masked?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          last_sync_at?: string | null
          last_test_at?: string | null
          name?: string
          quota_limit?: number | null
          quota_remaining?: number | null
          quota_reset_date?: string | null
          quota_used?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          language: string
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          language: string
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          language?: string
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          id: string
          page_url: string | null
          phone: string
          product_id: string | null
          source: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_url?: string | null
          phone: string
          product_id?: string | null
          source?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_url?: string | null
          phone?: string
          product_id?: string | null
          source?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string | null
          product_model: string
          quantity: number
          total_price_net: number
          unit_price_net: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id?: string | null
          product_model: string
          quantity?: number
          total_price_net: number
          unit_price_net: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_model?: string
          quantity?: number
          total_price_net?: number
          unit_price_net?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_company: string | null
          customer_email: string
          customer_name: string
          customer_nip: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          order_number: string
          shipping_address: string
          status: string | null
          total_gross: number
          total_net: number
          updated_at: string | null
          vat_amount: number
          vat_rate: number | null
        }
        Insert: {
          created_at?: string | null
          customer_company?: string | null
          customer_email: string
          customer_name: string
          customer_nip?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number: string
          shipping_address: string
          status?: string | null
          total_gross: number
          total_net: number
          updated_at?: string | null
          vat_amount: number
          vat_rate?: number | null
        }
        Update: {
          created_at?: string | null
          customer_company?: string | null
          customer_email?: string
          customer_name?: string
          customer_nip?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          shipping_address?: string
          status?: string | null
          total_gross?: number
          total_net?: number
          updated_at?: string | null
          vat_amount?: number
          vat_rate?: number | null
        }
        Relationships: []
      }
      price_inquiries: {
        Row: {
          created_at: string
          id: string
          language: string
          message: string | null
          page_url: string | null
          phone: string | null
          product_id: string | null
          product_model: string
          production_year: string | null
          serial_number: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          language: string
          message?: string | null
          page_url?: string | null
          phone?: string | null
          product_id?: string | null
          product_model: string
          production_year?: string | null
          serial_number?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          message?: string | null
          page_url?: string | null
          phone?: string | null
          product_id?: string | null
          product_model?: string
          production_year?: string | null
          serial_number?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      product_benefits: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string
          id: string
          product_id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          product_id: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          product_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_benefits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_seo_settings: {
        Row: {
          availability: string | null
          created_at: string | null
          enable_schema: boolean | null
          gtin: string | null
          id: string
          item_condition: string | null
          mpn: string | null
          price: number | null
          price_currency: string | null
          price_valid_until: string | null
          product_id: string
          updated_at: string | null
          validation_errors: Json | null
          validation_status: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          enable_schema?: boolean | null
          gtin?: string | null
          id?: string
          item_condition?: string | null
          mpn?: string | null
          price?: number | null
          price_currency?: string | null
          price_valid_until?: string | null
          product_id: string
          updated_at?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          enable_schema?: boolean | null
          gtin?: string | null
          id?: string
          item_condition?: string | null
          mpn?: string | null
          price?: number | null
          price_currency?: string | null
          price_valid_until?: string | null
          product_id?: string
          updated_at?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_seo_settings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_translations: {
        Row: {
          created_at: string
          field_name: string
          id: string
          language: string
          product_id: string
          translated_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          language: string
          product_id: string
          translated_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          language?: string
          product_id?: string
          translated_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_translations_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          additional_options: string | null
          availability_status: Database["public"]["Enums"]["availability_status"]
          battery: string | null
          condition: string | null
          condition_label: string | null
          created_at: string
          detailed_description: string | null
          dimensions: string | null
          drive_type: string | null
          faq_ids: string[] | null
          foldable_platform: string | null
          free_lift: number | null
          id: string
          image_url: string | null
          initial_lift: string | null
          is_featured: boolean
          leasing_monthly_from_pln: number | null
          lift_capacity_initial: number | null
          lift_capacity_mast: number | null
          lift_height: number | null
          mast: string | null
          min_height: number | null
          name: string
          net_price: number | null
          price_currency: string | null
          price_display_mode: string | null
          production_year: number | null
          serial_number: string
          short_description: string | null
          short_marketing_description: string | null
          slogan: string | null
          slug: string
          updated_at: string
          warranty_months: number
          wheels: string | null
          working_hours: number | null
        }
        Insert: {
          additional_options?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status"]
          battery?: string | null
          condition?: string | null
          condition_label?: string | null
          created_at?: string
          detailed_description?: string | null
          dimensions?: string | null
          drive_type?: string | null
          faq_ids?: string[] | null
          foldable_platform?: string | null
          free_lift?: number | null
          id?: string
          image_url?: string | null
          initial_lift?: string | null
          is_featured?: boolean
          leasing_monthly_from_pln?: number | null
          lift_capacity_initial?: number | null
          lift_capacity_mast?: number | null
          lift_height?: number | null
          mast?: string | null
          min_height?: number | null
          name: string
          net_price?: number | null
          price_currency?: string | null
          price_display_mode?: string | null
          production_year?: number | null
          serial_number: string
          short_description?: string | null
          short_marketing_description?: string | null
          slogan?: string | null
          slug: string
          updated_at?: string
          warranty_months?: number
          wheels?: string | null
          working_hours?: number | null
        }
        Update: {
          additional_options?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status"]
          battery?: string | null
          condition?: string | null
          condition_label?: string | null
          created_at?: string
          detailed_description?: string | null
          dimensions?: string | null
          drive_type?: string | null
          faq_ids?: string[] | null
          foldable_platform?: string | null
          free_lift?: number | null
          id?: string
          image_url?: string | null
          initial_lift?: string | null
          is_featured?: boolean
          leasing_monthly_from_pln?: number | null
          lift_capacity_initial?: number | null
          lift_capacity_mast?: number | null
          lift_height?: number | null
          mast?: string | null
          min_height?: number | null
          name?: string
          net_price?: number | null
          price_currency?: string | null
          price_display_mode?: string | null
          production_year?: number | null
          serial_number?: string
          short_description?: string | null
          short_marketing_description?: string | null
          slogan?: string | null
          slug?: string
          updated_at?: string
          warranty_months?: number
          wheels?: string | null
          working_hours?: number | null
        }
        Relationships: []
      }
      social_media_posts: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          post_id: string | null
          posted_at: string | null
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          post_id?: string | null
          posted_at?: string | null
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          post_id?: string | null
          posted_at?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_jobs: {
        Row: {
          characters_used: number | null
          content_id: string
          content_type: string
          created_at: string
          error_message: string | null
          id: string
          source_content: string
          source_language: string
          status: string
          target_language: string
          translated_content: string | null
          translation_mode: string | null
          updated_at: string
        }
        Insert: {
          characters_used?: number | null
          content_id: string
          content_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          source_content: string
          source_language?: string
          status?: string
          target_language: string
          translated_content?: string | null
          translation_mode?: string | null
          updated_at?: string
        }
        Update: {
          characters_used?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          source_content?: string
          source_language?: string
          status?: string
          target_language?: string
          translated_content?: string | null
          translation_mode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      translation_logs: {
        Row: {
          api_key_used: string
          characters_used: number | null
          created_at: string
          error_details: string | null
          field_name: string
          id: string
          processing_time_ms: number | null
          product_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          source_language: string
          status: string
          target_language: string
          translation_mode: string
        }
        Insert: {
          api_key_used: string
          characters_used?: number | null
          created_at?: string
          error_details?: string | null
          field_name: string
          id?: string
          processing_time_ms?: number | null
          product_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          source_language: string
          status: string
          target_language: string
          translation_mode: string
        }
        Update: {
          api_key_used?: string
          characters_used?: number | null
          created_at?: string
          error_details?: string | null
          field_name?: string
          id?: string
          processing_time_ms?: number | null
          product_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          source_language?: string
          status?: string
          target_language?: string
          translation_mode?: string
        }
        Relationships: []
      }
      translation_stats: {
        Row: {
          api_calls: number | null
          characters_limit: number | null
          characters_used: number | null
          created_at: string
          id: string
          month_year: string
          updated_at: string
        }
        Insert: {
          api_calls?: number | null
          characters_limit?: number | null
          characters_used?: number | null
          created_at?: string
          id?: string
          month_year: string
          updated_at?: string
        }
        Update: {
          api_calls?: number | null
          characters_limit?: number | null
          characters_used?: number | null
          created_at?: string
          id?: string
          month_year?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      bytea_to_text: { Args: { data: string }; Returns: string }
      generate_product_slug: {
        Args: { product_name: string; serial_number?: string }
        Returns: string
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_rotation_stats: { Args: never; Returns: Json }
      get_unposted_product:
        | { Args: { platform_name: string }; Returns: Json }
        | {
            Args: { auto_reset?: boolean; platform_name: string }
            Returns: Json
          }
      get_unposted_product_debug: {
        Args: { auto_reset?: boolean; platform_name: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      health_check: { Args: never; Returns: Json }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      log_social_post: {
        Args: {
          external_post_id?: string
          platform_name: string
          product_uuid: string
        }
        Returns: Json
      }
      reset_platform_rotation: {
        Args: { platform_name: string }
        Returns: Json
      }
      security_audit: { Args: never; Returns: Json }
      text_to_bytea: { Args: { data: string }; Returns: string }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
    }
    Enums: {
      app_role: "admin" | "user"
      availability_status: "available" | "reserved" | "sold"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
      app_role: ["admin", "user"],
      availability_status: ["available", "reserved", "sold"],
    },
  },
} as const
