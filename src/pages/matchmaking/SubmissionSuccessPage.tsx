import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { SubmissionSuccessScreen } from '../../components/screens/SubmissionSuccessScreen';

interface SubmissionSuccessPageProps {
  onBack: () => void;
  onContinueToCountdown: () => void;
  onEnterMainApp?: () => void;
}

export const SubmissionSuccessPage: React.FC<SubmissionSuccessPageProps> = ({
  onBack,
  onContinueToCountdown,
  onEnterMainApp,
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
    />
  );
};
