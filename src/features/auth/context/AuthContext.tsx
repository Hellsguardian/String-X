import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '../../../lib/supabase/client';
import { UserProfile } from '../../../types/user';
import { authService } from '../../../services/authService';
import { profileService } from '../../../services/profileService';
import { INITIAL_USER_PROFILE } from '../../../data/mockData';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthErrorNotice {
  title: string;
  message: string;
}

export interface AuthContextValue {
  status: AuthStatus;
  loading: boolean;
  user: User | null;
  session: Session | null;
  profile: UserProfile;
  profileLoading: boolean;
  isAuthenticated: boolean;
  isOnboardingCompleted: boolean;
  isNavratriCompleted: boolean;
  authError: AuthErrorNotice | null;
  setAuthErrorNotice: (notice: AuthErrorNotice | null) => void;
  clearAuthError: () => void;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string; isExistingUser?: boolean }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>, step?: number) => Promise<void>;
  completeOnboarding: () => Promise<{ success: boolean; error?: string }>;
  setProfileLocal: (profileOrFn: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<AuthErrorNotice | null>(null);

  const inFlightProfilePromiseRef = React.useRef<Map<string, Promise<void>>>(new Map());
  const hasInitializedAuthRef = React.useRef<boolean>(false);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const setAuthErrorNotice = useCallback((notice: AuthErrorNotice | null) => {
    setAuthError(notice);
  }, []);

  // Load user profile helper with deduplication & guaranteed finally cleanup
  const loadUserProfile = useCallback(async (userId: string, authUser?: User | null) => {
    if (!userId) {
      setProfileLoading(false);
      return;
    }

    // Deduplicate in-flight profile load for the same user ID
    const existing = inFlightProfilePromiseRef.current.get(userId);
    if (existing) {
      return existing;
    }

    const taskPromise = (async () => {
      setProfileLoading(true);
      try {
        const res = await profileService.getProfile(userId);
        const userMeta = authUser?.user_metadata || {};
        const seededName = res.data?.fullName || userMeta.full_name || userMeta.name || '';

        if (res.data) {
          const seededProfile: UserProfile = {
            ...res.data,
            id: res.data.id || userId,
            fullName: seededName,
            collegeEmail: res.data.collegeEmail || authUser?.email || '',
            // Google OAuth profile picture must NEVER automatically become the user's main photo
            photoUrl: res.data.photoUrl || '',
          };
          setProfile(seededProfile);

          // If database has empty full_name but OAuth provided a valid name, persist to DB immediately
          if ((!res.data.fullName || res.data.fullName.trim() === '') && seededName.trim()) {
            profileService.saveProfile(userId, { fullName: seededName.trim() }).catch((err) => {
              console.warn('[AuthContext] Auto-saving OAuth name failed:', err);
            });
          }
        } else {
          // Safe fallback for authenticated session if profile fetch returned error
          setProfile((prev) => ({
            ...prev,
            id: userId,
            fullName: prev.fullName || seededName,
            collegeEmail: prev.collegeEmail || authUser?.email || '',
          }));
        }
      } catch (err) {
        console.error('[AuthContext] Exception in loadUserProfile:', err);
        setProfile((prev) => ({
          ...prev,
          id: userId,
          collegeEmail: prev.collegeEmail || authUser?.email || '',
        }));
      } finally {
        setProfileLoading(false);
        inFlightProfilePromiseRef.current.delete(userId);
      }
    })();

    inFlightProfilePromiseRef.current.set(userId, taskPromise);
    return taskPromise;
  }, []);

  // Initial session check on mount
  useEffect(() => {
    let isMounted = true;

    // Safety timeout (8s): guarantees UI never deadlocks in 'loading' status
    const safetyTimeout = setTimeout(() => {
      if (!isMounted) return;
      setStatus((currentStatus) => {
        if (currentStatus === 'loading') {
          console.warn('[AuthContext] Initial auth resolution safety timeout reached (8s).');
          return user ? 'authenticated' : 'unauthenticated';
        }
        return currentStatus;
      });
      setProfileLoading(false);
    }, 8000);

    async function initAuth() {
      try {
        const res = await authService.getSession();
        if (!isMounted) return;

        if (res.data?.session && res.data?.user) {
          // Enforce university email allowlist for email/Google users
          if (res.data.user.email) {
            const isPermitted = await authService.isEmailPermitted(res.data.user.email);
            if (!isPermitted) {
              console.warn('[AuthContext] Unauthorized email rejected on init:', res.data.user.email);
              await authService.signOut();
              if (!isMounted) return;
              setUser(null);
              setSession(null);
              setProfile(INITIAL_USER_PROFILE);
              setStatus('unauthenticated');
              setProfileLoading(false);
              setAuthError({
                title: 'Parul University Account Required',
                message: 'Please sign in with your official Parul University Google account (@paruluniversity.ac.in) to access StringX.',
              });
              return;
            }
          }

          setUser(res.data.user);
          setSession(res.data.session);
          // Load database profile BEFORE setting status to authenticated to avoid race condition/flash
          await loadUserProfile(res.data.user.id, res.data.user);
          if (!isMounted) return;
          setStatus('authenticated');
        } else {
          setUser(null);
          setSession(null);
          setStatus('unauthenticated');
          setProfileLoading(false);
        }
      } catch (err) {
        console.error('[AuthContext] Exception in initAuth:', err);
        if (!isMounted) return;
        setStatus((prev) => (prev === 'loading' ? (user ? 'authenticated' : 'unauthenticated') : prev));
        setProfileLoading(false);
      } finally {
        hasInitializedAuthRef.current = true;
      }
    }

    initAuth();

    const unsubscribe = authService.onAuthStateChange(async (event, newSession) => {
      console.log(`[AuthContext] Auth state change event: ${event}`, newSession?.user?.email);
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setProfile(INITIAL_USER_PROFILE);
        setStatus('unauthenticated');
        setProfileLoading(false);
        return;
      }

      if (newSession?.user) {
        // Enforce university email allowlist on auth state change (e.g. OAuth redirect)
        if (newSession.user.email) {
          const isPermitted = await authService.isEmailPermitted(newSession.user.email);
          if (!isPermitted) {
            console.warn('[AuthContext] Unauthorized email rejected on auth state change:', newSession.user.email);
            await authService.signOut();
            if (!isMounted) return;
            setUser(null);
            setSession(null);
            setProfile(INITIAL_USER_PROFILE);
            setStatus('unauthenticated');
            setProfileLoading(false);
            setAuthError({
              title: 'Parul University Account Required',
              message: 'Please sign in with your official Parul University Google account (@paruluniversity.ac.in) to access StringX.',
            });
            return;
          }
        }

        setUser(newSession.user);
        setSession(newSession);

        // Deduplicate INITIAL_SESSION if initAuth() is already actively handling it
        if (event === 'INITIAL_SESSION' && hasInitializedAuthRef.current) {
          return;
        }

        try {
          await loadUserProfile(newSession.user.id, newSession.user);
          if (!isMounted) return;
          setStatus('authenticated');
        } catch (authLoadErr) {
          console.error('[AuthContext] Error loading user profile on auth state change:', authLoadErr);
          if (!isMounted) return;
          setStatus('authenticated');
          setProfileLoading(false);
        }
      } else if (event === 'INITIAL_SESSION' && !newSession) {
        setUser(null);
        setSession(null);
        setStatus('unauthenticated');
        setProfileLoading(false);
      }
    });

    let appUrlListener: { remove: () => void } | null = null;

    if (Capacitor.isNativePlatform()) {
      App.addListener('appUrlOpen', async (data) => {
        const urlStr = data?.url;
        console.log('[AuthContext] appUrlOpen received:', urlStr);
        if (!urlStr || !urlStr.startsWith('com.stringx.app://auth/callback')) {
          return;
        }

        try {
          await Browser.close();
        } catch {
          // Ignore if browser was already closed
        }

        try {
          const urlObj = new URL(urlStr.replace('com.stringx.app://', 'http://com.stringx.app/'));

          // 1. Check for authorization code (PKCE flow)
          const code = urlObj.searchParams.get('code');
          if (code) {
            console.log('[AuthContext] Exchanging PKCE code for session...');
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error('[AuthContext] Error exchanging PKCE code for session:', exchangeError);
              setAuthError({
                title: 'Sign In Failed',
                message: exchangeError.message || 'Could not complete Google sign-in. Please try again.',
              });
            } else if (exchangeData.session) {
              console.log('[AuthContext] PKCE exchange successful for:', exchangeData.session.user.email);
            }
            return;
          }

          // 2. Fallback: check for access_token & refresh_token in hash or query params
          const hash = urlObj.hash ? urlObj.hash.substring(1) : '';
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token') || urlObj.searchParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || urlObj.searchParams.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('[AuthContext] Setting session from token params...');
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setSessionError) {
              console.error('[AuthContext] Error setting session:', setSessionError);
            }
            return;
          }

          // 3. Check for error parameters in callback
          const errorDesc = hashParams.get('error_description') || urlObj.searchParams.get('error_description') || hashParams.get('error') || urlObj.searchParams.get('error');
          if (errorDesc) {
            setAuthError({
              title: 'Sign In Notice',
              message: decodeURIComponent(errorDesc.replace(/\+/g, ' ')),
            });
          }
        } catch (err: any) {
          console.error('[AuthContext] Exception handling appUrlOpen:', err);
        }
      }).then((listener) => {
        appUrlListener = listener;
      });
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      unsubscribe();
      if (appUrlListener) {
        appUrlListener.remove();
      }
    };
  }, [loadUserProfile]);

  const signInWithGoogle = async () => {
    const res = await authService.signInWithGoogle();
    if (res.error) {
      return { success: false, error: res.error.message };
    }
    return { success: true };
  };

  const sendPhoneOtp = async (phone: string) => {
    const res = await authService.sendPhoneOtp(phone);
    if (res.error) {
      return { success: false, error: res.error.message };
    }
    return { success: true };
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const res = await authService.verifyPhoneOtp(phone, token);
    if (res.error) {
      return { success: false, error: res.error.message };
    }

    if (res.data?.user) {
      setUser(res.data.user);
      setSession(res.data.session);
      setStatus('authenticated');

      // Check if existing completed profile exists in database
      const profRes = await profileService.getProfile(res.data.user.id);
      const isExisting = profileService.isRegistrationCompleted(profRes.data);
      if (profRes.data && isExisting) {
        setProfile({ ...profRes.data, id: profRes.data.id || res.data.user.id });
      } else {
        // Carry forward verified phone number and userId
        setProfile((prev) => ({ ...prev, id: res.data!.user!.id, phone }));
      }
      return { success: true, isExistingUser: isExisting };
    }

    return { success: true };
  };

  const updateProfile = async (updates: Partial<UserProfile>, step?: number) => {
    let latestProfile: UserProfile = { ...profile, ...updates };
    setProfile((prev) => {
      latestProfile = { ...prev, ...updates };
      return latestProfile;
    });

    if (!user?.id) {
      console.log('[AUTH_CONTEXT] Unauthenticated / guest session, state updated locally only');
      return;
    }

    const targetUserId = user.id;

    // Handle dedicated primary profile photo upload and persistence to profile_photos table
    if (updates.photoUrl && updates.photoUrl.startsWith('data:')) {
      const photoRes = await profileService.savePrimaryPhoto(targetUserId, updates.photoUrl);
      if (photoRes.data?.publicUrl) {
        updates.photoUrl = photoRes.data.publicUrl;
        latestProfile.photoUrl = photoRes.data.publicUrl;
        setProfile((prev) => ({ ...prev, photoUrl: photoRes.data!.publicUrl }));
      }
    }

    // Handle biometric face verification selfie upload and RPC submission
    if (updates.faceVerificationPhoto && updates.faceVerificationPhoto.startsWith('data:')) {
      const faceRes = await profileService.submitFaceVerification(
        targetUserId,
        updates.faceVerificationPhoto,
        updates.faceCoordinates || profile.faceCoordinates
      );
      if (faceRes.error) {
        console.error('[AUTH_CONTEXT] Face verification submission error:', faceRes.error);
      }
    }

    const result = await profileService.saveProfile(targetUserId, updates, latestProfile, step);
    if (result.error) {
      console.error('[ONBOARDING_SAVE] FAILED');
      console.error('[ONBOARDING_SAVE] userId:', targetUserId);
      console.error('[ONBOARDING_SAVE] updates:', Object.keys(updates));
      console.error('[ONBOARDING_SAVE] error:', result.error);
    } else {
      console.log('[ONBOARDING_SAVE] SUCCESS');
      console.log('[ONBOARDING_SAVE] userId:', targetUserId);
      console.log('[ONBOARDING_SAVE] saved fields:', Object.keys(updates));
    }
  };

  const completeOnboarding = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'User is not authenticated' };
    }
    const res = await profileService.completeStudentOnboarding(user.id);
    if (res.error) {
      console.error('[COMPLETE_ONBOARDING] FAILED:', res.error);
      return { success: false, error: res.error.message };
    }
    console.log('[COMPLETE_ONBOARDING] SUCCESS:', res.data);
    await refreshProfile();
    return { success: true };
  };

  const setProfileLocal = (profileOrFn: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    setProfile(profileOrFn);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(INITIAL_USER_PROFILE);
    setStatus('unauthenticated');
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    const res = await authService.deleteAccount();
    if (res.error) {
      return { success: false, error: res.error.message };
    }
    setUser(null);
    setSession(null);
    setProfile(INITIAL_USER_PROFILE);
    setStatus('unauthenticated');
    setProfileLoading(false);
    return { success: true };
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id, user);
    }
  };

  const isOnboardingCompleted = profileService.isRegistrationCompleted(profile);
  const isNavratriCompleted = profileService.isNavratriCompleted(profile);

  return (
    <AuthContext.Provider
      value={{
        status,
        loading: status === 'loading',
        user,
        session,
        profile,
        profileLoading,
        isAuthenticated: status === 'authenticated',
        isOnboardingCompleted,
        isNavratriCompleted,
        authError,
        setAuthErrorNotice,
        clearAuthError,
        signInWithGoogle,
        sendPhoneOtp,
        verifyPhoneOtp,
        updateProfile,
        completeOnboarding,
        setProfileLocal,
        signOut,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
