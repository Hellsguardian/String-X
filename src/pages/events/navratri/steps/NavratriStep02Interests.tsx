import React from 'react';
import { UserProfile } from '../../../../types/user';
import { PlayfulBadge } from '../../../../components/illustrations/GarbaIllustrations';
import { InterestChips } from '../../../../components/inputs/InterestChips';

interface NavratriStep02InterestsProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const NavratriStep02Interests: React.FC<NavratriStep02InterestsProps> = ({
  profile,
  onUpdateProfile,
}) => {
  return (
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
  );
};
