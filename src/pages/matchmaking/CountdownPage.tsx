import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { CountdownScreen } from '../../components/screens/CountdownScreen';

interface CountdownPageProps {
  onBack: () => void;
  onViewProfile: () => void;
  onEnterEventDiscovery?: () => void;
}

export const CountdownPage: React.FC<CountdownPageProps> = ({
  onBack,
  onViewProfile,
  onEnterEventDiscovery,
}) => {
  const { profile } = useAuth();

  return (
    <CountdownScreen
      profile={profile}
      onBack={onBack}
      onViewProfile={onViewProfile}
      onEnterEventDiscovery={onEnterEventDiscovery}
    />
  );
};
