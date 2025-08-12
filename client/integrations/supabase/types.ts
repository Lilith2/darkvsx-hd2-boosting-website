export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      bundles: {
        Row: {
          active: boolean | null;
          badge: string | null;
          created_at: string | null;
          description: string;
          discount: number;
          discounted_price: number;
          duration: string;
          features: string[] | null;
          id: string;
          name: string;
          orders_count: number | null;
          original_price: number;
          popular: boolean | null;
          services: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          badge?: string | null;
          created_at?: string | null;
          description: string;
          discount: number;
          discounted_price: number;
          duration: string;
          features?: string[] | null;
          id?: string;
          name: string;
          orders_count?: number | null;
          original_price: number;
          popular?: boolean | null;
          services?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          badge?: string | null;
          created_at?: string | null;
          description?: string;
          discount?: number;
          discounted_price?: number;
          duration?: string;
          features?: string[] | null;
          id?: string;
          name?: string;
          orders_count?: number | null;
          original_price?: number;
          popular?: boolean | null;
          services?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      order_messages: {
        Row: {
          created_at: string | null;
          from: string;
          id: string;
          is_read: boolean | null;
          message: string;
          order_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          from: string;
          id?: string;
          is_read?: boolean | null;
          message: string;
          order_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          from?: string;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          order_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_tracking: {
        Row: {
          created_at: string | null;
          description: string;
          id: string;
          order_id: string | null;
          status: string;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          id?: string;
          order_id?: string | null;
          status: string;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          id?: string;
          order_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_tracking_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          assigned_booster: string | null;
          created_at: string | null;
          customer_email: string;
          customer_name: string;
          estimated_completion: string | null;
          id: string;
          ip_address: string | null;
          notes: string | null;
          payment_status: string;
          progress: number | null;
          referral_code: string | null;
          referral_credits_used: number | null;
          referral_discount: number | null;
          services: Json;
          status: string;
          total_amount: number;
          transaction_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          assigned_booster?: string | null;
          created_at?: string | null;
          customer_email: string;
          customer_name: string;
          estimated_completion?: string | null;
          id?: string;
          ip_address?: unknown | null;
          notes?: string | null;
          payment_status?: string;
          progress?: number | null;
          referral_code?: string | null;
          referral_credits_used?: number | null;
          referral_discount?: number | null;
          services?: Json;
          status?: string;
          total_amount: number;
          transaction_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          assigned_booster?: string | null;
          created_at?: string | null;
          customer_email?: string;
          customer_name?: string;
          estimated_completion?: string | null;
          id?: string;
          ip_address?: unknown | null;
          notes?: string | null;
          payment_status?: string;
          progress?: number | null;
          referral_code?: string | null;
          referral_credits_used?: number | null;
          referral_discount?: number | null;
          services?: Json;
          status?: string;
          total_amount?: number;
          transaction_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string | null;
          credit_balance: number | null;
          discord_username: string | null;
          email: string | null;
          id: string;
          role: string | null;
          total_credits_earned: number | null;
          total_credits_used: number | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          created_at?: string | null;
          credit_balance?: number | null;
          discord_username?: string | null;
          email?: string | null;
          id: string;
          role?: string | null;
          total_credits_earned?: number | null;
          total_credits_used?: number | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          created_at?: string | null;
          credit_balance?: number | null;
          discord_username?: string | null;
          email?: string | null;
          id?: string;
          role?: string | null;
          total_credits_earned?: number | null;
          total_credits_used?: number | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      services: {
        Row: {
          active: boolean | null;
          category: string | null;
          created_at: string | null;
          description: string;
          difficulty: string;
          duration: string;
          features: string[] | null;
          id: string;
          orders_count: number | null;
          original_price: number | null;
          popular: boolean | null;
          price: number;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          category?: string | null;
          created_at?: string | null;
          description: string;
          difficulty: string;
          duration: string;
          features?: string[] | null;
          id?: string;
          orders_count?: number | null;
          original_price?: number | null;
          popular?: boolean | null;
          price: number;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          category?: string | null;
          created_at?: string | null;
          description?: string;
          difficulty?: string;
          duration?: string;
          features?: string[] | null;
          id?: string;
          orders_count?: number | null;
          original_price?: number | null;
          popular?: boolean | null;
          price?: number;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _user_id: string;
          _role: Database["public"]["Enums"]["app_role"];
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
