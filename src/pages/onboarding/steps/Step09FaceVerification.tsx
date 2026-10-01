import React from 'react';
import { UserProfile } from '../../../types/user';
import { PlayfulBadge } from '../../../components/illustrations/GarbaIllustrations';
import { FaceVerificationCamera } from '../../../components/inputs/FaceVerificationCamera';

interface Step09FaceVerificationProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const Step09FaceVerification: React.FC<Step09FaceVerificationProps> = ({
  profile,
  onUpdateProfile,
}) => {
  return (
    <div className="space-y-2 sm:space-y-2.5">
      <div>
        <PlayfulBadge text="QUICK VERIFY" color="teal" tilt="left" />
        <h2 className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight mt-1 sm:mt-1.5 leading-tight">
          Let's make sure it's you.
        </h2>
        <p className="text-xs font-semibold text-[#251436]/70 mt-0.5">
          Take a quick live selfie to verify your account.
        </p>
      </div>

      <FaceVerificationCamera
        initialPhoto={profile.faceVerificationPhoto}
        isConfirmed={profile.isFaceVerified}
        onCapture={(photoUrl, coords) =>
          onUpdateProfile({
            faceVerificationPhoto: photoUrl,
            isFaceVerified: true,
            faceCoordinates: coords,
          })
        }
        onRetake={() =>
          onUpdateProfile({
            faceVerificationPhoto: undefined,
            isFaceVerified: false,
            faceCoordinates: undefined,
          })
        }
      />
    </div>
  );
};
