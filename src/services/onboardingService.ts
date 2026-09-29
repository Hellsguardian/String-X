import { UserProfile } from '../types/user';
import { resolveUniversityId } from './profileService';

const ONBOARDING_DRAFT_KEY = 'stringx_onboarding_draft';

export const onboardingService = {
  /**
   * Save onboarding progress locally
   */
  saveDraft(profile: Partial<UserProfile>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(profile));
    } catch {
      // safe fallback
    }
  },

  /**
   * Retrieve saved draft
   */
  getDraft(): Partial<UserProfile> | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(ONBOARDING_DRAFT_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Clear draft on completion
   */
  clearDraft(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    } catch {
      // safe fallback
    }
  },

  /**
   * Central validation for any onboarding step
   */
  validateStep(step: number, profile: UserProfile): boolean {
    switch (step) {
      case 0: // Name & Gender
        return (
          Boolean(profile.fullName?.trim() && profile.fullName.trim().length > 1) &&
          (profile.gender === 'Male' || profile.gender === 'Female')
        );
      case 1: // University & Hostel
        {
          const uniId = resolveUniversityId(profile.collegeName);
          return (
            Boolean(uniId) &&
            Boolean(profile.hostel && profile.hostel.trim().length > 0)
          );
        }
      case 2: // Age
        return profile.age >= 15 && profile.age <= 28;
      case 3: // Photo
        return Boolean(profile.photoUrl);
      case 4: // Combined Height & Weight
        return (
          Number(profile.heightCm) >= 100 &&
          Number(profile.heightCm) <= 250 &&
          Number(profile.weightKg) >= 30 &&
          Number(profile.weightKg) <= 250
        );
      case 5: // Home State
        return Boolean(profile.homeState);
      case 6: // College Year
        return Boolean(profile.collegeYear);
      case 7: // Course Selection
        return Boolean(profile.department);
      case 8: // Face Verification
        return Boolean(profile.faceVerificationPhoto && profile.isFaceVerified);
      case 9: // Partner Preference
        return Boolean(profile.partnerGenderPreference);
      case 10: // General Interests
        return Boolean(
          profile.interests &&
          profile.interests.length >= 1 &&
          profile.interests.length <= 6
        );
      case 11: // Favourite Evening Spot
        return Boolean(
          profile.favouriteEveningSpot &&
          profile.favouriteEveningSpot.trim().length > 0
        );
      case 12: // PU Navratri Excitement
        return typeof (profile.navratriExcitement ?? 50) === 'number';
      case 13: // Garba Skill Level
        return Boolean(profile.garbaLevel);
      case 14: // Navratri Excitement Vibes
        return Boolean(
          profile.navratriVibes &&
          profile.navratriVibes.length >= 1 &&
          profile.navratriVibes.length <= 3
        );
      case 15: // Prompt 01
        return Boolean(profile.answerLastRound);
      case 16: // Prompt 02
        return Boolean(profile.answerPersonality);
      case 17: { // Instagram ID
        const rawHandle = (profile.instagramId || '').replace(/^@+/, '').trim();
        return rawHandle.length >= 1 && /^[a-zA-Z0-9._]+$/.test(rawHandle);
      }
      default:
        return true;
    }
  },
};
