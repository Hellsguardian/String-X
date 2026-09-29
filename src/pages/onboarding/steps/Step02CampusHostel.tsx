import React from 'react';
import { UserProfile } from '../../../types/user';
import { PlayfulBadge } from '../../../components/illustrations/GarbaIllustrations';
import { CampusHostelSelector } from '../../../components/inputs/CampusHostelSelector';

interface Step02CampusHostelProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const Step02CampusHostel: React.FC<Step02CampusHostelProps> = ({
  profile,
  onUpdateProfile,
}) => {
  // Ensure default university is initialized in profile state if empty
  React.useEffect(() => {
    if (!profile.collegeName || profile.collegeName.trim().length === 0) {
      onUpdateProfile({ collegeName: 'Parul University' });
    }
  }, [profile.collegeName, onUpdateProfile]);

  const currentUniversity = profile.collegeName || 'Parul University';

  return (
    <div className="space-y-3.5">
      <div>
        <PlayfulBadge text="CAMPUS CHECK" color="yellow" tilt="left" />
        <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2 text-left">
          Where do you study?
        </h2>
        <p className="text-xs font-semibold text-[#251436]/70 mt-1 text-left">
          Choose your university so we can make your campus match feel closer.
        </p>
      </div>

      <CampusHostelSelector
        gender={profile.gender || 'Female'}
        university={currentUniversity}
        hostel={profile.hostel || ''}
        onSelectUniversity={(uni) => onUpdateProfile({ collegeName: uni })}
        onSelectHostel={(h) => onUpdateProfile({ collegeName: currentUniversity, hostel: h })}
      />
    </div>
  );
};
