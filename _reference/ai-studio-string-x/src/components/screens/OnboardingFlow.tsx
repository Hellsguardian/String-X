import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types';
import { HeaderNav } from '../ui/HeaderNav';
import { PrimaryButton } from '../ui/PrimaryButton';
import { PlayfulBadge } from '../illustrations/GarbaIllustrations';
import { CombinedHeightWeight } from '../inputs/CombinedHeightWeight';
import { AgeSelector } from '../inputs/AgeSelector';
import { PhotoPicker } from '../inputs/PhotoPicker';
import { StateSelector } from '../inputs/StateSelectorModal';
import { CollegeYearCards } from '../inputs/CollegeYearCards';
import { CourseSelector } from '../inputs/CourseSelector';
import { GarbaLevelSelector } from '../inputs/GarbaLevelSelector';
import { GarbaEnergySelector } from '../inputs/GarbaEnergySelector';
import { NavratriExcitementSelector } from '../inputs/NavratriExcitementSelector';
import { InterestChips } from '../inputs/InterestChips';
import { PromptCardSelector } from '../inputs/PromptCardSelector';
import { CampusHostelSelector } from '../inputs/CampusHostelSelector';
import { GenderSelector } from '../inputs/GenderSelector';
import { FaceVerificationCamera } from '../inputs/FaceVerificationCamera';
import { EveningSpotSelector } from '../inputs/EveningSpotSelector';
import { ExcitementSlider } from '../inputs/ExcitementSlider';
import { PROMPTS } from '../../data/mockData';
import { Check, Instagram } from 'lucide-react';

