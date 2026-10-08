import React, { useEffect } from 'react';
import { DeviceFrame } from '../components/ui/DeviceFrame';
import { DevScreenRail } from '../components/dev/DevScreenRail';
import { useAppNavigation } from '../features/navigation/hooks/useAppNavigation';
import { useAuth } from '../hooks/useAuth';
import { LandingPage } from '../pages/landing/LandingPage';
import { PhoneNumberSignUpPage } from '../pages/auth/PhoneNumberSignUpPage';
import { OnboardingFlowContainer } from '../pages/onboarding/OnboardingFlowContainer';
import { HomePage } from '../pages/home/HomePage';
import { ProfileSettingsPage } from '../pages/profile/ProfileSettingsPage';
import { SubmissionSuccessPage } from '../pages/matchmaking/SubmissionSuccessPage';
import { CountdownPage } from '../pages/matchmaking/CountdownPage';
import { MatchRevealPage } from '../pages/matchmaking/MatchRevealPage';
import { MessagingPage } from '../pages/matchmaking/MessagingPage';
import { FaceVerifiedTransitionPage } from '../pages/onboarding/FaceVerifiedTransitionPage';
import { INITIAL_USER_PROFILE } from '../data/mockData';
import { AppRoute } from '../types/navigation';
import { profileService } from '../services/profileService';
import { matchmakingService } from '../services/matchmakingService';
import { eventService } from '../services/eventService';

