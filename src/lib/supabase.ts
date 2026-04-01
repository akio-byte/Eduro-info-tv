import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
export const isMockSupabase =
  import.meta.env.VITE_ENABLE_MOCK_MODE === 'true' || !hasSupabaseEnv;

if (!hasSupabaseEnv && import.meta.env.VITE_ENABLE_MOCK_MODE !== 'true') {
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY. Falling back to mock mode for startup.'
  );
}

// If in mock mode but missing URL/Key, provide dummy values to prevent createClient from crashing,
// even though we won't actually use the client for data fetching.
export const supabase = createClient<any>(
  supabaseUrl || 'https://mock.supabase.co',
  supabaseAnonKey || 'mock-key'
);
