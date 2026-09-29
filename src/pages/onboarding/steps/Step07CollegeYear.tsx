import React from 'react';
import { UserProfile } from '../../../types/user';
import { PlayfulBadge } from '../../../components/illustrations/GarbaIllustrations';
import { CollegeYearCards } from '../../../components/inputs/CollegeYearCards';

interface Step07CollegeYearProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onAutoAdvance?: (delayMs?: number) => void;
}

export const Step07CollegeYear: React.FC<Step07CollegeYearProps> = ({
  profile,
  onUpdateProfile,
  onAutoAdvance,
}) => {
  return (
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
          if (onAutoAdvance) {
            onAutoAdvance(240);
          }
        }}
      />
    </div>
  );
};
