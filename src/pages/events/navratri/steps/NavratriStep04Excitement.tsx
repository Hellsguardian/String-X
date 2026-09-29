import React from 'react';
import { UserProfile } from '../../../../types/user';
import { PlayfulBadge } from '../../../../components/illustrations/GarbaIllustrations';
import { ExcitementSlider } from '../../../../components/inputs/ExcitementSlider';

interface NavratriStep04ExcitementProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const NavratriStep04Excitement: React.FC<NavratriStep04ExcitementProps> = ({
  profile,
  onUpdateProfile,
}) => {
  return (
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
  );
};
