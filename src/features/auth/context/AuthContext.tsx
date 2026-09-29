import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '../../../types/user';
import { authService } from '../../../services/authService';
import { profileService } from '../../../services/profileService';
import { INITIAL_USER_PROFILE } from '../../../data/mockData';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

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

  // Load user profile helper
  const loadUserProfile = useCallback(async (userId: string, authUser?: User | null) => {
    setProfileLoading(true);
    const res = await profileService.getProfile(userId);
    if (res.data) {
      const userMeta = authUser?.user_metadata || {};
      const seededName = res.data.fullName || userMeta.full_name || userMeta.name || '';
      const seededProfile: UserProfile = {
        ...res.data,
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
    }
    setProfileLoading(false);
  }, []);

  // Initial session check on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const res = await authService.getSession();
      if (!isMounted) return;

      if (res.data?.session && res.data?.user) {
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
        setUser(newSession.user);
        setSession(newSession);
        // Load database profile BEFORE setting status to authenticated to prevent race conditions
        await loadUserProfile(newSession.user.id, newSession.user);
        if (!isMounted) return;
        setStatus('authenticated');
      } else if (event === 'INITIAL_SESSION' && !newSession) {
        setUser(null);
        setSession(null);
        setStatus('unauthenticated');
        setProfileLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
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
        setProfile(profRes.data);
      } else {
        // Carry forward verified phone number
        setProfile((prev) => ({ ...prev, phone }));
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
      await profileService.submitFaceVerification(targetUserId, updates.faceVerificationPhoto);
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
