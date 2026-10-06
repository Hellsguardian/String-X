import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { MessagingScreen } from '../../components/screens/MessagingScreen';

interface MessagingPageProps {
  onBack: () => void;
  partnerName?: string;
  partnerPhoto?: string;
}

export const MessagingPage: React.FC<MessagingPageProps> = ({
  onBack,
  partnerName,
  partnerPhoto,
}) => {
  const { profile } = useAuth();

  return (
    <MessagingScreen
      profile={profile}
      onBack={onBack}
      partnerName={partnerName}
      partnerPhoto={partnerPhoto}
    />
  );
};
