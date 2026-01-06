import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables, supporting both standard and NEXT_PUBLIC_ prefixes.
// We treat empty strings as missing values to trigger the fallback and prevent crashes.
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envKey || 'placeholder';

if (!envUrl || !envKey) {
  console.warn("Supabase URL or Anon Key is missing. Authentication features will not work until you configure them in .env.local.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
