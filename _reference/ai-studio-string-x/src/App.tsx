import React, { useState } from 'react';
import { ScreenState, UserProfile } from './types';
import { INITIAL_USER_PROFILE } from './data/mockData';
import { DeviceFrame } from './components/ui/DeviceFrame';
import { LandingScreen } from './components/screens/LandingScreen';
import { PhoneNumberSignUpScreen } from './components/screens/PhoneNumberSignUpScreen';
import { OnboardingFlow } from './components/screens/OnboardingFlow';
import { HomeScreen } from './components/screens/HomeScreen';
import { ProfileSettingsScreen } from './components/screens/ProfileSettingsScreen';
import { FaceVerifiedTransition } from './components/screens/FaceVerifiedTransition';
import { SubmissionSuccessScreen } from './components/screens/SubmissionSuccessScreen';
import { CountdownScreen } from './components/screens/CountdownScreen';
import { MatchRevealScreen } from './components/screens/MatchRevealScreen';
import { MessagingScreen } from './components/screens/MessagingScreen';
import { DevScreenRail } from './components/dev/DevScreenRail';

interface NavHistoryState {
  screen: ScreenState;
  onboardingStep: number;
}

const getInitialNav = (): NavHistoryState => {
  try {
    const state = window.history.state as NavHistoryState | null;
    if (state && state.screen) {
      // If previous session stored 'phone-signup', replace it with 'landing'
      // because phone signup is unavailable and not part of the active onboarding flow.
      if (state.screen === 'phone-signup') {
        return { screen: 'landing', onboardingStep: 0 };
      }
      return { screen: state.screen, onboardingStep: state.onboardingStep ?? 0 };
    }
  } catch {
    // fallback
  }
  return { screen: 'landing', onboardingStep: 0 };
};