export const AppShell: React.FC = () => {
  const {
    screen,
    onboardingStep,
    isShowingVerifiedTransition,
    navigateTo,
    navigateByStepIndex,
    showVerifiedTransition,
    hideVerifiedTransition,
    setOnboardingStep,
  } = useAppNavigation();

  const {
    user,
    profile,
    updateProfile,
    completeOnboarding,
    setProfileLocal,
    loading,
    profileLoading,
    isAuthenticated,
    isOnboardingCompleted,
    signInWithGoogle,
    refreshProfile,
    authError,
    setAuthErrorNotice,
    clearAuthError,
  } = useAuth();

  const [reverificationMode, setReverificationMode] = React.useState<'dp' | 'face' | null>(null);

  // Post-authentication routing (OAuth redirect or mount session check)
  useEffect(() => {
    // Wait until both auth and database profile query have completed
    if (loading || profileLoading) return;

    if (isAuthenticated) {
      if (isOnboardingCompleted) {
        // CASE: Existing user with completed profile in database (onboarding_status = 'completed' OR is_profile_completed = true)
        // If user is currently performing an explicit re-verification action from Home, do not interrupt!
        if (reverificationMode) return;

        // If user is rejected and not matched, block matching screens (Radar or event questionnaire) and route to Home
        if (!profileService.canUseMatching(profile) && !profile.matchedWith) {
          if (screen === AppRoute.SUCCESS || (screen === AppRoute.ONBOARDING && onboardingStep >= 9)) {
            navigateTo(AppRoute.HOME);
            return;
          }
        }

        // Directly open Page 12 (AppRoute.HOME) and bypass core onboarding (steps 0 to 8)
        // Allow navigation into Navratri event onboarding flow (onboardingStep >= 9) for eligible users
        if (
          screen === AppRoute.LANDING ||
          screen === AppRoute.PHONE_SIGNUP ||
          (screen === AppRoute.ONBOARDING && onboardingStep < 9)
        ) {
          navigateTo(AppRoute.HOME);
        }
      } else if (screen === AppRoute.LANDING) {
        // CASE: Incomplete or new user -> resume at saved step or start at 0
        const resumeStep = profile.onboardingStep ? Math.max(0, Math.min(8, profile.onboardingStep - 1)) : 0;
        setOnboardingStep(resumeStep);
        navigateTo(AppRoute.ONBOARDING, resumeStep);
      }
    }
  }, [
    loading,
    profileLoading,
    isAuthenticated,
    isOnboardingCompleted,
    reverificationMode,
    screen,
    onboardingStep,
    profile.onboardingStep,
    navigateTo,
    setOnboardingStep,
  ]);

  // Detect OAuth callback rejection or clean URL hash fragments
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : '');
      const searchParams = new URLSearchParams(search);

      const error = hashParams.get('error') || searchParams.get('error');
      const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');

      if (error || errorDesc) {
        console.warn('[AppShell] OAuth callback rejection detected:', error, errorDesc);
        window.history.replaceState(null, '', window.location.pathname);
        setAuthErrorNotice({
          title: 'Parul University Account Required',
          message:
            'StringX is currently available only to Parul University students and approved developer accounts. Please sign in with your Parul University Google account.',
        });
        navigateTo(AppRoute.LANDING);
        return;
      }

      if (hash && hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [setAuthErrorNotice, navigateTo]);

  const handleQuickFill = () => {
    const quickFillData = {
      ...INITIAL_USER_PROFILE,
      phone: '+91 98251 44321',
      fullName: 'Aanya Sharma',
      collegeName: 'Parul University',
      hostel: 'Sarojini Bhawan',
      collegeYear: '2nd Year' as const,
      department: 'B.Des',
      heightCm: 168,
      weightKg: 54,
      garbaLevelTitle: 'Pretty good 🔥',
      garbaEnergy: 'Energetic',
      navratriVibes: ['💃 Garba', '📸 Outfits, Photos & Reels'],
      favouriteEveningSpot: 'Greenzee',
      navratriExcitement: 85,
      photoUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
      faceVerificationPhoto:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
      isFaceVerified: true,
      instagramId: '@aanya.sharma',
    };
    setProfileLocal(quickFillData);
    updateProfile(quickFillData);
  };

  const handleJumpToCombined = () => {
    handleQuickFill();
    setOnboardingStep(4);
    navigateTo(AppRoute.ONBOARDING, 4);
  };

  return (
    <>
      <DeviceFrame onQuickFill={handleQuickFill} onJumpToCombinedScreen={handleJumpToCombined}>
        {/* Verification Celebration Transition Overlay */}
        {isShowingVerifiedTransition ? (
          <FaceVerifiedTransitionPage
            onComplete={() => {
              hideVerifiedTransition();
              navigateTo(AppRoute.HOME);
            }}
          />
        ) : (loading || (isAuthenticated && profileLoading)) ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
            <div className="w-10 h-10 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-3" />
            <p className="text-xs font-bold text-[#251436]/70 tracking-wider uppercase">
              Loading your profile...
            </p>
          </div>
        ) : (
          <>
            {/* Screen 01: Landing */}
            {screen === AppRoute.LANDING && (
              <LandingPage
                onStart={() => {
                  setOnboardingStep(0);
                  navigateTo(AppRoute.PHONE_SIGNUP);
                }}
                onGoogleSignIn={async () => {
                  await signInWithGoogle();
                }}
                onViewCountdown={() => navigateTo(AppRoute.COUNTDOWN)}
                authError={authError}
                onClearAuthError={clearAuthError}
              />
            )}

            {/* Screen 02: Phone Sign-Up & OTP Verification */}
            {screen === AppRoute.PHONE_SIGNUP && (
              <PhoneNumberSignUpPage
                onBack={() => navigateTo(AppRoute.LANDING)}
                onSuccess={(verifiedPhone, isExistingUser) => {
                  updateProfile({ phone: verifiedPhone });
                  if (isExistingUser) {
                    // CASE 3: Existing user loaded with completed profile
                    navigateTo(AppRoute.HOME);
                  } else {
                    // CASE 2: New user onboarding
                    setOnboardingStep(0);
                    navigateTo(AppRoute.ONBOARDING, 0);
                  }
                }}
              />
            )}

            {/* Screens 03-11 (Core Onboarding) & Screens 13-21 (Navratri Registration) */}
            {screen === AppRoute.ONBOARDING && (
              <OnboardingFlowContainer
                currentStep={onboardingStep}
                onStepChange={setOnboardingStep}
                profile={profile}
                onUpdateProfile={(updated) => updateProfile(updated, onboardingStep)}
                onComplete={async () => {
                  const targetUserId = user?.id || profile.id;
                  if (!targetUserId) {
                    console.error('[AppShell] Cannot persist event registration: user is not authenticated.');
                    alert('Please sign in to register for Navratri.');
                    navigateTo(AppRoute.LANDING);
                    return;
                  }

                  if (!profileService.canUseMatching(profile)) {
                    alert('Your verification needs attention before you can join matching.');
                    navigateTo(AppRoute.HOME);
                    return;
                  }

                  const regRes = await eventService.submitEventAnswers('navratri', targetUserId, profile);
                  if (regRes.error) {
                    console.error('[AppShell] Event registration submission failed:', regRes.error);
                    alert(`Failed to save Navratri registration: ${regRes.error.message || 'Please try again.'}`);
                    return;
                  }

                  console.log('[AppShell] Event registration successfully persisted:', regRes.data);
                  if (profile.instagramId) {
                    await updateProfile({ instagramId: profile.instagramId });
                  }
                  await refreshProfile();
                  try {
                    sessionStorage.setItem('stringx_show_registration_celebration', 'true');
                  } catch {
                    // ignore
                  }
                  navigateTo(AppRoute.SUCCESS);
                }}
                onBackToLanding={() => {
                  if (typeof window !== 'undefined' && window.history.length > 1 && (window.history.state as any)?.screen === AppRoute.ONBOARDING) {
                    window.history.back();
                  } else {
                    navigateTo(AppRoute.LANDING, 0, true);
                  }
                }}
                reverificationMode={reverificationMode}
                onReverificationDpComplete={async () => {
                  setReverificationMode(null);
                  await refreshProfile();
                  navigateTo(AppRoute.HOME);
                }}
                onFaceVerifiedComplete={async () => {
                  try {
                    const targetUserId = user?.id || profile.id;
                    if (!targetUserId) {
                      alert('You must be signed in to complete verification.');
                      return;
                    }

                    // 1. If face photo is still a data URL, call submit_face_verification RPC first
                    if (profile.faceVerificationPhoto && profile.faceVerificationPhoto.startsWith('data:')) {
                      const faceRes = await profileService.submitFaceVerification(
                        targetUserId,
                        profile.faceVerificationPhoto,
                        profile.faceCoordinates
                      );
                      if (faceRes.error) {
                        alert(`Face verification failed: ${faceRes.error.message || 'Please enable GPS location and retake your selfie.'}`);
                        return;
                      }
                    }

                    // 2. Authoritative onboarding completion via RPC
                    const res = await completeOnboarding();
                    if (!res.success) {
                      alert(`Could not complete onboarding: ${res.error || 'Verification check failed. Please try again.'}`);
                      return;
                    }

                    // 3. Handle successful completion
                    if (reverificationMode === 'face') {
                      setReverificationMode(null);
                      await refreshProfile();
                      navigateTo(AppRoute.HOME);
                    } else {
                      showVerifiedTransition();
                    }
                  } catch (err: any) {
                    alert(`Verification error: ${err.message || 'Something went wrong. Please try again.'}`);
                  }
                }}
                onBackToHome={() => {
                  setReverificationMode(null);
                  navigateTo(AppRoute.HOME);
                }}
              />
            )}

            {/* Screen 12: STRING-X Home & Events Feed */}
            {screen === AppRoute.HOME && (
              <HomePage
                onReverifyFace={() => {
                  setReverificationMode('face');
                  setOnboardingStep(8);
                  navigateTo(AppRoute.ONBOARDING, 8);
                }}
                onUpdatePhoto={() => {
                  setReverificationMode('dp');
                  setOnboardingStep(3);
                  navigateTo(AppRoute.ONBOARDING, 3);
                }}
                onOpenCountdown={() => navigateTo(AppRoute.COUNTDOWN)}
                onSelectNavratri={async () => {
                  const targetUserId = user?.id || profile.id;

                  // 1. Check verification / matching eligibility restriction
                  if (!profileService.canUseMatching(profile)) {
                    if (profile.verificationFace === 'rejected' && profile.verificationDp !== 'rejected') {
                      setReverificationMode('face');
                      setOnboardingStep(8);
                      navigateTo(AppRoute.ONBOARDING, 8);
                    } else {
                      setReverificationMode('dp');
                      setOnboardingStep(3);
                      navigateTo(AppRoute.ONBOARDING, 3);
                    }
                    return;
                  }

                  // 2. Unauthenticated user: navigate to Step 9 questionnaire
                  if (!targetUserId) {
                    setOnboardingStep(9);
                    navigateTo(AppRoute.ONBOARDING, 9);
                    return;
                  }

                  // 3. Query authoritative database-backed registration state
                  const regRes = await eventService.getEventRegistration('navratri', targetUserId);
                  if (regRes.error) {
                    alert(`Could not verify registration: ${regRes.error.message || 'Please check your connection and try again.'}`);
                    return;
                  }

                  // 4. Evaluate database registration result
                  if (regRes.data?.isCompleted) {
                    if (regRes.data.matchedWith) {
                      const matchRes = await matchmakingService.checkActiveMatch(targetUserId);
                      if (matchRes.data?.isRevealed === true) {
                        navigateTo(AppRoute.MATCH_REVEAL);
                      } else {
                        navigateTo(AppRoute.COUNTDOWN);
                      }
                    } else {
                      navigateTo(AppRoute.SUCCESS);
                    }
                    return;
                  }

                  // 5. Unregistered / incomplete questionnaire: start at Step 9
                  setOnboardingStep(9);
                  navigateTo(AppRoute.ONBOARDING, 9);
                }}
                onOpenProfile={() => navigateTo(AppRoute.PROFILE)}
              />
            )}

            {/* Screen 24: Profile & Settings */}
            {screen === AppRoute.PROFILE && (
              <ProfileSettingsPage
                onBack={() => navigateTo(AppRoute.HOME)}
                onSignOut={() => navigateTo(AppRoute.LANDING)}
              />
            )}

            {/* Screen 22: Submission Success Radar */}
            {screen === AppRoute.SUCCESS && (
              <SubmissionSuccessPage
                onBack={() => navigateTo(AppRoute.HOME)}
                onContinueToCountdown={() => navigateTo(AppRoute.COUNTDOWN)}
              />
            )}

            {/* Screen 23: Navratri Countdown */}
            {screen === AppRoute.COUNTDOWN && (
              <CountdownPage
                onBack={() => navigateTo(AppRoute.HOME)}
                onViewProfile={() => navigateTo(AppRoute.PROFILE)}
                onRevealMatch={() => navigateTo(AppRoute.MATCH_REVEAL)}
              />
            )}

            {/* Screen 24: Strings Attached / Match Reveal */}
            {screen === AppRoute.MATCH_REVEAL && (
              <MatchRevealPage
                onBack={() => navigateTo(AppRoute.COUNTDOWN)}
                onSendMessage={() => navigateTo(AppRoute.MESSAGES)}
              />
            )}

            {/* Screen 25: Match Chat / Messaging */}
            {screen === AppRoute.MESSAGES && (
              <MessagingPage
                onBack={() => navigateTo(AppRoute.MATCH_REVEAL)}
              />
            )}
          </>
        )}
      </DeviceFrame>

      {/* Development Navigation Rail */}
      {import.meta.env.DEV && (
        <DevScreenRail
          currentScreen={screen}
          onboardingStep={onboardingStep}
          onNavigate={navigateByStepIndex}
        />
      )}
    </>
  );
};
