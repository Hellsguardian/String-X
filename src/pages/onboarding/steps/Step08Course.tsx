import React from 'react';
import { UserProfile } from '../../../types/user';
import { PlayfulBadge } from '../../../components/illustrations/GarbaIllustrations';
import { CourseSelector } from '../../../components/inputs/CourseSelector';

interface Step08CourseProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const Step08Course: React.FC<Step08CourseProps> = ({
  profile,
  onUpdateProfile,
}) => {
  return (
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
  );
};
