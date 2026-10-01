import React from 'react';
import { LandingScreen } from '../../components/screens/LandingScreen';

interface LandingPageProps {
  onStart: () => void;
  onViewCountdown?: () => void;
  onGoogleSignIn?: () => void;
  authError?: { title: string; message: string } | null;
  onClearAuthError?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStart,
  onViewCountdown,
  onGoogleSignIn,
  authError,
  onClearAuthError,
}) => {
  return (
    <LandingScreen
      onStart={onStart}
      onViewCountdown={onViewCountdown}
      onGoogleSignIn={onGoogleSignIn}
      authError={authError}
      onClearAuthError={onClearAuthError}
    />
  );
};
