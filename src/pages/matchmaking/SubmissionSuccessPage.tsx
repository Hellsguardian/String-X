import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { SubmissionSuccessScreen } from '../../components/screens/SubmissionSuccessScreen';

interface SubmissionSuccessPageProps {
  onBack: () => void;
  onContinueToCountdown: (match?: any) => void;
  onEnterMainApp?: () => void;
  showRegistrationCelebration?: boolean;
  onCelebrationComplete?: () => void;
}

export const SubmissionSuccessPage: React.FC<SubmissionSuccessPageProps> = ({
  onBack,
  onContinueToCountdown,
  onEnterMainApp,
  showRegistrationCelebration,
  onCelebrationComplete,
}) => {
  const { profile, user } = useAuth();

  return (
    <SubmissionSuccessScreen
      profile={profile}
      userId={user?.id || profile.id}
      collegeName={profile.collegeName}
      onBack={onBack}
      onContinueToCountdown={onContinueToCountdown}
      onEnterMainApp={onEnterMainApp}
      showRegistrationCelebration={showRegistrationCelebration}
      onCelebrationComplete={onCelebrationComplete}
    />
  );
};
