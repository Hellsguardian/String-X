import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, isSupabaseConfigured } from './env';

/**
 * Creates a safe unconfigured proxy to prevent crashes during initial boot
 * or builds when environment variables are not yet provided.
 */
function createUnconfiguredProxy(path = 'supabase'): any {
  return new Proxy(() => {}, {
    get(_target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return undefined;
      }
      return createUnconfiguredProxy(`${path}.${String(prop)}`);
    },
    apply(_target, _thisArg, _args) {
      console.warn(
        `[Supabase] Call to '${path}()' ignored because Supabase is not configured. ` +
        `Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env.local.`
      );
      return Promise.resolve({
        data: null,
        error: new Error(`Supabase client is not configured: ${path} called.`),
      });
    },
  });
}

/**
 * Centralized Supabase Client Singleton
 * Read exclusively from Vite environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)
 * without hardcoding credentials in source code.
 */
export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : (createUnconfiguredProxy() as SupabaseClient<Database>);
