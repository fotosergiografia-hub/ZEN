import { createClient } from '@supabase/supabase-js';

// Access environment variables directly so bundlers (Vite, Webpack, Next.js) can replace them at build time.
// Dynamic access via process.env[key] often fails in these environments.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Export a flag to check if Supabase is actually usable
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn(
    'ZenDo: Supabase environment variables are missing. App will fallback to LocalStorage. ' +
    'To sync data, ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel/Environment.'
  );
}

// Mock builder to handle chaining like .select().order().eq()
const createMockBuilder = () => {
  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    order: () => builder,
    eq: () => builder,
    single: () => builder,
    limit: () => builder,
    // Make the object thenable so it can be awaited like a real Supabase promise
    then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => {
      return Promise.resolve({ 
        data: [], 
        error: { message: 'Supabase credentials missing (Mock Mode)' },
        count: null,
        status: 200,
        statusText: 'OK'
      }).then(onfulfilled, onrejected);
    }
  };
  return builder;
};

// Create a client if keys exist, otherwise return a robust mock
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : {
      from: () => createMockBuilder()
    } as any;