interface OnboardingFlowProps {
  initialStep?: number;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onComplete: () => void;
  onBackToLanding: () => void;
  onFaceVerifiedComplete?: () => void;
  onBackToHome?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialStep = 0,
  currentStep,
  onStepChange,
  profile,
  onUpdateProfile,
  onComplete,
  onBackToLanding,
  onFaceVerifiedComplete,
  onBackToHome,
}) => {
  const [internalStep, setInternalStep] = useState(initialStep);
  const step = currentStep !== undefined ? currentStep : internalStep;

  const setStep = (newStepOrFn: number | ((prev: number) => number)) => {
    const resolved = typeof newStepOrFn === 'function' ? newStepOrFn(step) : newStepOrFn;
    if (onStepChange) {
      onStepChange(resolved);
    }
    setInternalStep(resolved);
  };

  // 18 registration steps total (Steps 0 to 17)
  const totalSteps = 18;

  // Auto-advance timer ref for single-selection steps
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear pending auto-advance timer on unmount or step change
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, [step]);

  const handleAutoAdvance = (delayMs: number = 240) => {
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
    if (step === 17 && profile.instagramId) {
      const cleanHandle = profile.instagramId.trim().replace(/^@+/, '');
      if (cleanHandle) {
        onUpdateProfile({ instagramId: `@${cleanHandle}` });
      }
    }
    // If on Step 8 (Face Verification), route into STRING X Home transition
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
    // If on Step 9 (Partner Preference - first step of Navratri event flow, Screen 13 overall), back returns to Home (Screen 12)
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

  // Helper validation for each step's Continue button
  const canContinue = () => {
    switch (step) {
      case 0: // Name & Gender (Screen 03)
        return (
          profile.fullName.trim().length > 1 &&
          (profile.gender === 'Male' || profile.gender === 'Female')
        );
      case 1: // University & Hostel (Screen 04)
        return (
          profile.collegeName === 'Parul University' &&
          !!profile.hostel &&
          profile.hostel.trim().length > 0
        );
      case 2: // Birth Year / Age Check (Screen 05)
        return (
          typeof profile.birthYear === 'number' &&
          profile.birthYear >= 1996 &&
          profile.birthYear <= 2010
        );
      case 3: // Photo (Screen 06)
        return !!profile.photoUrl;
      case 4: // Combined Height & Weight (Screen 07)
        return profile.heightCm > 100 && profile.weightKg > 0;
      case 5: // Home State (Screen 08)
        return !!profile.homeState;
      case 6: // College Year (Screen 09)
        return !!profile.collegeYear;
      case 7: // Course Selection (Screen 10)
        return !!profile.department;
      case 8: // Face Verification (Screen 11 overall)
        return !!profile.faceVerificationPhoto && !!profile.isFaceVerified;
      case 9: // Partner Preference (Screen 13 overall)
        return !!profile.partnerGenderPreference;
      case 10: // General Interests (Screen 14 overall)
        return profile.interests && profile.interests.length >= 1 && profile.interests.length <= 6;
      case 11: // Favourite Evening Spot (Screen 15 overall)
        return !!profile.favouriteEveningSpot && profile.favouriteEveningSpot.trim().length > 0;
      case 12: // PU Navratri Excitement (Screen 16 overall)
        return typeof (profile.navratriExcitement ?? 50) === 'number';
      case 13: // Garba Skill Level (Screen 17 overall)
        return !!profile.garbaLevel;
      case 14: // Navratri Excitement Vibes (Screen 18 overall)
        return (
          !!profile.navratriVibes &&
          profile.navratriVibes.length >= 1 &&
          profile.navratriVibes.length <= 3
        );
      case 15: // Prompt 01 (Screen 19 overall)
        return !!profile.answerLastRound;
      case 16: // Prompt 02 (Screen 20 overall)
        return !!profile.answerPersonality;
      case 17: // Instagram ID (Screen 21 overall)
        const rawHandle = (profile.instagramId || '').replace(/^@+/, '').trim();
        return rawHandle.length >= 1 && /^[a-zA-Z0-9._]+$/.test(rawHandle);
      default:
        return true;
    }
  };

  return (
    <div className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between bg-[#E3E0F5] text-[#251436] select-none overflow-hidden">
      {/* Top Header with Back button & Step Progress */}
      <div 
        className="shrink-0"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <HeaderNav
          currentStep={step <= 8 ? step + 3 : step + 4}
          totalSteps={22}
          onBack={prevStep}
          showProgress={true}
        />
      </div>

      {/* Main Dynamic Step Content */}
      <div
        className={`flex-1 min-h-0 px-5 sm:px-6 flex flex-col overflow-y-auto no-scrollbar ${
          step === 4 ? 'py-1.5 sm:py-2.5' : 'py-2 sm:py-3.5 justify-between'
        }`}
      >
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
            {/* STEP 0: Name & Gender (Screen 02 in flow) */}
            {step === 0 && (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <PlayfulBadge text="STEP 02 • WHO ARE YOU?" color="pink" tilt="right" />
                  <h2 className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight mt-2 sm:mt-2.5 leading-tight">
                    What's your name?
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-0.5 sm:mt-1">
                    Your Garba buddy should call you on the dance floor.
                  </p>
                </div>

                <div className="space-y-3.5 sm:space-y-4">
                  {/* Full Name Field */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#251436]/70 mb-1.5">
                      FULL NAME:
                    </label>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => onUpdateProfile({ fullName: e.target.value })}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 sm:py-3.5 bg-white border-3 border-[#251436] rounded-2xl text-base font-extrabold text-[#251436] placeholder-[#251436]/40 shadow-[3px_3px_0px_#251436] focus:outline-hidden focus:ring-2 focus:ring-[#894EFF] transition-all"
                    />
                  </div>

                  {/* Gender Selection Section */}
                  <div className="space-y-1.5 sm:space-y-2 pt-0.5 sm:pt-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#251436]/70 mb-1.5">
                      GENDER:
                    </label>

                    <GenderSelector
                      selectedGender={profile.gender}
                      onSelect={(gender) => onUpdateProfile({ gender })}
                    />

                    <p className="text-[11px] sm:text-xs font-semibold text-[#251436]/65 text-center pt-1 sm:pt-1.5">
                      Pick the one that feels like you ✨
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: University & Hostel (Screen 03 in flow) */}
            {step === 1 && (
              <div className="space-y-3.5">
                <div>
                  <PlayfulBadge text="CAMPUS CHECK" color="yellow" tilt="left" />
                  <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2 text-left">
                    Where do you study?
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1 text-left">
                    Choose your university so we can make your campus match feel closer.
                  </p>
                </div>

                <CampusHostelSelector
                  gender={profile.gender || 'Female'}
                  university={profile.collegeName}
                  hostel={profile.hostel || ''}
                  onSelectUniversity={(uni) => onUpdateProfile({ collegeName: uni })}
                  onSelectHostel={(h) => onUpdateProfile({ hostel: h })}
                />
              </div>
            )}

            {/* STEP 2: Birth Year / Age Check (Screen 04 in flow) */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <PlayfulBadge text="AGE CHECK" color="yellow" tilt="left" />
                  <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2">
                    What's your birth year?
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1">
                    Swipe or tap to select your birth year.
                  </p>
                </div>

                <AgeSelector
                  value={profile.birthYear}
                  onChange={(birthYear) => {
                    const currentYear = new Date().getFullYear();
                    onUpdateProfile({ birthYear, age: currentYear - birthYear });
                  }}
                />
              </div>
            )}

            {/* STEP 3: Profile Photo (Screen 05 in flow) */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <PlayfulBadge text="FESTIVE DRIP" color="purple" tilt="right" />
                  <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2">
                    Drop your best photo 📸
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1">
                    Upload your picture or pick a stylish festive avatar.
                  </p>
                </div>

                <PhotoPicker
                  value={profile.photoUrl}
                  additionalPhotos={profile.additionalPhotos || []}
                  onChange={(photoUrl, additionalPhotos) =>
                    onUpdateProfile({ photoUrl, additionalPhotos })
                  }
                />
              </div>
            )}

            {/* STEP 4: Combined Height & Weight (Screen 07 / Page 7) */}
            {step === 4 && (
              <div className="w-full h-full flex-1 min-h-0 flex flex-col justify-center">
                <CombinedHeightWeight
                  heightCm={profile.heightCm}
                  weightKg={profile.weightKg}
                  onUpdateHeight={(heightCm) => onUpdateProfile({ heightCm })}
                  onUpdateWeight={(weightKg) => onUpdateProfile({ weightKg })}
                />
              </div>
            )}

            {/* STEP 5: Home State (Screen 07 in flow) */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <PlayfulBadge text="REGIONAL VIBES" color="teal" tilt="right" />
                  <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2">
                    Where's home for you?
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1">
                    Connect with hometown folks or celebrate cross-state Garba!
                  </p>
                </div>

                <StateSelector
                  value={profile.homeState}
                  onChange={(homeState) => onUpdateProfile({ homeState })}
                />
              </div>
            )}

            {/* STEP 6: College Year (Screen 08 in flow) */}
            {step === 6 && (
              <div className="space-y-4">
                <div>
                  <PlayfulBadge text="CAMPUS STATUS" color="yellow" tilt="left" />
                  <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2">
                    Which year are you surviving?
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1">
                    Pick your college stage:
                  </p>
                </div>

                <CollegeYearCards
                  value={profile.collegeYear}
                  onChange={(collegeYear) => {
                    onUpdateProfile({ collegeYear });
                    handleAutoAdvance(240);
                  }}
                />
              </div>
            )}

            {/* STEP 7: Course Selection (Screen 09 in flow) */}
            {step === 7 && (
              <div className="space-y-4">
                <div>
                  <PlayfulBadge
                    text={profile.collegeYear === 'PG' ? 'POSTGRAD PATH' : 'CAMPUS PATH'}
                    color="purple"
                    tilt="right"
                  />
                  <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2">
                    What's your course?
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1">
                    Pick what you're studying. We'll handle the rest.
                  </p>
                </div>

                <CourseSelector
                  collegeYear={profile.collegeYear}
                  value={profile.department}
                  onChange={(course) => onUpdateProfile({ department: course })}
                />
              </div>
            )}

            {/* STEP 8: Face Verification (Screen 10 in flow, Screen 11 overall) */}
            {step === 8 && (
              <div className="space-y-2 sm:space-y-2.5">
                <div>
                  <PlayfulBadge text="QUICK VERIFY" color="teal" tilt="left" />
                  <h2 className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight mt-1 sm:mt-1.5 leading-tight">
                    Let's make sure it's you.
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-0.5">
                    Take a quick live selfie to verify your account.
                  </p>
                </div>

                <FaceVerificationCamera
                  initialPhoto={profile.faceVerificationPhoto}
                  isConfirmed={profile.isFaceVerified}
                  onCapture={(photoUrl) =>
                    onUpdateProfile({
                      faceVerificationPhoto: photoUrl,
                      isFaceVerified: true,
                    })
                  }
                  onRetake={() =>
                    onUpdateProfile({
                      faceVerificationPhoto: undefined,
                      isFaceVerified: false,
                    })
                  }
                />
              </div>
            )}

            {/* STEP 9: Partner Preference (Screen 13 overall) */}
            {step === 9 && (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <PlayfulBadge text="MATCH PREFERENCE" color="purple" tilt="right" />
                  <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2">
                    Who do you want to match with?
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1">
                    Help our matchmaking string tune its algorithm:
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#251436]/70">
                    Gender Preference:
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    {['Girls', 'Guys', 'Open to Anyone'].map((p) => {
                      const isSelected = profile.partnerGenderPreference === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => onUpdateProfile({ partnerGenderPreference: p as any })}
                          className={`py-3.5 px-2 rounded-2xl border-2 text-xs sm:text-sm font-extrabold transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'bg-[#894EFF] text-white border-[#251436] shadow-[3px_3px_0px_#251436]'
                              : 'bg-white text-[#251436] border-[#251436]/30 hover:border-[#251436]'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 10: Campus Interests (Screen 14 overall) */}
            {step === 10 && (
              <div className="space-y-3">
                <div>
                  <PlayfulBadge text="YOUR INTERESTS" color="teal" tilt="left" />
                  <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2">
                    What are you into?
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1">
                    Tell us what you enjoy outside the campus chaos.
                  </p>
                </div>

                <InterestChips
                  selected={profile.interests || []}
                  onChange={(interests) => onUpdateProfile({ interests })}
                />
              </div>
            )}

            {/* STEP 11: Favourite Evening Spot in PU (Screen 15 overall) */}
            {step === 11 && (
              <div className="space-y-3 sm:space-y-3.5">
                <div>
                  <PlayfulBadge text="CAMPUS SPOTS" color="yellow" tilt="right" />
                  <h2 className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight mt-2 leading-tight">
                    What's your favourite evening spot in PU?
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1">
                    Pick your go-to campus spot.
                  </p>
                </div>

                <EveningSpotSelector
                  value={profile.favouriteEveningSpot}
                  onSelect={(favouriteEveningSpot) => {
                    onUpdateProfile({ favouriteEveningSpot });
                    handleAutoAdvance(240);
                  }}
                />
              </div>
            )}

            {/* STEP 12: PU Navratri Excitement Level (Screen 16 overall) */}
            {step === 12 && (
              <div className="space-y-4">
                <div>
                  <PlayfulBadge text="PU NAVRATRI 2026" color="teal" tilt="left" />
                  <h2 className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight mt-2 leading-tight">
                    How excited are you for PU Navratri 2026?
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1">
                    Give us your excitement level — no pressure, we're just curious 👀
                  </p>
                </div>

                <ExcitementSlider
                  value={profile.navratriExcitement ?? 50}
                  onChange={(navratriExcitement) => onUpdateProfile({ navratriExcitement })}
                />
              </div>
            )}

            {/* STEP 13: Garba Skill Level (Screen 17 overall) */}
            {step === 13 && (
              <div className="space-y-3">
                <div>
                  <PlayfulBadge text="NO LIES HERE" color="pink" tilt="left" />
                  <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2">
                    How much Garba do you know?
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1">
                    Be honest! Clappers and Sanedo beasts both get matched.
                  </p>
                </div>

                <GarbaLevelSelector
                  value={profile.garbaLevel}
                  onChange={(garbaLevel, garbaLevelTitle) => {
                    onUpdateProfile({ garbaLevel, garbaLevelTitle });
                    handleAutoAdvance(240);
                  }}
                />
              </div>
            )}

            {/* STEP 14: Navratri Excitement Vibes (Screen 18 overall) */}
            {step === 14 && (
              <div className="space-y-3">
                <div>
                  <PlayfulBadge text="NAVRATRI VIBES" color="yellow" tilt="right" />
                  <h2 className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight mt-2 leading-tight">
                    What are you most excited about this Navratri?
                  </h2>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs font-bold text-[#894EFF] uppercase tracking-wider">
                      Pick your top vibes ({(profile.navratriVibes || []).length}/3)
                    </span>
                  </div>
                </div>

                <NavratriExcitementSelector
                  selected={profile.navratriVibes || []}
                  maxSelection={3}
                  onChange={(vibes) => {
                    onUpdateProfile({
                      navratriVibes: vibes,
                      garbaEnergy: vibes[0] || ''
                    });
                  }}
                />
              </div>
            )}

            {/* STEP 15: Personality Question 1 (Screen 19 overall) */}
            {step === 15 && (
              <div className="space-y-3.5 pb-2">
                <div>
                  <PlayfulBadge text="STAY OR SLAY" color="yellow" tilt="none" className="-rotate-1" />
                  <h2 className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight mt-2 leading-tight">
                    {PROMPTS.lastRound.question}
                  </h2>
                </div>

                <PromptCardSelector
                  options={PROMPTS.lastRound.options}
                  selected={profile.answerLastRound}
                  onSelect={(answerLastRound) => {
                    onUpdateProfile({ answerLastRound });
                    handleAutoAdvance(260);
                  }}
                />
              </div>
            )}

            {/* STEP 16: Personality Question 2 (Screen 20 overall) */}
            {step === 16 && (
              <div className="space-y-3">
                <div>
                  <PlayfulBadge text="VIBE CHECK" color="pink" tilt="right" />
                  <h2 className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight mt-2">
                    {PROMPTS.personality.question}
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1">
                    {PROMPTS.personality.subtitle}
                  </p>
                </div>

                <PromptCardSelector
                  options={PROMPTS.personality.options}
                  selected={profile.answerPersonality}
                  onSelect={(answerPersonality) => {
                    onUpdateProfile({ answerPersonality });
                    handleAutoAdvance(260);
                  }}
                />
              </div>
            )}

            {/* STEP 17: Instagram ID (Screen 21 overall) */}
            {step === 17 && (
              <div className="space-y-4 pt-1 sm:pt-2">
                <div>
                  <PlayfulBadge text="STAY CONNECTED" color="yellow" tilt="left" />
                  <h2 className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight mt-2 leading-tight">
                    Enter your Instagram ID
                  </h2>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-1">
                    Let your match find you after the reveal.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label
                      htmlFor="instagram-id"
                      className="block text-xs font-bold uppercase tracking-wider text-[#251436]/70 mb-1.5"
                    >
                      INSTAGRAM ID:
                    </label>

                    <div className="flex items-center gap-2">
                      {/* Fixed Instagram visual badge */}
                      <div className="w-12 h-12 bg-white border-3 border-[#251436] rounded-2xl shadow-[3px_3px_0px_#251436] flex items-center justify-center text-[#251436] shrink-0">
                        <Instagram size={22} strokeWidth={2.2} className="text-[#894EFF]" />
                      </div>

                      {/* Clean input field */}
                      <div className="flex-1 relative">
                        <input
                          id="instagram-id"
                          type="text"
                          value={profile.instagramId || ''}
                          onChange={(e) => {
                            // Lightweight input filter: allow letters, numbers, periods, underscores, and @
                            const raw = e.target.value.replace(/[^a-zA-Z0-9._@]/g, '');
                            onUpdateProfile({ instagramId: raw });
                          }}
                          onBlur={() => {
                            const trimmed = (profile.instagramId || '').trim();
                            if (trimmed) {
                              const cleanHandle = trimmed.replace(/^@+/, '');
                              if (cleanHandle) {
                                onUpdateProfile({ instagramId: `@${cleanHandle}` });
                              }
                            }
                          }}
                          placeholder="@username"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          className="w-full px-4 py-3 sm:py-3.5 bg-white border-3 border-[#251436] rounded-2xl text-base font-extrabold text-[#251436] placeholder-[#251436]/40 shadow-[3px_3px_0px_#251436] focus:outline-hidden focus:ring-2 focus:ring-[#894EFF] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] sm:text-xs font-semibold text-[#251436]/65 pl-1 pt-0.5">
                    ✨ Enter with or without @. Only revealed to your confirmed Garba partner.
                  </p>
                </div>
              </div>
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
            step === 8
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
