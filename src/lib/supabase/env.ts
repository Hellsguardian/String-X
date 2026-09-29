/**
 * Supabase environment configuration
 * Exclusively reads credentials from Vite environment variables (import.meta.env)
 * Supports both VITE_SUPABASE_PUBLISHABLE_KEY and VITE_SUPABASE_ANON_KEY
 */

const metaEnv: Record<string, string | undefined> = 
  typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env as any) : {};
const procEnv: Record<string, string | undefined> = 
  typeof process !== 'undefined' && process.env ? process.env : {};

export const SUPABASE_URL: string = (
  metaEnv.VITE_SUPABASE_URL || 
  procEnv.VITE_SUPABASE_URL ||
  'https://nutavlypeasbadcaqobw.supabase.co'
).trim();

export const SUPABASE_PUBLISHABLE_KEY: string = (
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || 
  metaEnv.VITE_SUPABASE_ANON_KEY || 
  procEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  procEnv.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

// Alias for backward compatibility across existing services
export const SUPABASE_ANON_KEY: string = SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured: boolean = Boolean(
  SUPABASE_URL && 
  SUPABASE_PUBLISHABLE_KEY && 
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_PUBLISHABLE_KEY.includes('your-publishable-key') &&
  !SUPABASE_PUBLISHABLE_KEY.includes('your-anon-key')
);
