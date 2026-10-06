import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { MatchRevealScreen } from '../../components/screens/MatchRevealScreen';

interface MatchRevealPageProps {
  onBack: () => void;
  onSendMessage: () => void;
  partner?: any;
}

export const MatchRevealPage: React.FC<MatchRevealPageProps> = ({
  onBack,
  onSendMessage,
  partner,
}) => {
  const { profile } = useAuth();

  return (
    <MatchRevealScreen
      profile={profile}
      partner={partner}
      onBack={onBack}
      onSendMessage={onSendMessage}
    />
  );
};
