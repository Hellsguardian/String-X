export interface UserProfile {
  // Step 1: Account
  collegeEmail: string;
  phone: string;
  collegeName: string;
  hostel?: string;
  
  // Step 2: Basic Identity
  fullName: string;
  nickname: string;
  pronouns: string;
  
  // Step 3: Age & Birth Year
  birthYear?: number;
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
}

export type ScreenState = 
  | 'landing'
  | 'phone-signup'
  | 'onboarding'
  | 'home'
  | 'profile'
  | 'success'
  | 'countdown'
  | 'match-reveal'
  | 'messages';
