import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isMockSupabase = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

if (isMockSupabase && import.meta.env.PROD && !isLocalHost) {
  throw new Error(
    'Mock mode is blocked for production deployments. Disable VITE_ENABLE_MOCK_MODE in production.'
  );
}

if (!isMockSupabase && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or enable mock mode with VITE_ENABLE_MOCK_MODE=true.'
  );
}

// If in mock mode but missing URL/Key, provide dummy values to prevent createClient from crashing,
// even though we won't actually use the client for data fetching.
export const supabase = createClient<Database>(
  supabaseUrl || 'https://mock.supabase.co',
  supabaseAnonKey || 'mock-key'
);
