import React from 'react';
import { LandingScreen } from '../../components/screens/LandingScreen';

interface LandingPageProps {
  onStart: () => void;
  onViewCountdown?: () => void;
  onGoogleSignIn?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStart,
  onViewCountdown,
  onGoogleSignIn,
}) => {
  return (
    <LandingScreen
      onStart={onStart}
      onViewCountdown={onViewCountdown}
      onGoogleSignIn={onGoogleSignIn}
    />
  );
};
