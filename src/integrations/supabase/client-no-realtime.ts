// Alternative Supabase client without realtime features for better webpack compatibility
// This now re-exports the shared client from the main client module to prevent multiple instances
import { supabase as sharedSupabaseClient } from "./client";

// Export the shared client to prevent multiple GoTrueClient instances
export const supabaseNoRealtime = sharedSupabaseClient;
export const supabase = sharedSupabaseClient;
