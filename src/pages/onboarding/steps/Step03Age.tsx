import React from 'react';
import { UserProfile } from '../../../types/user';
import { PlayfulBadge } from '../../../components/illustrations/GarbaIllustrations';
import { AgeSelector } from '../../../components/inputs/AgeSelector';

interface Step03AgeProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const Step03Age: React.FC<Step03AgeProps> = ({
  profile,
  onUpdateProfile,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <PlayfulBadge text="AGE CHECK" color="yellow" tilt="left" />
        <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2">
          How old are you?
        </h2>
        <p className="text-xs font-semibold text-[#251436]/70 mt-1">
          Swipe or tap to set your age.
        </p>
      </div>

      <AgeSelector
        value={profile.age}
        onChange={(age) => onUpdateProfile({ age })}
      />
    </div>
  );
};
