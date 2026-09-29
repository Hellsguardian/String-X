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
import { DevScreenRail } from './components/dev/DevScreenRail';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('landing');
  const [profile, setProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isShowingVerifiedTransition, setIsShowingVerifiedTransition] = useState(false);

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
    setOnboardingStep(4);
    setScreen('onboarding');
  };

  const handleDevNavigate = (stepIndex: number) => {
    setIsShowingVerifiedTransition(false);
    if (stepIndex === 1) {
      setScreen('landing');
    } else if (stepIndex === 2) {
      setScreen('phone-signup');
    } else if (stepIndex >= 3 && stepIndex <= 11) {
      const targetStep = stepIndex - 3; // Step 03 -> onboarding step 0 (Name & Gender), Step 11 -> onboarding step 8 (Face Verification)
      setOnboardingStep(targetStep);
      setScreen('onboarding');
    } else if (stepIndex === 12) {
      setScreen('home');
    } else if (stepIndex >= 13 && stepIndex <= 21) {
      const targetStep = stepIndex - 4; // Step 13 -> onboarding step 9 (Partner Preference), Step 20 -> onboarding step 16 (Prompt 02), Step 21 -> onboarding step 17 (Instagram ID)
      setOnboardingStep(targetStep);
      setScreen('onboarding');
    } else if (stepIndex === 22) {
      setScreen('success');
    } else if (stepIndex === 23) {
      setScreen('countdown');
    } else if (stepIndex === 24) {
      setScreen('profile');
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
              setScreen('home');
            }}
          />
        ) : (
          <>
            {screen === 'landing' && (
              <LandingScreen
                onStart={() => {
                  setOnboardingStep(0);
                  setScreen('phone-signup');
                }}
                onGoogleSignIn={() => {
                  // Direct Google authentication flow: bypass phone signup and start onboarding
                  setOnboardingStep(0);
                  setScreen('onboarding');
                }}
                onViewCountdown={() => setScreen('countdown')}
              />
            )}

            {screen === 'phone-signup' && (
              <PhoneNumberSignUpScreen
                initialPhone={profile.phone}
                onBack={() => setScreen('landing')}
                onSuccess={(verifiedPhone) => {
                  handleUpdateProfile({ phone: verifiedPhone });
                  setOnboardingStep(0);
                  setScreen('onboarding');
                }}
              />
            )}

            {screen === 'onboarding' && (
              <OnboardingFlow
                currentStep={onboardingStep}
                onStepChange={setOnboardingStep}
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onComplete={() => setScreen('success')}
                onBackToLanding={() => setScreen('phone-signup')}
                onFaceVerifiedComplete={() => {
                  setIsShowingVerifiedTransition(true);
                }}
                onBackToHome={() => {
                  setScreen('home');
                }}
              />
            )}

            {/* NEW PAGE: STRING-X HOME / EVENTS DISCOVERY */}
            {screen === 'home' && (
              <HomeScreen
                profile={profile}
                onSelectNavratri={() => {
                  // Connects directly to the new Navratri onboarding flow starting at Page 13 (Partner Preference, step 9)
                  setOnboardingStep(9);
                  setScreen('onboarding');
                }}
                onOpenProfile={() => setScreen('profile')}
              />
            )}

            {/* DEDICATED FULL-SCREEN PROFILE & SETTINGS PAGE */}
            {screen === 'profile' && (
              <ProfileSettingsScreen
                profile={profile}
                onBack={() => setScreen('home')}
                onSignOut={() => setScreen('landing')}
              />
            )}

            {screen === 'success' && (
              <SubmissionSuccessScreen
                profile={profile}
                collegeName={profile.collegeName}
                onBack={() => setScreen('home')}
                onContinueToCountdown={() => setScreen('countdown')}
              />
            )}

            {screen === 'countdown' && (
              <CountdownScreen
                profile={profile}
                onBack={() => setScreen('home')}
                onViewProfile={() => setScreen('profile')}
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
