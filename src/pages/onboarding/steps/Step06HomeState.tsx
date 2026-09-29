import React from 'react';
import { UserProfile } from '../../../types/user';
import { PlayfulBadge } from '../../../components/illustrations/GarbaIllustrations';
import { StateSelector } from '../../../components/inputs/StateSelectorModal';

interface Step06HomeStateProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const Step06HomeState: React.FC<Step06HomeStateProps> = ({
  profile,
  onUpdateProfile,
}) => {
  return (
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
  );
};
