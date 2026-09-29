/**
 * User domain and profile types for STRING X
 */

export interface UserProfile {
  // Step 1: Account
  collegeEmail: string;
  phone: string;
  collegeName: string;
  hostel?: string;
  
  // Step 2: Basic Identity
  fullName: string;
  
  // Step 3: Age
  age: number;
  
  // Step 4: Photo
  photoUrl: string;
  additionalPhotos?: string[];
  
  // Step 5: Gender
  gender: 'Female' | 'Male' | 'Non-binary' | 'Prefer not to say' | '';
  
  // Step 6 & 7: Physical vibe
  heightCm: number;
  weightKg: number;
  
  // Step 8: State
  homeState: string;
  
  // Step 9 & 10: Academic
  collegeYear: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | 'PG' | '4th Year / PG' | '';
  department: string;
  
  // Step 11: Face Verification
  faceVerificationPhoto?: string;
  isFaceVerified?: boolean;
  
  // Step 12 & 13: Garba Profile
  garbaLevel: string;
  garbaLevelTitle: string;
  garbaEnergy: 'Chill' | 'Casual' | 'Energetic' | 'No Breaks' | string;

  // Step 18: Navratri Excitement Vibes (up to 3)
  navratriVibes?: string[];
  
  // Step 13: Interests
  interests: string[];

  // Step 15: Favourite Evening Spot in PU
  favouriteEveningSpot?: string;

  // Step 16: PU Navratri Excitement Level (0-100)
  navratriExcitement?: number;
  
  // Step 14: Partner preference
  partnerGenderPreference: 'Girls' | 'Guys' | 'Open to Anyone' | '';
  partnerVibePreference: string;
  
  // Steps 15, 16, 17: Personality questions
  answerLastRound: string;
  answerPersonality: string;
  answerPartnerNewStep: string;

  // Step 21: Instagram ID
  instagramId?: string;

  // Database registration & onboarding status tracking
  onboardingStatus?: string;
  onboardingStep?: number;
  isProfileCompleted?: boolean;
}

/**
 * Supabase Database Representation of a Profile (aligned with public.profiles table)
 */
export interface DatabaseProfile {
  id: string;
  user_code?: string;
  full_name: string;
  gender: string;
  birth_year?: number | null;
  university_id?: string | null;
  hostel_id?: string | null;
  course_id?: string | null;
  study_year?: string | null;
  home_state?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  instagram_id?: string | null;
  verification_status?: string;
  face_verification_path?: string | null;
  face_verified_at?: string | null;
  verification_rejection_reason?: string | null;
  is_premium?: boolean;
  premium_started_at?: string | null;
  premium_expires_at?: string | null;
  onboarding_status?: string;
  onboarding_step?: number;
  is_profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Supabase Database Representation of an Archived Profile (aligned with public.deleted_accounts table)
 */
export interface DeletedAccount extends DatabaseProfile {
  deleted_at: string;
}
