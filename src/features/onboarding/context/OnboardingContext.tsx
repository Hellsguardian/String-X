import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { UserProfile } from '../../../types/user';
import { onboardingService } from '../../../services/onboardingService';
import { useAuth } from '../../auth/context/AuthContext';

export interface OnboardingContextValue {
  step: number;
  totalSteps: number;
  setStep: (stepOrFn: number | ((prev: number) => number)) => void;
  nextStep: () => void;
  prevStep: () => void;
  handleAutoAdvance: (delayMs?: number) => void;
  canContinue: boolean;
  validateCurrentStep: () => boolean;
  isCoreOnboarding: boolean;
  isNavratriRegistration: boolean;
  onFaceVerifiedComplete?: () => void;
  onRegistrationComplete?: () => void;
  onBackToHome?: () => void;
  onBackToLanding?: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

interface OnboardingProviderProps {
  children: React.ReactNode;
  initialStep?: number;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onFaceVerifiedComplete?: () => void;
  onRegistrationComplete?: () => void;
  onBackToHome?: () => void;
  onBackToLanding?: () => void;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
  initialStep = 0,
  currentStep,
  onStepChange,
  onFaceVerifiedComplete,
  onRegistrationComplete,
  onBackToHome,
  onBackToLanding,
}) => {
  const { profile, updateProfile } = useAuth();
  const [internalStep, setInternalStep] = useState(initialStep);
  const step = currentStep !== undefined ? currentStep : internalStep;

  const totalSteps = 18; // Steps 0 to 17
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on step change or unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, [step]);

  const setStep = useCallback((newStepOrFn: number | ((prev: number) => number)) => {
    const resolved = typeof newStepOrFn === 'function' ? newStepOrFn(step) : newStepOrFn;
    if (onStepChange) {
      onStepChange(resolved);
    }
    setInternalStep(resolved);
  }, [step, onStepChange]);

  const nextStep = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    // Clean Instagram handle if on step 17
    if (step === 17 && profile.instagramId) {
      const cleanHandle = profile.instagramId.trim().replace(/^@+/, '');
      if (cleanHandle) {
        updateProfile({ instagramId: `@${cleanHandle}` });
      }
    }

    // Face verification milestone -> Home
    if (step === 8 && onFaceVerifiedComplete) {
      onFaceVerifiedComplete();
      return;
    }

    if (step < 17) {
      setStep(step + 1);
    } else if (onRegistrationComplete) {
      onRegistrationComplete();
    }
  }, [step, profile.instagramId, updateProfile, onFaceVerifiedComplete, onRegistrationComplete, setStep]);

  const prevStep = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    // If starting Navratri flow (Step 9 / Partner preference), back returns to Home
    if (step === 9 && onBackToHome) {
      onBackToHome();
      return;
    }

    if (step > 0) {
      setStep(step - 1);
    } else if (onBackToLanding) {
      onBackToLanding();
    }
  }, [step, onBackToHome, onBackToLanding, setStep]);

  const handleAutoAdvance = useCallback((delayMs = 240) => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    advanceTimerRef.current = setTimeout(() => {
      nextStep();
    }, delayMs);
  }, [nextStep]);

  const validateCurrentStep = useCallback(() => {
    return onboardingService.validateStep(step, profile);
  }, [step, profile]);

  const canContinue = validateCurrentStep();
  const isCoreOnboarding = step <= 8;
  const isNavratriRegistration = step >= 9;

  return (
    <OnboardingContext.Provider
      value={{
        step,
        totalSteps,
        setStep,
        nextStep,
        prevStep,
        handleAutoAdvance,
        canContinue,
        validateCurrentStep,
        isCoreOnboarding,
        isNavratriRegistration,
        onFaceVerifiedComplete,
        onRegistrationComplete,
        onBackToHome,
        onBackToLanding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextValue => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
