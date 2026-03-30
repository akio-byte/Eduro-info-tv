import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper to check if we are using mock credentials (for preview purposes)
export const isMockSupabase = supabaseUrl === 'https://mock.supabase.co';
