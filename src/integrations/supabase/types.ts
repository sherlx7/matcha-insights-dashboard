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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      client_allocations: {
        Row: {
          allocated_kg: number
          client_id: string
          created_at: string
          id: string
          notes: string | null
          product_id: string
          reserved_until: string | null
          updated_at: string
        }
        Insert: {
          allocated_kg?: number
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          reserved_until?: string | null
          updated_at?: string
        }
        Update: {
          allocated_kg?: number
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          reserved_until?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "matcha_products"
            referencedColumns: ["id"]
          },
        ]
      }
      client_orders: {
        Row: {
          client_id: string
          created_at: string
          id: string
          order_date: string
          product_id: string
          quantity_kg: number
          scheduled_delivery_date: string | null
          status: string
          total_revenue: number | null
          unit_price: number
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          order_date?: string
          product_id: string
          quantity_kg: number
          scheduled_delivery_date?: string | null
          status?: string
          total_revenue?: number | null
          unit_price: number
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          order_date?: string
          product_id?: string
          quantity_kg?: number
          scheduled_delivery_date?: string | null
          status?: string
          total_revenue?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "matcha_products"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          delivery_day_of_month: number | null
          discount_percent: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          delivery_day_of_month?: number | null
          discount_percent?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          delivery_day_of_month?: number | null
          discount_percent?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_changes: {
        Row: {
          change_reason: string | null
          changed_at: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          product_id: string
          reverted_at: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          product_id: string
          reverted_at?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          product_id?: string
          reverted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_changes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "matcha_products"
            referencedColumns: ["id"]
          },
        ]
      }
      matcha_products: {
        Row: {
          cost_per_kg: number
          cost_per_kg_jpy: number | null
          created_at: string
          grade: string
          id: string
          name: string
          origin: string
          quality_score: number
          reorder_point_kg: number | null
          reorder_quantity_kg: number | null
          selling_price_per_kg: number | null
          status: string
          stock_kg: number
          updated_at: string
        }
        Insert: {
          cost_per_kg: number
          cost_per_kg_jpy?: number | null
          created_at?: string
          grade: string
          id?: string
          name: string
          origin: string
          quality_score: number
          reorder_point_kg?: number | null
          reorder_quantity_kg?: number | null
          selling_price_per_kg?: number | null
          status?: string
          stock_kg?: number
          updated_at?: string
        }
        Update: {
          cost_per_kg?: number
          cost_per_kg_jpy?: number | null
          created_at?: string
          grade?: string
          id?: string
          name?: string
          origin?: string
          quality_score?: number
          reorder_point_kg?: number | null
          reorder_quantity_kg?: number | null
          selling_price_per_kg?: number | null
          status?: string
          stock_kg?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_change_requests: {
        Row: {
          change_type: string
          created_at: string
          id: string
          new_stock_kg: number | null
          notes: string | null
          product_id: string
          quantity_kg: number
          reason: string
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          change_type: string
          created_at?: string
          id?: string
          new_stock_kg?: number | null
          notes?: string | null
          product_id: string
          quantity_kg: number
          reason: string
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          change_type?: string
          created_at?: string
          id?: string
          new_stock_kg?: number | null
          notes?: string | null
          product_id?: string
          quantity_kg?: number
          reason?: string
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_change_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "matcha_products"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          created_at: string
          id: string
          is_primary_supplier: boolean | null
          last_price_update: string | null
          min_order_kg: number | null
          notes: string | null
          product_id: string
          supplier_id: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary_supplier?: boolean | null
          last_price_update?: string | null
          min_order_kg?: number | null
          notes?: string | null
          product_id: string
          supplier_id: string
          unit_cost: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary_supplier?: boolean | null
          last_price_update?: string | null
          min_order_kg?: number | null
          notes?: string | null
          product_id?: string
          supplier_id?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "matcha_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          exchange_rate_jpy_usd: number | null
          id: string
          lead_time_days: number | null
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          exchange_rate_jpy_usd?: number | null
          id?: string
          lead_time_days?: number | null
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          exchange_rate_jpy_usd?: number | null
          id?: string
          lead_time_days?: number | null
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_access_financials: boolean
          can_access_operations: boolean
          can_access_sandbox: boolean
          id: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          can_access_financials?: boolean
          can_access_operations?: boolean
          can_access_sandbox?: boolean
          id?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          can_access_financials?: boolean
          can_access_operations?: boolean
          can_access_sandbox?: boolean
          id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
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
      warehouse_arrivals: {
        Row: {
          arrival_date: string
          batch_number: string | null
          cost_per_kg_jpy: number | null
          created_at: string
          exchange_rate_used: number | null
          expiry_date: string | null
          id: string
          notes: string | null
          product_id: string
          quantity_kg: number
          status: string
          supplier_id: string
          unit_cost: number
        }
        Insert: {
          arrival_date?: string
          batch_number?: string | null
          cost_per_kg_jpy?: number | null
          created_at?: string
          exchange_rate_used?: number | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity_kg: number
          status?: string
          supplier_id: string
          unit_cost: number
        }
        Update: {
          arrival_date?: string
          batch_number?: string | null
          cost_per_kg_jpy?: number | null
          created_at?: string
          exchange_rate_used?: number | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity_kg?: number
          status?: string
          supplier_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_arrivals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "matcha_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_arrivals_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          can_access_financials: boolean
          can_access_operations: boolean
          can_access_sandbox: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      approval_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user"],
      approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const
