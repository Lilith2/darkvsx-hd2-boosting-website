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
      custom_pricing: {
        Row: {
          id: string;
          category: string;
          item_name: string;
          base_price: number;
          price_per_unit: number;
          minimum_quantity: number;
          maximum_quantity: number | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          item_name: string;
          base_price?: number;
          price_per_unit?: number;
          minimum_quantity?: number;
          maximum_quantity?: number | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          item_name?: string;
          base_price?: number;
          price_per_unit?: number;
          minimum_quantity?: number;
          maximum_quantity?: number | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          customer_email: string;
          customer_name: string;
          services: Json;
          status: string;
          total_amount: number;
          payment_status: string;
          progress: number | null;
          assigned_booster: string | null;
          estimated_completion: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          ip_address: string | null;
          transaction_id: string | null;
          referral_code: string | null;
          referral_discount: number | null;
          credits_used: number | null;
          status_history: Json | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          customer_email: string;
          customer_name: string;
          services?: Json;
          status?: string;
          total_amount: number;
          payment_status?: string;
          progress?: number | null;
          assigned_booster?: string | null;
          estimated_completion?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          ip_address?: string | null;
          transaction_id?: string | null;
          referral_code?: string | null;
          referral_discount?: number | null;
          credits_used?: number | null;
          status_history?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          customer_email?: string;
          customer_name?: string;
          services?: Json;
          status?: string;
          total_amount?: number;
          payment_status?: string;
          progress?: number | null;
          assigned_booster?: string | null;
          estimated_completion?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          ip_address?: string | null;
          transaction_id?: string | null;
          referral_code?: string | null;
          referral_discount?: number | null;
          credits_used?: number | null;
          status_history?: Json | null;
        };
        Relationships: [];
      };
      order_messages: {
        Row: {
          id: string;
          order_id: string | null;
          from: string;
          message: string;
          is_read: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          from: string;
          message: string;
          is_read?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          from?: string;
          message?: string;
          is_read?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      order_tracking: {
        Row: {
          id: string;
          order_id: string | null;
          status: string;
          description: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          status: string;
          description: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          status?: string;
          description?: string;
          created_at?: string | null;
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
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          original_price: number | null;
          duration: string;
          difficulty: string;
          features: string[] | null;
          active: boolean | null;
          popular: boolean | null;
          orders_count: number | null;
          created_at: string | null;
          updated_at: string | null;
          category: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          price: number;
          original_price?: number | null;
          duration: string;
          difficulty: string;
          features?: string[] | null;
          active?: boolean | null;
          popular?: boolean | null;
          orders_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          category?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          price?: number;
          original_price?: number | null;
          duration?: string;
          difficulty?: string;
          features?: string[] | null;
          active?: boolean | null;
          popular?: boolean | null;
          orders_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          category?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never;
