import React from 'react';
import { UserProfile } from '../../../../types/user';
import { PlayfulBadge } from '../../../../components/illustrations/GarbaIllustrations';
import { EveningSpotSelector } from '../../../../components/inputs/EveningSpotSelector';

interface NavratriStep03EveningSpotProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onAutoAdvance?: (delayMs?: number) => void;
}

export const NavratriStep03EveningSpot: React.FC<NavratriStep03EveningSpotProps> = ({
  profile,
  onUpdateProfile,
  onAutoAdvance,
}) => {
  return (
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
          if (onAutoAdvance) {
            onAutoAdvance(240);
          }
        }}
      />
    </div>
  );
};
