import React from 'react';
import { UserProfile } from '../../../types/user';
import { PlayfulBadge } from '../../../components/illustrations/GarbaIllustrations';
import { PhotoPicker } from '../../../components/inputs/PhotoPicker';

interface Step04PhotoProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const Step04Photo: React.FC<Step04PhotoProps> = ({
  profile,
  onUpdateProfile,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <PlayfulBadge text="FESTIVE DRIP" color="purple" tilt="right" />
        <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2">
          Drop your best photo 📸
        </h2>
        <p className="text-xs font-semibold text-[#251436]/70 mt-1">
          Upload your picture or pick a stylish festive avatar.
        </p>
      </div>

      <PhotoPicker
        value={profile.photoUrl}
        additionalPhotos={profile.additionalPhotos || []}
        onChange={(photoUrl, additionalPhotos) =>
          onUpdateProfile({ photoUrl, additionalPhotos })
        }
      />
    </div>
  );
};
