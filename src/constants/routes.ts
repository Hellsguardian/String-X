import { AppRoute } from '../types/navigation';

export const ROUTES = {
  LANDING: AppRoute.LANDING,
  PHONE_SIGNUP: AppRoute.PHONE_SIGNUP,
  ONBOARDING: AppRoute.ONBOARDING,
  HOME: AppRoute.HOME,
  PROFILE: AppRoute.PROFILE,
  SUCCESS: AppRoute.SUCCESS,
  COUNTDOWN: AppRoute.COUNTDOWN,
  MATCH_REVEAL: AppRoute.MATCH_REVEAL,
  MESSAGES: AppRoute.MESSAGES,
} as const;

export interface DevScreenMapping {
  stepIndex: number;
  screen: AppRoute;
  onboardingStep?: number;
  label: string;
}

/**
 * Exact mapping of the 26 screens in the DevScreenRail
 */
export const DEV_SCREEN_MAP: DevScreenMapping[] = [
  { stepIndex: 1, screen: AppRoute.LANDING, label: 'Landing Screen' },
  { stepIndex: 2, screen: AppRoute.PHONE_SIGNUP, label: 'Phone Sign-Up' },
  { stepIndex: 3, screen: AppRoute.ONBOARDING, onboardingStep: 0, label: 'Name & Gender' },
  { stepIndex: 4, screen: AppRoute.ONBOARDING, onboardingStep: 1, label: 'University & Hostel' },
  { stepIndex: 5, screen: AppRoute.ONBOARDING, onboardingStep: 2, label: 'Age Selection' },
  { stepIndex: 6, screen: AppRoute.ONBOARDING, onboardingStep: 3, label: 'Photo Upload' },
  { stepIndex: 7, screen: AppRoute.ONBOARDING, onboardingStep: 4, label: 'Height & Weight' },
  { stepIndex: 8, screen: AppRoute.ONBOARDING, onboardingStep: 5, label: 'Home State' },
  { stepIndex: 9, screen: AppRoute.ONBOARDING, onboardingStep: 6, label: 'College Year' },
  { stepIndex: 10, screen: AppRoute.ONBOARDING, onboardingStep: 7, label: 'Course Selection' },
  { stepIndex: 11, screen: AppRoute.ONBOARDING, onboardingStep: 8, label: 'Face Verification' },
  { stepIndex: 12, screen: AppRoute.HOME, label: 'STRING X Home / Events' },
  { stepIndex: 13, screen: AppRoute.ONBOARDING, onboardingStep: 9, label: 'Partner Preference' },
  { stepIndex: 14, screen: AppRoute.ONBOARDING, onboardingStep: 10, label: 'General Interests' },
  { stepIndex: 15, screen: AppRoute.ONBOARDING, onboardingStep: 11, label: 'Favourite Evening Spot in PU' },
  { stepIndex: 16, screen: AppRoute.ONBOARDING, onboardingStep: 12, label: 'PU Navratri Excitement' },
  { stepIndex: 17, screen: AppRoute.ONBOARDING, onboardingStep: 13, label: 'Garba Skill Level' },
  { stepIndex: 18, screen: AppRoute.ONBOARDING, onboardingStep: 14, label: 'Navratri Excitement' },
  { stepIndex: 19, screen: AppRoute.ONBOARDING, onboardingStep: 15, label: 'Prompt 01' },
  { stepIndex: 20, screen: AppRoute.ONBOARDING, onboardingStep: 16, label: 'Prompt 02' },
  { stepIndex: 21, screen: AppRoute.ONBOARDING, onboardingStep: 17, label: 'Instagram ID' },
  { stepIndex: 22, screen: AppRoute.SUCCESS, label: 'Submission Success' },
  { stepIndex: 23, screen: AppRoute.COUNTDOWN, label: 'Countdown' },
  { stepIndex: 24, screen: AppRoute.MATCH_REVEAL, label: 'Match Reveal' },
  { stepIndex: 25, screen: AppRoute.MESSAGES, label: 'Message Screen' },
  { stepIndex: 26, screen: AppRoute.PROFILE, label: 'My Profile & Settings' },
];
