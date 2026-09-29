import React from 'react';
import { UserProfile } from '../../../types/user';
import { PlayfulBadge } from '../../../components/illustrations/GarbaIllustrations';
import { GenderSelector } from '../../../components/inputs/GenderSelector';

interface Step01NameGenderProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const Step01NameGender: React.FC<Step01NameGenderProps> = ({
  profile,
  onUpdateProfile,
}) => {
  return (
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
            onSelect={(gender) => onUpdateProfile({ fullName: profile.fullName, gender })}
          />

          <p className="text-[11px] sm:text-xs font-semibold text-[#251436]/65 text-center pt-1 sm:pt-1.5">
            Pick the one that feels like you ✨
          </p>
        </div>
      </div>
    </div>
  );
};
