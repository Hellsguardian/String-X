import { useState, useCallback, useEffect } from 'react';
import { ScreenState, AppRoute } from '../../../types/navigation';
import { DEV_SCREEN_MAP, DevScreenMapping } from '../../../constants/routes';

export interface AppNavigationState {
  screen: ScreenState;
  onboardingStep: number;
  isShowingVerifiedTransition: boolean;
  navigateTo: (screen: ScreenState, step?: number, replace?: boolean) => void;
  navigateByStepIndex: (stepIndex: number) => void;
  showVerifiedTransition: () => void;
  hideVerifiedTransition: () => void;
  setOnboardingStep: (step: number) => void;
}

interface NavHistoryState {
  screen: ScreenState;
  onboardingStep: number;
}

const getInitialNav = (defaultScreen: ScreenState): { screen: ScreenState; onboardingStep: number } => {
  if (typeof window !== 'undefined') {
    try {
      const state = window.history.state as NavHistoryState | null;
      if (state && state.screen) {
        // If previous session stored 'phone-signup', replace it with 'landing'
        // because phone signup is unavailable and not part of the active onboarding flow.
        if (state.screen === AppRoute.PHONE_SIGNUP) {
          return { screen: AppRoute.LANDING, onboardingStep: 0 };
        }
        return { screen: state.screen, onboardingStep: state.onboardingStep ?? 0 };
      }
    } catch {
      // fallback
    }
  }
  return { screen: defaultScreen, onboardingStep: 0 };
};

export function useAppNavigation(initialScreen: ScreenState = AppRoute.LANDING): AppNavigationState {
  const initialNav = getInitialNav(initialScreen);
  const [screen, setScreen] = useState<ScreenState>(initialNav.screen);
  const [onboardingStep, setOnboardingStep] = useState<number>(initialNav.onboardingStep);
  const [isShowingVerifiedTransition, setIsShowingVerifiedTransition] = useState<boolean>(false);

  const navigateTo = useCallback((newScreen: ScreenState, step?: number, replace: boolean = false) => {
    setIsShowingVerifiedTransition(false);
    const resolvedStep = step !== undefined ? step : (newScreen === AppRoute.ONBOARDING ? onboardingStep : 0);
    if (step !== undefined) {
      setOnboardingStep(step);
    }
    setScreen(newScreen);

    if (typeof window !== 'undefined') {
      try {
        const stateObj: NavHistoryState = {
          screen: newScreen,
          onboardingStep: resolvedStep,
        };
        if (replace) {
          window.history.replaceState(stateObj, '');
        } else {
          const cur = window.history.state as NavHistoryState | null;
          if (cur?.screen !== newScreen || cur?.onboardingStep !== resolvedStep) {
            window.history.pushState(stateObj, '');
          }
        }
      } catch {
        // ignore
      }
    }
  }, [onboardingStep]);

  const navigateByStepIndex = useCallback((stepIndex: number) => {
    setIsShowingVerifiedTransition(false);
    const mapping = DEV_SCREEN_MAP.find((m: DevScreenMapping) => m.stepIndex === stepIndex);
    if (mapping) {
      const targetStep = mapping.onboardingStep ?? 0;
      if (mapping.onboardingStep !== undefined) {
        setOnboardingStep(mapping.onboardingStep);
      }
      setScreen(mapping.screen);

      if (typeof window !== 'undefined') {
        try {
          window.history.pushState({ screen: mapping.screen, onboardingStep: targetStep }, '');
        } catch {
          // ignore
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const state = window.history.state as NavHistoryState | null;
      if (!state || state.screen === AppRoute.PHONE_SIGNUP) {
        window.history.replaceState({ screen, onboardingStep }, '');
      }
    } catch {
      // ignore
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as NavHistoryState | null;
      if (state && state.screen) {
        if (state.screen === AppRoute.PHONE_SIGNUP) {
          // Phone signup is not part of active onboarding flow
          setScreen(AppRoute.LANDING);
          setOnboardingStep(0);
          setIsShowingVerifiedTransition(false);
          window.history.replaceState({ screen: AppRoute.LANDING, onboardingStep: 0 }, '');
          return;
        }
        setScreen(state.screen);
        setOnboardingStep(state.onboardingStep ?? 0);
        setIsShowingVerifiedTransition(false);
      } else {
        setScreen(AppRoute.LANDING);
        setOnboardingStep(0);
        setIsShowingVerifiedTransition(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [screen, onboardingStep]);

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
