import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '../lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase/env';
import { ServiceResult, successResult, errorResult } from '../types/api';
import { Session, User } from '@supabase/supabase-js';

const MOCK_STORAGE_KEY_USER = 'stringx_mock_auth_user';
const MOCK_STORAGE_KEY_SESSION = 'stringx_mock_auth_session';

export interface AuthSessionData {
  user: User | null;
  session: Session | null;
}

export const authService = {
  /**
   * Sign in using Google OAuth via Supabase Auth
   */
  async signInWithGoogle(): Promise<ServiceResult<{ data: any }>> {
    try {
      const isNative = Capacitor.isNativePlatform();
      const redirectTo = isNative ? 'com.stringx.app://auth/callback' : window.location.origin;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: isNative,
        },
      });

      if (error) {
        console.error('[authService] Google OAuth error:', error);
        return errorResult(error.message, error.name, error);
      }

      if (isNative && data?.url) {
        await Browser.open({ url: data.url, windowName: '_self' });
      }

      return successResult({ data });
    } catch (err: any) {
      console.error('[authService] Google OAuth exception:', err);
      return errorResult(err.message || 'Failed to sign in with Google');
    }
  },

  /**
   * Reusable helper to determine whether an email is permitted to authenticate in StringX.
   * 1. Parul University student pattern (@paruluniversity.ac.in with numeric enrollment ID prefix)
   * 2. Developer/test accounts checked securely via Supabase RPC public.is_email_allowed()
   * (Frontend validation is for UX only; backend database trigger remains the authoritative gate).
   */
  async isEmailPermitted(email: string | null | undefined): Promise<boolean> {
    if (!email || !email.trim()) return false;
    const clean = email.toLowerCase().trim();

    // 1. Fast client-side check for official Parul University student format
    if (/^[0-9]+@paruluniversity\.ac\.in$/i.test(clean)) {
      return true;
    }

    // 2. Authoritative check for developer/tester allowlist via secure RPC
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase.rpc as any)('is_email_allowed', {
          p_email: clean,
        });
        if (!error && typeof data === 'boolean') {
          return data;
        }
      } catch (err) {
        console.warn('[authService] is_email_allowed RPC check notice:', err);
      }
    }

    return false;
  },

  /**
   * Send a 6-digit OTP code to the provided phone number via Supabase Auth
   */
  async sendPhoneOtp(phone: string): Promise<ServiceResult<{ message: string }>> {
    try {
      const cleanPhone = phone.replace(/\s+/g, '');
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.replace(/^0+/, '')}`;

      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });

        if (error) {
          return errorResult(error.message, error.name, error);
        }
      }

      return successResult({ message: `OTP sent successfully to ${phone}` });
    } catch (err: any) {
      return errorResult(err.message || 'Failed to send OTP code');
    }
  },

  /**
   * Verify the 6-digit OTP code
   */
  async verifyPhoneOtp(
    phone: string,
    token: string
  ): Promise<ServiceResult<{ user: User | null; session: Session | null }>> {
    try {
      const cleanPhone = phone.replace(/\s+/g, '');
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.replace(/^0+/, '')}`;

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token,
          type: 'sms',
        });

        if (error) {
          return errorResult(error.message, error.name, error);
        }

        return successResult({ user: data.user, session: data.session });
      }

      // Mock auth fallback for development / offline environments
      const mockUserId = `user_${formattedPhone.replace(/\D/g, '')}`;
      const mockUser = {
        id: mockUserId,
        phone: formattedPhone,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      const mockSession = {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        user: mockUser,
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
      } as unknown as Session;

      if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_STORAGE_KEY_USER, JSON.stringify(mockUser));
        localStorage.setItem(MOCK_STORAGE_KEY_SESSION, JSON.stringify(mockSession));
      }

      return successResult({ user: mockUser, session: mockSession });
    } catch (err: any) {
      return errorResult(err.message || 'Failed to verify OTP');
    }
  },

  /**
   * Retrieve the current active session
   */
  async getSession(): Promise<ServiceResult<AuthSessionData>> {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.getSession();
        if (error) return errorResult(error.message);
        return successResult({ user: data.session?.user ?? null, session: data.session });
      }

      if (typeof window !== 'undefined') {
        const savedUserStr = localStorage.getItem(MOCK_STORAGE_KEY_USER);
        const savedSessionStr = localStorage.getItem(MOCK_STORAGE_KEY_SESSION);

        if (savedUserStr && savedSessionStr) {
          return successResult({
            user: JSON.parse(savedUserStr),
            session: JSON.parse(savedSessionStr),
          });
        }
      }

      return successResult({ user: null, session: null });
    } catch (err: any) {
      return errorResult(err.message || 'Failed to fetch session');
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<ServiceResult<void>> {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem(MOCK_STORAGE_KEY_USER);
        localStorage.removeItem(MOCK_STORAGE_KEY_SESSION);
      }

      return successResult(undefined);
    } catch (err: any) {
      return errorResult(err.message || 'Sign out failed');
    }
  },

  /**
   * Securely archive profile and delete the authenticated user account.
   * Calls server-side PostgreSQL RPC `delete_user_account()`, which reads the current
   * profile, archives it to `public.deleted_accounts`, and deletes the `auth.users` row.
   * Upon successful archival and deletion, signs the client out and clears local session.
   */
  async deleteAccount(): Promise<ServiceResult<{ success: boolean; message?: string }>> {
    try {
      if (isSupabaseConfigured) {
        // Clean up user-owned active storage files from storage buckets
        try {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData?.user?.id;
          if (userId) {
            // Delete files in profile-photos bucket
            const { data: photoFiles } = await supabase.storage.from('profile-photos').list(userId);
            if (photoFiles && photoFiles.length > 0) {
              const paths = photoFiles.map((f) => `${userId}/${f.name}`);
              await supabase.storage.from('profile-photos').remove(paths);
            }

            // Delete files in verifications bucket
            const { data: verifFiles } = await supabase.storage.from('verifications').list(userId);
            if (verifFiles && verifFiles.length > 0) {
              const paths = verifFiles.map((f) => `${userId}/${f.name}`);
              await supabase.storage.from('verifications').remove(paths);
            }
          }
        } catch (storageErr) {
          console.warn('[AUTH_SERVICE] Active storage file cleanup warning:', storageErr);
        }

        const { data, error } = await (supabase.rpc as any)('delete_user_account');
        if (error) {
          console.error('[AUTH_SERVICE] delete_user_account RPC error:', error);
          return errorResult(error.message || 'Failed to delete account', error.code, error);
        }

        // Clean up client session state after server-side deletion
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.warn('[AUTH_SERVICE] Post-deletion signOut warning:', signOutErr);
        }

        if (typeof window !== 'undefined') {
          localStorage.removeItem('stringx_onboarding_draft');
          localStorage.removeItem(MOCK_STORAGE_KEY_USER);
          localStorage.removeItem(MOCK_STORAGE_KEY_SESSION);
        }

        return successResult({ success: true, message: data?.message || 'Account successfully deleted' });
      }

      // Local mock fallback
      if (typeof window !== 'undefined') {
        const storedProfile = localStorage.getItem('stringx_mock_user_profile');
        if (storedProfile) {
          try {
            const parsed = JSON.parse(storedProfile);
            const archiveEntry = {
              ...parsed,
              deleted_at: new Date().toISOString(),
            };
            const existingArchive = JSON.parse(localStorage.getItem('stringx_deleted_accounts_archive') || '[]');
            existingArchive.push(archiveEntry);
            localStorage.setItem('stringx_deleted_accounts_archive', JSON.stringify(existingArchive));
          } catch {
            // Ignore parse errors in mock
          }
        }
        localStorage.removeItem('stringx_mock_user_profile');
        localStorage.removeItem('stringx_onboarding_draft');
        localStorage.removeItem(MOCK_STORAGE_KEY_USER);
        localStorage.removeItem(MOCK_STORAGE_KEY_SESSION);
      }

      return successResult({ success: true, message: 'Mock account deleted' });
    } catch (err: any) {
      console.error('[AUTH_SERVICE] Exception in deleteAccount:', err);
      return errorResult(err.message || 'Failed to delete account');
    }
  },

  /**
   * Listen to auth state changes centrally
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
      return () => data.subscription.unsubscribe();
    }

    return () => {};
  },
};
