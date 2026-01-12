import { createClient } from '@supabase/supabase-js';

// Safely access process.env to prevent crashes in environments where it's undefined
const getEnv = (key: string) => {
  try {
    // In Next.js/Create-React-App build times, process.env is replaced.
    // In browser runtimes, this might throw or be undefined.
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore error
  }
  return '';
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'ZenDo: Supabase environment variables are missing. ' +
    'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

// Create a client if keys exist, otherwise return a safe mock to prevent "supabaseUrl is required" crash
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: { message: 'Supabase credentials missing' } }),
        insert: () => Promise.resolve({ error: { message: 'Supabase credentials missing' } }),
        update: () => Promise.resolve({ error: { message: 'Supabase credentials missing' } }),
        delete: () => Promise.resolve({ error: { message: 'Supabase credentials missing' } }),
      })
    } as any;
