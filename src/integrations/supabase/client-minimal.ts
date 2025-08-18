// Minimal Supabase client that avoids realtime-js entirely
import { SupabaseClient } from "@supabase/supabase-js";
import { PostgrestClient } from "@supabase/postgrest-js";
import { GoTrueClient } from "@supabase/gotrue-js";
import type { Database } from "./types";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ahqqptrclqtwqjgmtesv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocXFwdHJjbHF0d3FqZ210ZXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDM3NTMsImV4cCI6MjA2OTkxOTc1M30.FRFHf-XvnBLzZvcGseS82HJIORQXs_8OEEVq0RpabN0";

// Create minimal client that only includes database and auth functionality
class MinimalSupabaseClient {
  private _postgrestClient: PostgrestClient;
  private _authClient: GoTrueClient;
  
  constructor(url: string, key: string) {
    this._postgrestClient = new PostgrestClient(
      `${url}/rest/v1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    
    this._authClient = new GoTrueClient({
      url: `${url}/auth/v1`,
      headers: { apikey: key },
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    });
  }
  
  get auth() {
    return this._authClient;
  }
  
  from(table: string) {
    return this._postgrestClient.from(table);
  }
}

// Create the minimal client instance
export const supabase = new MinimalSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) as any as SupabaseClient<Database>;
