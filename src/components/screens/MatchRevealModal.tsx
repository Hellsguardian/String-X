import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, HeartHandshake, MapPin, GraduationCap, Flame, Share2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SAMPLE_MATCH_PROFILE } from '../../data/mockData';
import { PlayfulBadge } from '../illustrations/GarbaIllustrations';

interface MatchRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  userNickname: string;
}

export const MatchRevealModal: React.FC<MatchRevealModalProps> = ({
  isOpen,
  onClose,
  userNickname
}) => {
  const match = SAMPLE_MATCH_PROFILE;

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#894EFF', '#F02A8A', '#FFC928', '#08A98D'],
          disableForReducedMotion: true
        });
      } catch {
        // fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#251436]/80 backdrop-blur-xs select-none">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-sm bg-[#E3E0F5] border-4 border-[#251436] rounded-[36px] shadow-[8px_8px_0px_#251436] p-5 max-h-[min(90dvh,600px)] flex flex-col overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between mb-3">
          <PlayfulBadge text="SNEAK PEEK REVEAL" color="yellow" tilt="left" />
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border-2 border-[#251436] flex items-center justify-center text-[#251436] hover:bg-[#D4CEEF]"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Big Reveal Announcement */}
        <div className="text-center mb-4">
          <span className="text-xs font-black uppercase text-[#894EFF] tracking-wider block">
            THE STRING HAS CONNECTED! 🪩
          </span>
          <h3 className="text-2xl font-black text-[#251436] tracking-tight">
            Meet Your Garba Person
          </h3>
          <p className="text-xs font-semibold text-[#251436]/70">
            Paired with {userNickname || 'you'} for Navratri night
          </p>
        </div>

        {/* Matched Partner Profile Card */}
        <div className="rounded-3xl border-3 border-[#251436] bg-white shadow-[4px_4px_0px_#251436] overflow-hidden mb-4">
          {/* Photo */}
          <div className="relative h-56 w-full bg-[#251436]">
            <img
              src={match.photoUrl}
              alt={match.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#251436]/90 via-transparent to-transparent" />

            {/* Compatibility Badge */}
            <div className="absolute top-3 right-3 bg-[#FFC928] text-[#251436] px-3 py-1 rounded-full border-2 border-[#251436] text-xs font-black shadow-md flex items-center gap-1">
              <Sparkles size={12} />
              {match.matchCompatibility}% Match
            </div>

            {/* Name inside photo */}
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <div className="flex items-baseline gap-2">
                <h4 className="text-2xl font-black">{match.name}</h4>
                <span className="text-lg font-bold opacity-90">{match.age}</span>
              </div>
              <p className="text-xs font-semibold opacity-90">
                "{match.nickname}" • {match.collegeYear}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="p-3.5 space-y-2.5 bg-white">
            <div className="flex flex-wrap gap-1.5 text-xs font-bold">
              <span className="px-2 py-0.5 rounded-lg bg-[#D4CEEF] border border-[#251436] text-[#251436]">
                🎓 {match.college}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-[#E3E0F5] border border-[#251436] text-[#251436]">
                📍 {match.homeState}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-[#E3E0F5] border border-[#251436] text-[#251436]">
                📏 {match.height}
              </span>
            </div>

            {/* Skill and Energy */}
            <div className="p-2.5 rounded-xl bg-[#FFF0F5] border-2 border-[#251436] text-xs font-bold space-y-1">
              <div className="flex items-center justify-between text-[#F02A8A]">
                <span>SKILL: {match.garbaLevel}</span>
                <span>🔥</span>
              </div>
              <div className="text-[#251436]">
                Stamina: {match.garbaEnergy}
              </div>
            </div>

            {/* Why Matched */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-black uppercase text-[#894EFF] tracking-wider block">
                Why STRING X Matched You:
              </span>
              {match.compatibilityReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs font-semibold text-[#251436]">
                  <Check size={14} className="text-[#08A98D] flex-shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            {/* Prompt response */}
            <div className="p-2.5 rounded-xl bg-[#FFF9E6] border border-[#251436] text-xs font-bold text-[#251436]">
              <span className="text-[10px] text-[#894EFF] uppercase block">Their 1 AM Rule:</span>
              "{match.favoritePromptAnswer}"
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[#894EFF] border-3 border-[#251436] text-white font-black text-sm shadow-[3px_3px_0px_#251436] active:translate-y-0.5 hover:bg-[#7839f3]"
        >
          Got it! Waiting for Match Day 🪩
        </button>
      </motion.div>
    </div>
  );
};
