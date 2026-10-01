import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import { UserProfile } from '../../types';
import { SAMPLE_MATCH_PROFILE } from '../../data/mockData';
import { StringXLogo } from '../illustrations/GarbaIllustrations';

interface MatchRevealScreenProps {
  profile: UserProfile;
  onBack: () => void;
  onSendMessage: () => void;
}

export const MatchRevealScreen: React.FC<MatchRevealScreenProps> = ({
  profile,
  onBack,
  onSendMessage,
}) => {
  const match = SAMPLE_MATCH_PROFILE;
  const [isCtaPressed, setIsCtaPressed] = useState(false);

  // Fallback photo URLs
  const youPhotoUrl =
    profile.faceVerificationPhoto ||
    profile.photoUrl ||
    (profile.gender === 'Male' ? '/assets/male.png' : '/assets/female.png');

  const matchPhotoUrl =
    match.photoUrl ||
    (profile.gender === 'Male' ? '/assets/female.png' : '/assets/male.png');

  const handleCtaClick = () => {
    setIsCtaPressed(true);
    setTimeout(() => {
      onSendMessage();
    }, 200);
  };

  return (
    <div className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between p-4 sm:p-5 pt-[max(14px,env(safe-area-inset-top,0px))] pb-[max(16px,env(safe-area-inset-bottom,0px))] bg-[#251436] text-white select-none relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. BACKGROUND: Deep Plum #251436 with flat 2D decorative accents
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Soft atmospheric depth behind the central hero */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 46%, rgba(66, 39, 156, 0.28) 0%, rgba(37, 20, 54, 0.4) 50%, transparent 80%)',
          }}
        />

        {/* 2D DECORATIVE CELEBRATION ACCENTS (Sparse, intentional, flat) */}
        {/* Star 1: Warm Yellow ✦ top right */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.85, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.5, ease: 'easeOut' }}
          className="absolute top-20 right-10 text-[#FFC928]"
        >
          <span className="text-[14px] leading-none select-none font-bold">✦</span>
        </motion.div>

        {/* Star 2: Hot Pink ✦ top left */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.8, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.55, ease: 'easeOut' }}
          className="absolute top-36 left-8 text-[#F02A8A]"
        >
          <span className="text-[12px] leading-none select-none font-bold">✦</span>
        </motion.div>

        {/* Star 3: Soft Lavender ✦ bottom left */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.6, ease: 'easeOut' }}
          className="absolute bottom-40 left-9 text-[#E3E0F5]"
        >
          <span className="text-[11px] leading-none select-none font-bold">✦</span>
        </motion.div>

        {/* Star 4: Warm Yellow small dot bottom right */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.65, ease: 'easeOut' }}
          className="absolute bottom-36 right-9 w-1.5 h-1.5 rounded-full bg-[#FFC928]"
        />

        {/* Playful curved decorative stroke near top-right edge */}
        <svg
          className="absolute top-28 right-5 w-8 h-8 pointer-events-none opacity-40"
          viewBox="0 0 32 32"
          fill="none"
        >
          <path
            d="M 6 8 C 16 12 24 20 26 28"
            stroke="#FFC928"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>

        {/* Playful curved stroke near bottom-left edge */}
        <svg
          className="absolute bottom-48 left-5 w-8 h-8 pointer-events-none opacity-30"
          viewBox="0 0 32 32"
          fill="none"
        >
          <path
            d="M 26 6 C 18 14 10 22 6 28"
            stroke="#F02A8A"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. MINIMAL TOP NAVIGATION: Back button + Centered STRING X
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative flex items-center justify-between shrink-0 z-30 w-full h-10"
      >
        {/* Subtle rounded-square back button */}
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-[#1B0B2A] hover:bg-[#200D32] active:scale-95 border border-[#894EFF]/30 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs z-30"
          aria-label="Go back"
        >
          <ArrowLeft size={16} strokeWidth={2.4} />
        </button>

        {/* Centered STRING X Wordmark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
          <StringXLogo size="sm" light={true} />
        </div>

        {/* Right balance spacer */}
        <div className="w-9 h-9 opacity-0 pointer-events-none" />
      </motion.header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. MAIN VISUAL: Two Large Overlapping Editorial Profile Cards
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 flex flex-col justify-center items-center my-auto relative z-20 w-full max-w-[350px] mx-auto py-1">
        {/* SMALL CELEBRATION PILL: ✦ IT'S A MATCH */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.08 }}
          className="mb-3 shrink-0"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC928]/15 border border-[#FFC928]/40 text-[#FFC928] text-[11px] font-black tracking-wider uppercase shadow-[0_2px_8px_rgba(255,201,40,0.18)] select-none">
            <span className="text-[12px] leading-none">✦</span>
            <span>IT'S A MATCH</span>
          </div>
        </motion.div>

        {/* TWO CARDS COMPOSITION STAGE */}
        <div className="relative w-full h-[290px] sm:h-[310px] flex items-center justify-center">
          {/* CARD 1: YOU (Tilted Counter-Clockwise ~ -6°, Upper-Left) */}
          <motion.div
            initial={{ opacity: 0, x: -65, y: -16, rotate: -14, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: -6, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 24,
              delay: 0.16,
            }}
            whileHover={{ scale: 1.02, rotate: -4 }}
            className="absolute left-2 sm:left-4 top-2 sm:top-3 z-15 group cursor-default transition-transform"
            style={{ width: '47%', aspectRatio: '4/5' }}
          >
            {/* Card Frame with Asymmetric Rounded Corners */}
            <div className="relative w-full h-full rounded-[26px_20px_22px_24px] overflow-hidden bg-[#1B0B2A] border-[2px] border-[#894EFF] shadow-[0_16px_36px_rgba(0,0,0,0.55)]">
              {/* Full-bleed photography */}
              <img
                src={youPhotoUrl}
                alt="You"
                className="w-full h-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = '/assets/female.png';
                }}
              />

              {/* Delicate depth gradient scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#251436]/40 via-transparent to-white/5 pointer-events-none" />
            </div>

            {/* Tiny YOU Editorial Sticker Pill */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20, delay: 0.38 }}
              className="absolute -top-2 -left-1.5 z-30 pointer-events-none"
              style={{ transform: 'rotate(-4deg)' }}
            >
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#894EFF] text-white text-[9.5px] font-black tracking-wider uppercase border border-white/25 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                YOU
              </span>
            </motion.div>
          </motion.div>

          {/* CARD 2: YOUR MATCH (Tilted Clockwise ~ +6°, Lower-Right, Slightly Larger ~50%) */}
          <motion.div
            initial={{ opacity: 0, x: 65, y: 16, rotate: 14, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 6, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 24,
              delay: 0.22,
            }}
            whileHover={{ scale: 1.02, rotate: 4 }}
            className="absolute right-1 sm:right-3 bottom-1 sm:bottom-2 z-20 group cursor-default transition-transform"
            style={{ width: '50%', aspectRatio: '4/5' }}
          >
            {/* Card Frame with Asymmetric Rounded Corners */}
            <div className="relative w-full h-full rounded-[20px_26px_24px_18px] overflow-hidden bg-[#1B0B2A] border-[2px] border-[#F02A8A] shadow-[0_20px_42px_rgba(0,0,0,0.6)]">
              {/* Full-bleed photography */}
              <img
                src={matchPhotoUrl}
                alt={match.name}
                className="w-full h-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = '/assets/female.png';
                }}
              />

              {/* Delicate depth gradient scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#251436]/40 via-transparent to-white/5 pointer-events-none" />
            </div>

            {/* Tiny YOUR MATCH Editorial Sticker Pill */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20, delay: 0.44 }}
              className="absolute -top-2 -right-1.5 z-30 pointer-events-none"
              style={{ transform: 'rotate(4deg)' }}
            >
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F02A8A] text-white text-[9px] font-black tracking-wider uppercase border border-[#FFC928]/60 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                YOUR MATCH
              </span>
            </motion.div>
          </motion.div>

          {/* PLAYFUL CONNECTING VISUAL: Small golden knot charm with decorative arcs */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 20,
              delay: 0.32,
            }}
            className="absolute z-25 pointer-events-none flex items-center justify-center"
            style={{ left: 'calc(50% - 17px)', top: 'calc(49% - 17px)' }}
          >
            {/* Small decorative arcs */}
            <svg
              className="absolute -inset-3 w-14 h-14 pointer-events-none overflow-visible opacity-70"
              viewBox="0 0 56 56"
              fill="none"
            >
              <path
                d="M 12 18 C 18 10 38 10 44 18"
                stroke="#FFC928"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="2 3"
              />
              <path
                d="M 14 38 C 22 46 34 46 42 38"
                stroke="#F02A8A"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Central golden knot coin */}
            <div className="w-[34px] h-[34px] rounded-full bg-[#FFC928] p-[2px] shadow-[0_4px_16px_rgba(0,0,0,0.4)] flex items-center justify-center border border-white/50">
              <div className="w-full h-full rounded-full bg-[#251436] flex items-center justify-center">
                <span className="text-[#FFC928] text-[13px] font-black leading-none select-none">
                  ✦
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            4. MAIN HEADLINE: "Strings Attached." with Hot Pink Accent
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.38 }}
          className="text-center mt-3 sm:mt-4 shrink-0"
        >
          <h1 className="text-[30px] sm:text-[34px] font-black tracking-tight leading-none text-white">
            <span>Strings </span>
            <span className="text-[#F02A8A]">Attached.</span>
          </h1>
          <p className="text-[13.5px] sm:text-[14px] font-medium text-[#E3E0F5]/80 mt-2 tracking-normal">
            You found your Garba partner.
          </p>
        </motion.div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. CTA: "Send a Message →" + Subdued "Maybe later"
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.46 }}
        className="shrink-0 flex flex-col items-center w-full max-w-[340px] mx-auto z-30 pt-1"
      >
        <button
          type="button"
          onClick={handleCtaClick}
          className={`w-[85%] max-w-[320px] h-[52px] sm:h-[54px] rounded-2xl bg-[#894EFF] hover:bg-[#7839f3] active:scale-[0.98] text-white font-extrabold text-[15px] sm:text-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all flex items-center justify-center gap-2.5 cursor-pointer group ${
            isCtaPressed ? 'scale-[0.98]' : ''
          }`}
        >
          <MessageCircle size={18} strokeWidth={2.4} />
          <span>Send a Message</span>
          <ArrowRight
            size={17}
            strokeWidth={2.4}
            className={`transition-transform duration-200 group-hover:translate-x-1 ${
              isCtaPressed ? 'translate-x-1.5' : ''
            }`}
          />
        </button>

        {/* Small, muted, unobtrusive secondary text button */}
        <button
          type="button"
          onClick={onBack}
          className="mt-2.5 py-1 text-xs font-semibold text-[#E3E0F5]/50 hover:text-[#E3E0F5]/80 transition-colors cursor-pointer bg-transparent border-none"
        >
          Maybe later
        </button>
      </motion.div>
    </div>
  );
};
