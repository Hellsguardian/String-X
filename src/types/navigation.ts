/**
 * Navigation and Routing types for STRING X
 */

export type ScreenState = 
  | 'landing'
  | 'phone-signup'
  | 'onboarding'
  | 'home'
  | 'profile'
  | 'success'
  | 'countdown';

export enum AppRoute {
  LANDING = 'landing',
  PHONE_SIGNUP = 'phone-signup',
  ONBOARDING = 'onboarding',
  HOME = 'home',
  PROFILE = 'profile',
  SUCCESS = 'success',
  COUNTDOWN = 'countdown',
}

/**
 * Step route keys for Core Profile Onboarding (Screens 03 to 11)
 */
export enum CoreOnboardingStepKey {
  NAME_GENDER = 0,
  CAMPUS_HOSTEL = 1,
  AGE = 2,
  PHOTO = 3,
  HEIGHT_WEIGHT = 4,
  HOME_STATE = 5,
  COLLEGE_YEAR = 6,
  COURSE = 7,
  FACE_VERIFICATION = 8,
}

/**
 * Step route keys for Navratri Event Flow (Screens 13 to 21)
 */
export enum NavratriStepKey {
  PARTNER_PREFERENCE = 9,
  INTERESTS = 10,
  EVENING_SPOT = 11,
  NAVRATRI_EXCITEMENT = 12,
  GARBA_LEVEL = 13,
  NAVRATRI_VIBES = 14,
  PROMPT_1 = 15,
  PROMPT_2 = 16,
  INSTAGRAM = 17,
}
