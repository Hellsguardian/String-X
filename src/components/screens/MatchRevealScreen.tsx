import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import { UserProfile } from '../../types';
import { StringXLogo } from '../illustrations/GarbaIllustrations';

interface MatchRevealScreenProps {
  profile: UserProfile;
  partner?: {
    name?: string;
    fullName?: string;
    nickname?: string;
    gender?: string;
    photoUrl?: string;
    collegeName?: string;
    department?: string;
  };
  onBack: () => void;
  onSendMessage: () => void;
}

export const MatchRevealScreen: React.FC<MatchRevealScreenProps> = ({
  profile,
  partner,
  onBack,
  onSendMessage,
}) => {
  const match = partner || {};
  const [isCtaPressed, setIsCtaPressed] = useState(false);

  // Dynamic participant genders
  const isUserFemale = profile.gender === 'Female';
  const isPartnerFemale = (match as any).gender === 'Female';
  const isUserMale = profile.gender === 'Male';
  const isPartnerMale = (match as any).gender === 'Male';

  // Base photos: strictly real photos with local neutral fallback (never random Unsplash humans)
  const userDefaultPhoto = isUserMale ? '/assets/male.png' : '/assets/female.png';
  const partnerDefaultPhoto = isPartnerMale ? '/assets/male.png' : '/assets/female.png';

  const userPhoto =
    profile.photoUrl ||
    profile.faceVerificationPhoto ||
    userDefaultPhoto;

  const matchPhoto =
    match.photoUrl ||
    partnerDefaultPhoto;

  // Dynamic first names (uppercase for stickers) - derived strictly from real full names (never hardcoded 'Arju'/'Aanya')
  const userFirstName = (
    profile.fullName?.trim().split(' ')[0] ||
    'MATCH'
  ).toUpperCase();

  const matchFirstName = (
    ((match as any).fullName?.trim().split(' ')[0]) ||
    ((match as any).name?.trim().split(' ')[0]) ||
    ((match as any).nickname?.trim()) ||
    'MATCH'
  ).toUpperCase();

  // Strict Assignment matching reference & preserving gender symmetry:
  // Card 1 (Left): Female / Girl (HOT PINK frame, name on upper-left)
  // Card 2 (Right): Male / Boy (ELECTRIC PURPLE frame, name on upper-right)
  let girlName: string;
  let boyName: string;
  let girlPhotoUrl: string;
  let boyPhotoUrl: string;

  if (isUserFemale && !isPartnerFemale) {
    girlName = userFirstName;
    girlPhotoUrl = userPhoto;
    boyName = matchFirstName;
    boyPhotoUrl = matchPhoto;
  } else if (isPartnerFemale && !isUserFemale) {
    girlName = matchFirstName;
    girlPhotoUrl = matchPhoto;
    boyName = userFirstName;
    boyPhotoUrl = userPhoto;
  } else if (isUserMale) {
    girlName = matchFirstName;
    girlPhotoUrl = matchPhoto;
    boyName = userFirstName;
    boyPhotoUrl = userPhoto;
  } else {
    girlName = userFirstName;
    girlPhotoUrl = userPhoto;
    boyName = matchFirstName;
    boyPhotoUrl = matchPhoto;
  }

  const handleCtaClick = () => {
    setIsCtaPressed(true);
    setTimeout(() => {
      onSendMessage();
    }, 160);
  };

  return (
    <div 
      className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between p-4 sm:p-5 bg-[#160624] text-white select-none relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
      }}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. BACKGROUND: Deep Plum #160624 + Subtle Wave Ribbons + Sparkle Accents
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Soft radial glow centered behind cards */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 40%, rgba(66, 39, 156, 0.24) 0%, rgba(22, 6, 36, 0.6) 65%, #160624 95%)',
          }}
        />

        {/* Ambient curved ribbons flowing in background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
          viewBox="0 0 380 760"
          fill="none"
          preserveAspectRatio="none"
        >
          {/* Upper dark purple wave */}
          <path
            d="M -30 140 C 90 90, 180 230, 420 160"
            stroke="#42279C"
            strokeWidth="32"
            strokeLinecap="round"
            opacity="0.25"
          />
          <path
            d="M -20 170 C 100 120, 200 260, 430 190"
            stroke="#2B0E44"
            strokeWidth="48"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Lower dark purple wave */}
          <path
            d="M -30 630 C 120 570, 260 690, 420 620"
            stroke="#3B145E"
            strokeWidth="40"
            strokeLinecap="round"
            opacity="0.22"
          />
        </svg>

        {/* Sparse Sparkle Stars matching reference */}
        <div className="absolute top-20 left-7 text-[#894EFF]/40 text-[12px] font-black select-none pointer-events-none">
          ✦
        </div>
        <div className="absolute top-18 right-8 text-[#FFC928]/45 text-[14px] font-black select-none pointer-events-none">
          ✦
        </div>
        <div className="absolute bottom-44 left-8 text-[#894EFF]/35 text-[12px] font-black select-none pointer-events-none">
          ✦
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. HEADER: Minimal Back Button + Centered STRING X
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative flex items-center justify-between shrink-0 z-30 w-full h-10"
      >
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-[14px] bg-[#220D35]/85 hover:bg-[#2A1042] active:scale-95 border border-[#894EFF]/35 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs z-30"
          aria-label="Go back"
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
          <StringXLogo size="sm" light={true} />
        </div>

        <div className="w-10 h-10 opacity-0 pointer-events-none" />
      </motion.header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. MAIN HERO STAGE: Straight "IT'S A MATCH" Badge + Two Overlapping 2.5D Cards
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 flex flex-col justify-center items-center my-auto relative z-20 w-full max-w-[350px] mx-auto py-0.5">
        {/* HORIZONTAL "✦ IT'S A MATCH ✦" CAPSULE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.08 }}
          className="mb-2 shrink-0 z-30 flex items-center justify-center"
        >
          <div className="relative inline-flex items-center gap-2">
            {/* Left celebratory ray dashes (=) */}
            <svg
              className="w-4 h-4 text-[#FFC928] pointer-events-none"
              viewBox="0 0 16 16"
              fill="none"
            >
              <line x1="14" y1="11" x2="4" y2="7" stroke="#FFC928" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="15" y1="5" x2="6" y2="3" stroke="#FFC928" strokeWidth="2.4" strokeLinecap="round" />
            </svg>

            {/* Bright Golden Yellow Pill */}
            <div className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full bg-[#FFC928] text-[#1D082B] font-black text-[12px] sm:text-[12.5px] uppercase tracking-wider shadow-[0_0_24px_rgba(255,201,40,0.5),_0_4px_12px_rgba(0,0,0,0.4)] select-none">
              <span className="text-[13px] leading-none">✦</span>
              <span className="tracking-[0.06em]">IT'S A MATCH</span>
              <span className="text-[13px] leading-none">✦</span>
            </div>

            {/* Right celebratory ray dashes (=) */}
            <svg
              className="w-4 h-4 text-[#FFC928] pointer-events-none"
              viewBox="0 0 16 16"
              fill="none"
            >
              <line x1="2" y1="11" x2="12" y2="7" stroke="#FFC928" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="1" y1="5" x2="10" y2="3" stroke="#FFC928" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </div>
        </motion.div>

        {/* TWO PROFILE CARDS STAGE */}
        <div className="relative w-full h-[280px] sm:h-[300px] flex items-center justify-center overflow-visible my-1">
          {/* Decorative dashes outside cards */}
          <div className="absolute left-0 top-1 text-[#FFC928] font-black text-xs select-none pointer-events-none -rotate-45 opacity-90">
            \\
          </div>
          <div className="absolute left-2 bottom-3 text-[#FFC928] font-black text-xs select-none pointer-events-none -rotate-45 opacity-85">
            \\
          </div>
          <div className="absolute right-1 top-4 text-[#FFC928] font-black text-xs select-none pointer-events-none rotate-45 opacity-90">
            //
          </div>
          <div className="absolute right-0 bottom-4 text-[#FF2E93] font-black text-xs select-none pointer-events-none rotate-45 opacity-90">
            //
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              CARD 1: FEMALE PROFILE (Left, Rotated Counter-Clockwise ~ -9°)
              HOT PINK 2.5D FRAME + NAME STICKER ON UPPER-LEFT
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <motion.div
            initial={{ opacity: 0, x: -60, y: -15, rotate: -18, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: -9, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 340,
              damping: 24,
              delay: 0.12,
            }}
            className="absolute left-2 sm:left-3 top-1 sm:top-2 z-15 group cursor-default"
            style={{ width: '49%', aspectRatio: '3.7/5' }}
          >
            {/* LAYER 1 — SOLID 3D OFFSET BACKING SLAB / DROP SHADOW */}
            <div
              className="absolute inset-0 rounded-[22px] bg-[#1A0214] shadow-[0_20px_45px_rgba(0,0,0,0.92),_4px_6px_0px_#10010D] pointer-events-none"
              style={{ transform: 'translate(7px, 8px)' }}
            />

            {/* LAYER 2 — MAIN THICK HOT PINK 2.5D FRAME */}
            <div className="relative w-full h-full p-2 sm:p-2.5 rounded-[22px] bg-gradient-to-br from-[#FF3B94] via-[#F02A8A] to-[#D61873] border border-[#FFA6CD]/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),_0_12px_28px_rgba(0,0,0,0.55)] z-20 flex flex-col">
              {/* Inner highlight chamfer edge */}
              <div className="absolute inset-2 rounded-[15px] border border-white/20 pointer-events-none" />

              {/* LAYER 3 — RECESSED INNER PHOTO APERTURE */}
              <div className="w-full h-full rounded-[14px] overflow-hidden relative bg-[#1B0B2A] shadow-[inset_0_2px_6px_rgba(0,0,0,0.7)]">
                <img
                  src={girlPhotoUrl}
                  alt={girlName}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/female.png';
                  }}
                />
                {/* Subtle depth gradient scrim at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#160624]/30 via-transparent to-white/[0.04] pointer-events-none" />
              </div>
            </div>

            {/* GIRL FIRST-NAME STICKER: Hot Pink Pill, Upper-Left Edge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 480, damping: 20, delay: 0.32 }}
              className="absolute -top-2.5 -left-1.5 z-30 pointer-events-none max-w-[130px]"
              style={{ transform: 'rotate(-4deg)' }}
            >
              <div className="inline-flex items-center px-3.5 py-0.5 rounded-full bg-[#F02A8A] text-white text-[11px] font-black tracking-wider uppercase border border-white/35 shadow-[0_3px_10px_rgba(240,42,138,0.55),_2px_2px_0px_#1A0214] truncate">
                {girlName}
              </div>
            </motion.div>
          </motion.div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              CARD 2: MALE PROFILE (Right, Rotated Clockwise ~ +9°)
              ELECTRIC PURPLE 2.5D FRAME + NAME STICKER ON UPPER-RIGHT
              Overlapping the lower-right corner of Card 1
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <motion.div
            initial={{ opacity: 0, x: 60, y: 15, rotate: 18, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 9, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 340,
              damping: 24,
              delay: 0.18,
            }}
            className="absolute right-1 sm:right-2 bottom-1 sm:bottom-2 z-20 group cursor-default"
            style={{ width: '51%', aspectRatio: '3.7/5' }}
          >
            {/* LAYER 1 — SOLID 3D OFFSET BACKING SLAB / DROP SHADOW */}
            <div
              className="absolute inset-0 rounded-[22px] bg-[#10031B] shadow-[0_24px_50px_rgba(0,0,0,0.92),_4px_6px_0px_#0A0212] pointer-events-none"
              style={{ transform: 'translate(7px, 8px)' }}
            />

            {/* LAYER 2 — MAIN THICK ELECTRIC PURPLE 2.5D FRAME */}
            <div className="relative w-full h-full p-2 sm:p-2.5 rounded-[22px] bg-gradient-to-br from-[#8C52FF] via-[#7839EE] to-[#591BD8] border border-[#B388FF]/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.38),_0_12px_28px_rgba(0,0,0,0.55)] z-20 flex flex-col">
              {/* Inner highlight chamfer edge */}
              <div className="absolute inset-2 rounded-[15px] border border-white/20 pointer-events-none" />

              {/* LAYER 3 — RECESSED INNER PHOTO APERTURE */}
              <div className="w-full h-full rounded-[14px] overflow-hidden relative bg-[#1B0B2A] shadow-[inset_0_2px_6px_rgba(0,0,0,0.7)]">
                <img
                  src={boyPhotoUrl}
                  alt={boyName}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/male.png';
                  }}
                />
                {/* Subtle depth gradient scrim at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#160624]/30 via-transparent to-white/[0.04] pointer-events-none" />
              </div>
            </div>

            {/* BOY FIRST-NAME STICKER: Electric Purple Pill, Upper-Right Edge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 480, damping: 20, delay: 0.38 }}
              className="absolute -top-2.5 -right-1.5 z-30 pointer-events-none max-w-[130px]"
              style={{ transform: 'rotate(5deg)' }}
            >
              <div className="inline-flex items-center px-3.5 py-0.5 rounded-full bg-[#7839EE] text-white text-[11px] font-black tracking-wider uppercase border border-white/30 shadow-[0_3px_10px_rgba(120,57,238,0.55),_2px_2px_0px_#10031B] truncate">
                {boyName}
              </div>
            </motion.div>
          </motion.div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              CENTER CONNECTION BADGE (Layered above both cards at the nexus)
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 480,
              damping: 20,
              delay: 0.28,
            }}
            className="absolute z-30 pointer-events-none flex items-center justify-center"
            style={{ left: 'calc(50% - 18px)', top: 'calc(46% - 18px)' }}
          >
            {/* Ambient golden star glow */}
            <div className="absolute inset-0 rounded-full bg-[#FFC928]/45 blur-md pointer-events-none" />

            {/* Circular badge with bright gold/yellow border */}
            <div className="w-[36px] h-[36px] rounded-full bg-[#1A072A] border-[2.5px] border-[#FFC928] shadow-[0_4px_16px_rgba(0,0,0,0.7),_0_0_14px_rgba(255,201,40,0.5)] flex items-center justify-center relative z-10">
              <span className="text-[#FFC928] text-[14px] font-black leading-none select-none">
                ✦
              </span>
            </div>
          </motion.div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            4. MAIN HERO HEADLINE: "Strings Attached."
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.32 }}
          className="text-center mt-3 sm:mt-4 mb-0.5 shrink-0 w-full"
        >
          <div className="inline-flex items-baseline justify-center gap-2.5 sm:gap-3 whitespace-nowrap">
            {/* "Strings": Dominant White Bold Rounded Sans */}
            <span className="text-[29px] sm:text-[33px] font-black text-white tracking-tight leading-none font-['Plus_Jakarta_Sans',sans-serif]">
              Strings
            </span>
            {/* "Attached.": Bright Saturated Lavender (#E5C8FF), Bold Italic, 100% Opacity */}
            <span
              className="text-[31px] sm:text-[35px] italic font-extrabold text-[#E5C8FF] tracking-normal leading-none"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#E5C8FF',
                opacity: 1,
              }}
            >
              Attached.
            </span>
          </div>

          {/* Subtitle: "You found your Garba partner." */}
          <p className="text-[13px] sm:text-[14px] font-medium text-[#E3E0F5]/75 mt-2 tracking-normal">
            You found your Garba partner.
          </p>
        </motion.div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. CTA: Large Electric Purple Gradient Button + "Maybe later"
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: 'easeOut', delay: 0.4 }}
        className="shrink-0 flex flex-col items-center w-full max-w-[340px] mx-auto z-30 pt-1"
      >
        {/* Large Purple Gradient Rounded Button */}
        <button
          type="button"
          onClick={handleCtaClick}
          className={`w-[90%] max-w-[325px] h-[52px] sm:h-[54px] rounded-[22px] bg-gradient-to-r from-[#9457FF] via-[#8541F5] to-[#7030E8] hover:from-[#894EFF] hover:to-[#6525E0] active:scale-[0.98] text-white font-bold text-[16px] shadow-[0_8px_30px_rgba(137,78,255,0.48),_0_2px_8px_rgba(0,0,0,0.4)] transition-all flex items-center justify-center gap-2.5 cursor-pointer relative overflow-hidden group ${
            isCtaPressed ? 'scale-[0.98]' : ''
          }`}
        >
          {/* Subtle animated travelling diagonal shimmer */}
          <motion.div
            animate={{ x: [-120, 360] }}
            transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut', repeatDelay: 1.8 }}
            className="absolute inset-y-0 w-16 bg-white/15 skew-x-12 pointer-events-none"
          />

          <MessageCircle size={20} strokeWidth={2.4} />
          <span>Send a Message</span>
          <ArrowRight
            size={19}
            strokeWidth={2.4}
            className={`transition-transform duration-200 group-hover:translate-x-1 ${
              isCtaPressed ? 'translate-x-1' : ''
            }`}
          />
        </button>

        {/* Small Muted Secondary Button */}
        <button
          type="button"
          onClick={onBack}
          className="mt-2.5 py-1 text-[13px] font-semibold text-[#E3E0F5]/50 hover:text-[#E3E0F5]/85 transition-colors cursor-pointer bg-transparent border-none"
        >
          Maybe later
        </button>
      </motion.div>
    </div>
  );
};
