import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { HomeScreen } from '../../components/screens/HomeScreen';

interface HomePageProps {
  onSelectNavratri: () => void | Promise<void>;
  onOpenProfile: () => void;
  onOpenCountdown?: () => void;
  onReverifyFace?: () => void;
  onUpdatePhoto?: () => void;
  ctaText?: string;
  isChecking?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectNavratri,
  onOpenProfile,
  onOpenCountdown,
  onReverifyFace,
  onUpdatePhoto,
  ctaText,
  isChecking,
}) => {
  const { profile } = useAuth();

  return (
    <HomeScreen
      profile={profile}
      onSelectNavratri={onSelectNavratri}
      onOpenProfile={onOpenProfile}
      onOpenCountdown={onOpenCountdown}
      onReverifyFace={onReverifyFace}
      onUpdatePhoto={onUpdatePhoto}
      ctaText={ctaText}
      isChecking={isChecking}
    />
  );
};
