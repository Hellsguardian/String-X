import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { HomeScreen } from '../../components/screens/HomeScreen';

interface HomePageProps {
  onSelectNavratri: () => void | Promise<void>;
  onOpenProfile: () => void;
  ctaText?: string;
  isChecking?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectNavratri,
  onOpenProfile,
  ctaText,
  isChecking,
}) => {
  const { profile } = useAuth();

  return (
    <HomeScreen
      profile={profile}
      onSelectNavratri={onSelectNavratri}
      onOpenProfile={onOpenProfile}
      ctaText={ctaText}
      isChecking={isChecking}
    />
  );
};
