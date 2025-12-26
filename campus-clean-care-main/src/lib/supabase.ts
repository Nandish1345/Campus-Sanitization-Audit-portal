
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safe client creation to prevent top-level module crash
// Use placeholder if missing so import succeeds, but requests will fail (caught by isSupabaseConfigured check in main.tsx)
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

// Helper to check if configured
export const isSupabaseConfigured = () => {
    return !!supabaseUrl && !!supabaseAnonKey;
};
