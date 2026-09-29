import React from 'react';
import { UserProfile } from '../../../../types/user';
import { PlayfulBadge } from '../../../../components/illustrations/GarbaIllustrations';
import { GarbaLevelSelector } from '../../../../components/inputs/GarbaLevelSelector';

interface NavratriStep05GarbaLevelProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onAutoAdvance?: (delayMs?: number) => void;
}

export const NavratriStep05GarbaLevel: React.FC<NavratriStep05GarbaLevelProps> = ({
  profile,
  onUpdateProfile,
  onAutoAdvance,
}) => {
  return (
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
          if (onAutoAdvance) {
            onAutoAdvance(240);
          }
        }}
      />
    </div>
  );
};
