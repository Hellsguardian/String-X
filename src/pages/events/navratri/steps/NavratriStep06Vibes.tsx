import React from 'react';
import { UserProfile } from '../../../../types/user';
import { PlayfulBadge } from '../../../../components/illustrations/GarbaIllustrations';
import { NavratriExcitementSelector } from '../../../../components/inputs/NavratriExcitementSelector';

interface NavratriStep06VibesProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const NavratriStep06Vibes: React.FC<NavratriStep06VibesProps> = ({
  profile,
  onUpdateProfile,
}) => {
  return (
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
            garbaEnergy: vibes[0] || '',
          });
        }}
      />
    </div>
  );
};
