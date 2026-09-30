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
  } = useAuth();

  // Post-authentication routing (OAuth redirect or mount session check)
  useEffect(() => {
    // Wait until both auth and database profile query have completed
    if (loading || profileLoading) return;

    if (isAuthenticated) {
      if (isOnboardingCompleted) {
        // CASE: Existing user with completed profile in database (onboarding_status = 'completed' AND is_profile_completed = true)
        // Directly open Page 12 (AppRoute.HOME) and bypass core onboarding (steps 0 to 8)
        // Allow navigation into Navratri event onboarding flow (onboardingStep >= 9)
        if (screen === AppRoute.LANDING || screen === AppRoute.PHONE_SIGNUP || (screen === AppRoute.ONBOARDING && onboardingStep < 9)) {
          navigateTo(AppRoute.HOME);
        }
      } else if (screen === AppRoute.LANDING) {
        // CASE: Incomplete or new user -> resume at saved step or start at 0
        const resumeStep = profile.onboardingStep ? Math.max(0, Math.min(8, profile.onboardingStep - 1)) : 0;
        setOnboardingStep(resumeStep);
        navigateTo(AppRoute.ONBOARDING, resumeStep);
      }
    }
  }, [loading, profileLoading, isAuthenticated, isOnboardingCompleted, screen, onboardingStep, profile.onboardingStep, navigateTo, setOnboardingStep]);

  // Clean URL hash fragments (e.g. Supabase #access_token=...) after OAuth callback
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

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
                    navigateTo(AppRoute.PHONE_SIGNUP);
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
                  navigateTo(AppRoute.SUCCESS);
                }}
                onBackToLanding={() => navigateTo(AppRoute.PHONE_SIGNUP)}
                onFaceVerifiedComplete={async () => {
                  await completeOnboarding();
                  showVerifiedTransition();
                }}
                onBackToHome={() => {
                  navigateTo(AppRoute.HOME);
                }}
              />
            )}

            {/* Screen 12: STRING-X Home & Events Feed */}
            {screen === AppRoute.HOME && (
              <HomePage
                onSelectNavratri={async () => {
                  const targetUserId = user?.id || profile.id;

                  // 1. If in-memory profile has a confirmed match already, go directly to Countdown
                  if (profile.matchedWith) {
                    navigateTo(AppRoute.COUNTDOWN);
                    return;
                  }

                  // 2. If questionnaire is completed in-memory and not matched:
                  // Directly navigate to Radar (SubmissionSuccessScreen).
                  // Radar screen already performs immediate active-match checking & real-time polling on mount,
                  // removing the need to block Home navigation on redundant match queries.
                  if (profileService.isNavratriCompleted(profile)) {
                    navigateTo(AppRoute.SUCCESS);
                    return;
                  }

                  // 3. If in-memory profile does not show completed questionnaire (e.g. after fresh reload),
                  // verify against database:
                  if (targetUserId) {
                    const regRes = await eventService.getEventRegistration('navratri', targetUserId);
                    if (regRes.error) {
                      alert(`Could not verify registration: ${regRes.error.message || 'Please check your connection and try again.'}`);
                      return;
                    }

                    if (regRes.data?.isCompleted) {
                      if (regRes.data.matchedWith) {
                        navigateTo(AppRoute.COUNTDOWN);
                      } else {
                        navigateTo(AppRoute.SUCCESS);
                      }
                      return;
                    }
                  }

                  // 4. Fresh / unregistered user: start questionnaire at Step 9
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

            {/* Screen 23: Navratri Countdown & Reveal */}
            {screen === AppRoute.COUNTDOWN && (
              <CountdownPage
                onBack={() => navigateTo(AppRoute.HOME)}
                onViewProfile={() => navigateTo(AppRoute.PROFILE)}
              />
            )}
          </>
        )}
      </DeviceFrame>

      {/* Development Navigation Rail */}
      <DevScreenRail
        currentScreen={screen}
        onboardingStep={onboardingStep}
        onNavigate={navigateByStepIndex}
      />
    </>
  );
};
