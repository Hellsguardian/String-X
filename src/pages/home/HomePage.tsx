import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { HomeScreen } from '../../components/screens/HomeScreen';

interface HomePageProps {
  onSelectNavratri: () => void;
  onOpenProfile: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectNavratri,
  onOpenProfile,
}) => {
  const { profile } = useAuth();

  return (
    <HomeScreen
      profile={profile}
      onSelectNavratri={onSelectNavratri}
      onOpenProfile={onOpenProfile}
    />
  );
};
