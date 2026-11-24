// Supabase client configuration. Never silently fall back to mock credentials in a deployed build.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { mockSupabase } from './mockClient';
import { firebaseAdapter } from './firebaseAdapter';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

if (import.meta.env.PROD && USE_MOCK) {
  throw new Error('AniGuard mock authentication is disabled in deployed builds.');
}

if (!USE_FIREBASE && !USE_MOCK && (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error('AniGuard requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Configure them before starting the app.');
}

export const supabase = (
  USE_FIREBASE
    ? firebaseAdapter
    : USE_MOCK
      ? mockSupabase
      : createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: {
            storage: localStorage,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        })
) as unknown as ReturnType<typeof createClient<Database>>;
