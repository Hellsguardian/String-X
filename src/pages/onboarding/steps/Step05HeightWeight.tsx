import React from 'react';
import { UserProfile } from '../../../types/user';
import { CombinedHeightWeight } from '../../../components/inputs/CombinedHeightWeight';

interface Step05HeightWeightProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const Step05HeightWeight: React.FC<Step05HeightWeightProps> = ({
  profile,
  onUpdateProfile,
}) => {
  // Ensure valid baseline height exists on mount
  React.useEffect(() => {
    const defaultHeight = profile.heightCm >= 100 ? profile.heightCm : 171;
    if (profile.heightCm !== defaultHeight) {
      onUpdateProfile({ heightCm: defaultHeight });
    }
  }, []);

  const currentHeight = profile.heightCm >= 100 ? profile.heightCm : 171;
  const currentWeight = profile.weightKg !== undefined && profile.weightKg >= 0 ? profile.weightKg : 0;

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col justify-center">
      <CombinedHeightWeight
        heightCm={currentHeight}
        weightKg={currentWeight}
        onUpdateHeight={(heightCm) =>
          onUpdateProfile({ heightCm, weightKg: currentWeight })
        }
        onUpdateWeight={(weightKg) =>
          onUpdateProfile({ heightCm: currentHeight, weightKg })
        }
      />
    </div>
  );
};
