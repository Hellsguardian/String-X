import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../../types';
import { MatchRevealScreen } from './MatchRevealScreen';
import { INITIAL_USER_PROFILE } from '../../data/mockData';

interface MatchRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  userNickname?: string;
  profile?: UserProfile;
  onSendMessage?: () => void;
}

export const MatchRevealModal: React.FC<MatchRevealModalProps> = ({
  isOpen,
  onClose,
  userNickname = '',
  profile = INITIAL_USER_PROFILE,
  onSendMessage,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#894EFF', '#F02A8A', '#FFC928', '#FFFFFF'],
          disableForReducedMotion: true,
        });
      } catch {
        // fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const effectiveProfile: UserProfile = {
    ...profile,
    nickname: userNickname || profile.nickname,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#251436] select-none">
      <MatchRevealScreen
        profile={effectiveProfile}
        onBack={onClose}
        onSendMessage={onSendMessage || onClose}
      />
    </div>
  );
};
