import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ahqqptrclqtwqjgmtesv.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocXFwdHJjbHF0d3FqZ210ZXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDM3NTMsImV4cCI6MjA2OTkxOTc1M30.FRFHf-XvnBLzZvcGseS82HJIORQXs_8OEEVq0RpabN0";

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      "X-Client-Info": "fusion-starter",
    },
  },
});

// Clean, simple types
export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price: number | null;
  duration: string;
  difficulty: string;
  features: string[];
  active: boolean;
  popular: boolean;
  orders_count: number;
  category:
    | "Level Boost"
    | "Medals"
    | "Samples"
    | "Super Credits"
    | "Promotions";
  created_at: string;
  updated_at: string;
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  services: string[];
  original_price: number;
  discounted_price: number;
  discount: number;
  duration: string;
  popular: boolean;
  badge: string | null;
  features: string[];
  active: boolean;
  orders_count: number;
  created_at: string;
  updated_at: string;
}
