import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types/user';
import { HeaderNav } from '../../components/ui/HeaderNav';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import {
  Step01NameGender,
  Step02CampusHostel,
  Step03Age,
  Step04Photo,
  Step05HeightWeight,
  Step06HomeState,
  Step07CollegeYear,
  Step08Course,
  Step09FaceVerification,
} from './steps';
import {
  NavratriStep01Partner,
  NavratriStep02Interests,
  NavratriStep03EveningSpot,
  NavratriStep04Excitement,
  NavratriStep05GarbaLevel,
  NavratriStep06Vibes,
  NavratriStep07Prompt1,
  NavratriStep08Prompt2,
  NavratriStep09Instagram,
} from '../events/navratri/steps';
import { onboardingService } from '../../services/onboardingService';

export interface OnboardingFlowContainerProps {
  initialStep?: number;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onComplete: () => void;
  onBackToLanding: () => void;
  onFaceVerifiedComplete?: () => void;
  onBackToHome?: () => void;
  reverificationMode?: 'dp' | 'face' | null;
  onReverificationDpComplete?: () => void;
}

export const OnboardingFlowContainer: React.FC<OnboardingFlowContainerProps> = ({
  initialStep = 0,
  currentStep,
  onStepChange,
  profile,
  onUpdateProfile,
  onComplete,
  onBackToLanding,
  onFaceVerifiedComplete,
  onBackToHome,
  reverificationMode,
  onReverificationDpComplete,
}) => {
  const [internalStep, setInternalStep] = React.useState(initialStep);
  const step = currentStep !== undefined ? currentStep : internalStep;

  const setStep = (newStepOrFn: number | ((prev: number) => number)) => {
    const resolved = typeof newStepOrFn === 'function' ? newStepOrFn(step) : newStepOrFn;
    if (onStepChange) {
      onStepChange(resolved);
    }
    setInternalStep(resolved);
  };

  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, [step]);

  const handleAutoAdvance = (delayMs = 240) => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    advanceTimerRef.current = setTimeout(() => {
      nextStep();
    }, delayMs);
  };

  const nextStep = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    // Ensure step data is saved upon advancing
    if (step === 0 && profile.fullName) {
      onUpdateProfile({ fullName: profile.fullName, gender: profile.gender });
    }

    if (step === 1) {
      const uni = profile.collegeName?.trim() || 'Parul University';
      onUpdateProfile({ collegeName: uni, hostel: profile.hostel });
    }

    if (step === 4) {
      const h = profile.heightCm >= 100 ? profile.heightCm : 171;
      const w = profile.weightKg;
      onUpdateProfile({ heightCm: h, weightKg: w });
    }

    if (step === 17 && profile.instagramId) {
      const cleanHandle = profile.instagramId.trim().replace(/^@+/, '');
      if (cleanHandle) {
        onUpdateProfile({ instagramId: `@${cleanHandle}` });
      }
    }

    if (step === 3 && reverificationMode === 'dp' && onReverificationDpComplete) {
      onReverificationDpComplete();
      return;
    }

    if (step === 8 && onFaceVerifiedComplete) {
      onFaceVerifiedComplete();
      return;
    }

    if (step < 17) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    if (reverificationMode && onBackToHome) {
      onBackToHome();
      return;
    }

    if (step === 9 && onBackToHome) {
      onBackToHome();
      return;
    }

    if (step > 0) {
      setStep(step - 1);
    } else {
      onBackToLanding();
    }
  };

  const canContinue = () => onboardingService.validateStep(step, profile);

  return (
    <div className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between bg-[#E3E0F5] text-[#251436] select-none overflow-hidden">
      {/* Top Header with Back button & Step Progress */}
      <div className="shrink-0 pt-[env(safe-area-inset-top,0px))]">
        <HeaderNav
          currentStep={step <= 8 ? step + 3 : step + 4}
          totalSteps={22}
          onBack={prevStep}
          showProgress={true}
        />
      </div>

      {/* Main Dynamic Step Content */}
      <div className="flex-1 min-h-0 px-5 sm:px-6 py-2 sm:py-3.5 flex flex-col justify-between overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className={`flex-1 min-h-0 flex flex-col ${
              step === 4 ? 'h-full' : 'justify-between'
            }`}
          >
            {/* Step 0: Name & Gender */}
            {step === 0 && (
              <Step01NameGender profile={profile} onUpdateProfile={onUpdateProfile} />
            )}

            {/* Step 1: Campus & Hostel */}
            {step === 1 && (
              <Step02CampusHostel profile={profile} onUpdateProfile={onUpdateProfile} />
            )}

            {/* Step 2: Age */}
            {step === 2 && (
              <Step03Age profile={profile} onUpdateProfile={onUpdateProfile} />
            )}

            {/* Step 3: Photo */}
            {step === 3 && (
              <Step04Photo profile={profile} onUpdateProfile={onUpdateProfile} />
            )}

            {/* Step 4: Combined Height & Weight */}
            {step === 4 && (
              <Step05HeightWeight profile={profile} onUpdateProfile={onUpdateProfile} />
            )}

            {/* Step 5: Home State */}
            {step === 5 && (
              <Step06HomeState profile={profile} onUpdateProfile={onUpdateProfile} />
            )}

            {/* Step 6: College Year */}
            {step === 6 && (
              <Step07CollegeYear
                profile={profile}
                onUpdateProfile={onUpdateProfile}
                onAutoAdvance={handleAutoAdvance}
              />
            )}

            {/* Step 7: Course Selection */}
            {step === 7 && (
              <Step08Course profile={profile} onUpdateProfile={onUpdateProfile} />
            )}

            {/* Step 8: Face Verification */}
            {step === 8 && (
              <Step09FaceVerification profile={profile} onUpdateProfile={onUpdateProfile} />
            )}

            {/* Step 9: Partner Preference */}
            {step === 9 && (
              <NavratriStep01Partner profile={profile} onUpdateProfile={onUpdateProfile} />
            )}

            {/* Step 10: Interests */}
            {step === 10 && (
              <NavratriStep02Interests profile={profile} onUpdateProfile={onUpdateProfile} />
            )}

            {/* Step 11: Favourite Evening Spot */}
            {step === 11 && (
              <NavratriStep03EveningSpot
                profile={profile}
                onUpdateProfile={onUpdateProfile}
                onAutoAdvance={handleAutoAdvance}
              />
            )}

            {/* Step 12: Navratri Excitement Level */}
            {step === 12 && (
              <NavratriStep04Excitement profile={profile} onUpdateProfile={onUpdateProfile} />
            )}

            {/* Step 13: Garba Skill Level */}
            {step === 13 && (
              <NavratriStep05GarbaLevel
                profile={profile}
                onUpdateProfile={onUpdateProfile}
                onAutoAdvance={handleAutoAdvance}
              />
            )}

            {/* Step 14: Navratri Vibes */}
            {step === 14 && (
              <NavratriStep06Vibes profile={profile} onUpdateProfile={onUpdateProfile} />
            )}

            {/* Step 15: Prompt 01 */}
            {step === 15 && (
              <NavratriStep07Prompt1
                profile={profile}
                onUpdateProfile={onUpdateProfile}
                onAutoAdvance={handleAutoAdvance}
              />
            )}

            {/* Step 16: Prompt 02 */}
            {step === 16 && (
              <NavratriStep08Prompt2
                profile={profile}
                onUpdateProfile={onUpdateProfile}
                onAutoAdvance={handleAutoAdvance}
              />
            )}

            {/* Step 17: Instagram ID */}
            {step === 17 && (
              <NavratriStep09Instagram profile={profile} onUpdateProfile={onUpdateProfile} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Anchored Bottom Navigation CTA */}
      <div
        className="shrink-0 px-5 sm:px-6 pt-2 pb-3 sm:pb-4 bg-[#E3E0F5]"
        style={{
          paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
        }}
      >
        <PrimaryButton
          label={
            reverificationMode === 'dp' && step === 3
              ? 'Update Photo & Return Home'
              : step === 8
              ? 'Verify & Continue'
              : 'Continue'
          }
          onClick={nextStep}
          disabled={!canContinue()}
          variant="primary"
          icon={true}
        />
      </div>
    </div>
  );
};
