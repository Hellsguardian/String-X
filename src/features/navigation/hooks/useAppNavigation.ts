import { useState, useCallback } from 'react';
import { ScreenState, AppRoute } from '../../../types/navigation';
import { DEV_SCREEN_MAP, DevScreenMapping } from '../../../constants/routes';

export interface AppNavigationState {
  screen: ScreenState;
  onboardingStep: number;
  isShowingVerifiedTransition: boolean;
  navigateTo: (screen: ScreenState, step?: number) => void;
  navigateByStepIndex: (stepIndex: number) => void;
  showVerifiedTransition: () => void;
  hideVerifiedTransition: () => void;
  setOnboardingStep: (step: number) => void;
}

export function useAppNavigation(initialScreen: ScreenState = AppRoute.LANDING): AppNavigationState {
  const [screen, setScreen] = useState<ScreenState>(initialScreen);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [isShowingVerifiedTransition, setIsShowingVerifiedTransition] = useState<boolean>(false);

  const navigateTo = useCallback((newScreen: ScreenState, step?: number) => {
    setIsShowingVerifiedTransition(false);
    if (step !== undefined) {
      setOnboardingStep(step);
    }
    setScreen(newScreen);
  }, []);

  const navigateByStepIndex = useCallback((stepIndex: number) => {
    setIsShowingVerifiedTransition(false);
    const mapping = DEV_SCREEN_MAP.find((m: DevScreenMapping) => m.stepIndex === stepIndex);
    if (mapping) {
      if (mapping.onboardingStep !== undefined) {
        setOnboardingStep(mapping.onboardingStep);
      }
      setScreen(mapping.screen);
    }
  }, []);

  const showVerifiedTransition = useCallback(() => {
    setIsShowingVerifiedTransition(true);
  }, []);

  const hideVerifiedTransition = useCallback(() => {
    setIsShowingVerifiedTransition(false);
  }, []);

  return {
    screen,
    onboardingStep,
    isShowingVerifiedTransition,
    navigateTo,
    navigateByStepIndex,
    showVerifiedTransition,
    hideVerifiedTransition,
    setOnboardingStep,
  };
}
