import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { CountdownScreen } from '../../components/screens/CountdownScreen';
import { matchmakingService } from '../../services/matchmakingService';

interface CountdownPageProps {
  onBack: () => void;
  onViewProfile: () => void;
  onEnterEventDiscovery?: () => void;
  onRevealMatch?: () => void;
}

export const CountdownPage: React.FC<CountdownPageProps> = ({
  onBack,
  onViewProfile,
  onEnterEventDiscovery,
  onRevealMatch,
}) => {
  const { user, profile } = useAuth();
  const currentUserId = user?.id || profile.id;
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const checkReveal = async () => {
      if (!currentUserId || hasRedirectedRef.current) return;

      try {
        const res = await matchmakingService.checkActiveMatch(currentUserId);
        if (!isMounted) return;

        if (res.data?.isRevealed === true && !hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          onRevealMatch?.();
        }
      } catch (err) {
        console.warn('[CountdownPage] Error checking match reveal status:', err);
      }
    };

    checkReveal();

    return () => {
      isMounted = false;
    };
  }, [currentUserId, onRevealMatch]);

  return (
    <CountdownScreen
      profile={profile}
      onBack={onBack}
      onViewProfile={onViewProfile}
      onEnterEventDiscovery={onEnterEventDiscovery}
      onRevealMatch={onRevealMatch}
    />
  );
};