export default function App() {
  const initialNav = getInitialNav();
  const [screen, setScreen] = useState<ScreenState>(initialNav.screen);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [onboardingStep, setOnboardingStep] = useState(initialNav.onboardingStep);
  const [isShowingVerifiedTransition, setIsShowingVerifiedTransition] = useState(false);
  const [showRegistrationCelebration, setShowRegistrationCelebration] = useState(false);

  const navigate = (
    targetScreen: ScreenState,
    targetStep: number = 0,
    replace: boolean = false
  ) => {
    setIsShowingVerifiedTransition(false);
    setScreen(targetScreen);
    setOnboardingStep(targetStep);

    try {
      const stateObj: NavHistoryState = { screen: targetScreen, onboardingStep: targetStep };
      if (replace) {
        window.history.replaceState(stateObj, '');
      } else {
        const cur = window.history.state as NavHistoryState | null;
        if (cur?.screen !== targetScreen || cur?.onboardingStep !== targetStep) {
          window.history.pushState(stateObj, '');
        }
      }
    } catch {
      // ignore
    }
  };

  // Synchronize with browser history and handle physical browser Back/Forward
  React.useEffect(() => {
    try {
      const state = window.history.state as NavHistoryState | null;
      if (!state || state.screen === 'phone-signup') {
        window.history.replaceState({ screen, onboardingStep }, '');
      }
    } catch {
      // ignore
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as NavHistoryState | null;
      if (state && state.screen) {
        if (state.screen === 'phone-signup') {
          // Phone signup is not part of active onboarding flow
          setScreen('landing');
          setOnboardingStep(0);
          window.history.replaceState({ screen: 'landing', onboardingStep: 0 }, '');
          return;
        }
        setScreen(state.screen);
        setOnboardingStep(state.onboardingStep ?? 0);
        setIsShowingVerifiedTransition(false);
      } else {
        // Fallback to landing if history reached root
        setScreen('landing');
        setOnboardingStep(0);
        setIsShowingVerifiedTransition(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updated }));
  };

  const handleQuickFill = () => {
    setProfile({
      ...INITIAL_USER_PROFILE,
      phone: '+91 98251 44321',
      fullName: 'Aanya Sharma',
      nickname: 'Aanu',
      collegeName: 'Parul University',
      hostel: 'Sarojini Bhawan',
      birthYear: 2004,
      age: new Date().getFullYear() - 2004,
      collegeYear: '2nd Year',
      department: 'B.Des',
      heightCm: 168,
      weightKg: 54,
      garbaLevelTitle: 'Pretty good 🔥',
      garbaEnergy: 'Energetic',
      navratriVibes: ['💃 Garba', '📸 Outfits, Photos & Reels'],
      favouriteEveningSpot: 'Greenzee',
      navratriExcitement: 85,
      faceVerificationPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
      isFaceVerified: true,
      instagramId: '@aanya.sharma'
    });
  };

  const handleJumpToCombined = () => {
    handleQuickFill();
    navigate('onboarding', 4);
  };

  const handleGoogleSignIn = () => {
    // Start Google onboarding flow from the correct entry point (Page 03 — Name & Gender, step 0).
    // The navigation to Page 03 does NOT leave the Phone Signup page underneath it in browser history.
    navigate('onboarding', 0, false);
  };

  const handleBackToLanding = () => {
    // Expected Back behavior:
    // Page 03 — Name & Gender
    //    ↓ Back
    // Welcome / Get Started
    // NOT: Page 02 — Verify Phone
    if (window.history.length > 1 && window.history.state?.screen === 'onboarding') {
      window.history.back();
    } else {
      navigate('landing', 0, true);
    }
  };

  const handleOnboardingStepChange = (nextStep: number) => {
    if (nextStep > onboardingStep) {
      // Forward progression: push new step
      navigate('onboarding', nextStep, false);
    } else if (nextStep < onboardingStep) {
      // Backward step inside onboarding:
      if (window.history.length > 1 && window.history.state?.onboardingStep === onboardingStep) {
        window.history.back();
      } else {
        navigate('onboarding', nextStep, true);
      }
    }
  };

  const handleDevNavigate = (stepIndex: number) => {
    setIsShowingVerifiedTransition(false);
    if (stepIndex === 1) {
      navigate('landing', 0);
    } else if (stepIndex === 2) {
      navigate('phone-signup', 0);
    } else if (stepIndex >= 3 && stepIndex <= 11) {
      const targetStep = stepIndex - 3; // Step 03 -> onboarding step 0 (Name & Gender), Step 11 -> onboarding step 8 (Face Verification)
      navigate('onboarding', targetStep);
    } else if (stepIndex === 12) {
      navigate('home', 0);
    } else if (stepIndex >= 13 && stepIndex <= 21) {
      const targetStep = stepIndex - 4; // Step 13 -> onboarding step 9 (Partner Preference), Step 20 -> onboarding step 16 (Prompt 02), Step 21 -> onboarding step 17 (Instagram ID)
      navigate('onboarding', targetStep);
    } else if (stepIndex === 22) {
      setShowRegistrationCelebration(true);
      navigate('success', 0);
    } else if (stepIndex === 23) {
      navigate('countdown', 0);
    } else if (stepIndex === 24) {
      navigate('match-reveal', 0);
    } else if (stepIndex === 25) {
      navigate('messages', 0);
    } else if (stepIndex === 26) {
      navigate('profile', 0);
    }
  };

  return (
    <>
      <DeviceFrame onQuickFill={handleQuickFill} onJumpToCombinedScreen={handleJumpToCombined}>
        {/* Verification Celebration Transition Overlay / Screen */}
          {isShowingVerifiedTransition ? (
            <FaceVerifiedTransition
              onComplete={() => {
                setIsShowingVerifiedTransition(false);
                navigate('home', 0);
              }}
            />
          ) : (
            <>
              {screen === 'landing' && (
                <LandingScreen
                  onStart={handleGoogleSignIn}
                  onGoogleSignIn={handleGoogleSignIn}
                  onViewCountdown={() => navigate('countdown', 0)}
                />
              )}

            {screen === 'phone-signup' && (
              <PhoneNumberSignUpScreen
                initialPhone={profile.phone}
                onBack={() => navigate('landing', 0)}
                onSuccess={(verifiedPhone) => {
                  handleUpdateProfile({ phone: verifiedPhone });
                  // Replace phone-signup entry in history with onboarding entry
                  navigate('onboarding', 0, true);
                }}
              />
            )}

            {screen === 'onboarding' && (
              <OnboardingFlow
                currentStep={onboardingStep}
                onStepChange={handleOnboardingStepChange}
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onComplete={() => {
                  setShowRegistrationCelebration(true);
                  try {
                    sessionStorage.setItem('stringx_show_registration_celebration', 'true');
                  } catch {
                    // ignore
                  }
                  navigate('success', 0);
                }}
                onBackToLanding={handleBackToLanding}
                onFaceVerifiedComplete={() => {
                  setIsShowingVerifiedTransition(true);
                }}
                onBackToHome={() => {
                  navigate('home', 0);
                }}
              />
            )}

            {/* NEW PAGE: STRING-X HOME / EVENTS DISCOVERY */}
            {screen === 'home' && (
              <HomeScreen
                profile={profile}
                onSelectNavratri={() => {
                  // Connects directly to the new Navratri onboarding flow starting at Page 13 (Partner Preference, step 9)
                  navigate('onboarding', 9);
                }}
                onOpenProfile={() => navigate('profile', 0)}
                onOpenCountdown={() => navigate('countdown', 0)}
              />
            )}

            {/* DEDICATED FULL-SCREEN PROFILE & SETTINGS PAGE */}
            {screen === 'profile' && (
              <ProfileSettingsScreen
                profile={profile}
                onBack={() => navigate('home', 0)}
                onSignOut={() => navigate('landing', 0, true)}
              />
            )}

            {screen === 'success' && (
              <SubmissionSuccessScreen
                profile={profile}
                collegeName={profile.collegeName}
                showRegistrationCelebration={showRegistrationCelebration}
                onCelebrationComplete={() => setShowRegistrationCelebration(false)}
                onBack={() => navigate('home', 0)}
                onContinueToCountdown={() => navigate('match-reveal', 0)}
              />
            )}

            {screen === 'countdown' && (
              <CountdownScreen
                profile={profile}
                onBack={() => navigate('home', 0)}
                onViewProfile={() => navigate('profile', 0)}
                onRevealMatch={() => navigate('match-reveal', 0)}
              />
            )}

            {screen === 'match-reveal' && (
              <MatchRevealScreen
                profile={profile}
                onBack={() => navigate('countdown', 0)}
                onSendMessage={() => navigate('messages', 0)}
              />
            )}

            {screen === 'messages' && (
              <MessagingScreen
                profile={profile}
                onBack={() => navigate('match-reveal', 0)}
                partnerName="Aarohi"
              />
            )}
          </>
        )}
      </DeviceFrame>

      {/* Temporary Desktop-Only Development Navigation Rail */}
      <DevScreenRail
        currentScreen={screen}
        onboardingStep={onboardingStep}
        onNavigate={handleDevNavigate}
      />
    </>
  );
}
