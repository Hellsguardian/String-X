import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { UserProfile } from '../../types';
import { profileService } from '../../services/profileService';

interface HomeScreenProps {
  profile: UserProfile;
  onSelectNavratri: () => void | Promise<void>;
  onOpenProfile: () => void;
  ctaText?: string;
  isChecking?: boolean;
}

/**
 * Compact, tasteful vector artwork communicating Garba circular rhythm,
 * festive connection, and the iconic STRING X pink line.
 * Designed with a concise vertical footprint (~38px) so the event card
 * remains a sleek, compact banner.
 */
const NavratriVisual: React.FC = () => {
  return (
    <div className="relative w-full h-[38px] flex items-center justify-center select-none overflow-hidden my-0.5">
      {/* Subtle atmospheric ambient glow */}
      <div className="absolute w-28 h-12 rounded-full bg-[#894EFF]/20 blur-md pointer-events-none" />
      <div className="absolute w-16 h-10 rounded-full bg-[#FF4F81]/15 blur-sm pointer-events-none" />

      <svg
        viewBox="0 0 240 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-h-[38px]"
      >
        {/* Concentric Garba social dance ripple rings */}
        <ellipse
          cx="120"
          cy="32"
          rx="90"
          ry="9"
          stroke="#894EFF"
          strokeOpacity="0.3"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <ellipse
          cx="120"
          cy="32"
          rx="56"
          ry="6"
          stroke="#FFC928"
          strokeOpacity="0.35"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />

        {/* Small festive accent sparkles */}
        <path
          d="M52 11 L53.5 13 L55.5 14 L53.5 15 L52 17 L50.5 15 L48.5 14 L50.5 13 Z"
          fill="#FFC928"
          opacity="0.8"
        />
        <path
          d="M188 10 L189.5 12 L191.5 13 L189.5 14 L188 16 L186.5 14 L184.5 13 L186.5 12 Z"
          fill="#FF4F81"
          opacity="0.8"
        />
        <circle cx="120" cy="6" r="1.3" fill="#FFC928" opacity="0.65" />

        {/* Left Dancer (Silhouetted girl with raised dandiya) */}
        <g transform="translate(86, 4)">
          {/* Head */}
          <circle cx="10" cy="6" r="3.5" fill="#F5CBA7" />
          <circle cx="7.5" cy="4.5" r="2" fill="#180C24" />
          {/* Choli */}
          <path d="M7.5 9.5 L13 9.5 L11.5 15 L8.5 15 Z" fill="#894EFF" />
          {/* Lehenga skirt */}
          <path d="M8.5 15 L12.5 15 L17.5 27 L3.5 27 Z" fill="#F02A8A" />
          {/* Raised dandiya arm */}
          <path d="M7.5 10.5 L3.5 7 L1 3.5" stroke="#F5CBA7" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="2" x2="5" y2="8.5" stroke="#08A98D" strokeWidth="1.5" strokeLinecap="round" />
          {/* Forward dancing arm */}
          <path d="M12.5 11 L17.5 13.5 L21 12.5" stroke="#F5CBA7" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="19" y1="10" x2="22.5" y2="16" stroke="#FFC928" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Right Dancer (Guy in festive kurta & dynamic dandiya pose) */}
        <g transform="translate(124, 4)">
          {/* Head */}
          <circle cx="10" cy="6" r="3.5" fill="#EDBB99" />
          {/* Kurta */}
          <path d="M7 9.5 L13.5 9.5 L12 20 L8 20 Z" fill="#08A98D" />
          {/* Dhoti */}
          <path d="M8 20 L9 27 L11.5 27 L12 20 Z" fill="#E3E0F5" />
          {/* Left reaching arm */}
          <path d="M7 10.5 L3 13 L0 12" stroke="#EDBB99" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="1.5" y1="9.5" x2="-1" y2="15.5" stroke="#F02A8A" strokeWidth="1.5" strokeLinecap="round" />
          {/* Right raised arm */}
          <path d="M13.5 10.5 L17 6.5 L19.5 4" stroke="#EDBB99" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="2" x2="20.5" y2="8" stroke="#894EFF" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Signature STRING-X Connecting Pink String */}
        <motion.path
          d="M108 22 C114 26 122 26 128 22"
          stroke="#F02A8A"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0.3, opacity: 0.6 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        <circle cx="118" cy="24.5" r="1.3" fill="#FFC928" />
      </svg>
    </div>
  );
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  onSelectNavratri,
  onOpenProfile,
  ctaText,
  isChecking: isCheckingProp,
}) => {
  const [localChecking, setLocalChecking] = useState(false);
  const isChecking = isCheckingProp ?? localChecking;

  const handleSelectNavratri = async () => {
    if (isChecking) return;
    setLocalChecking(true);
    try {
      await onSelectNavratri();
    } catch (err) {
      console.error('[HomeScreen] Error navigating to event:', err);
    } finally {
      setLocalChecking(false);
    }
  };

  // Extract first name for display
  const firstName = profile.fullName
    ? profile.fullName.trim().split(' ')[0]
    : 'there';

  // Main avatar displays only photoUrl uploaded in photo onboarding, never face verification
  const avatarPhoto = profile.photoUrl;

  // Determine dynamic CTA button text based on event questionnaire completion
  const isNavratriDone = profileService.isNavratriCompleted(profile);
  const buttonLabel = ctaText || (isNavratriDone ? 'View Match Status' : 'Find My Match');
  const displayLabel = isChecking ? 'Checking your match...' : buttonLabel;

  return (
    <div className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-start bg-[#E3E0F5] text-[#251436] select-none overflow-hidden relative font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ================================================================== */}
      {/* 1. TOP APP BAR (Centrally Anchored STRING X Logo, Avatar on Right)   */}
      {/* ================================================================== */}
      <header className="shrink-0 relative flex items-center justify-between px-5 sm:px-6 pt-[max(14px,env(safe-area-inset-top,0px))] pb-3 z-20">
        {/* Left Spacer to perfectly balance the right avatar */}
        <div className="w-9 h-9 shrink-0" aria-hidden="true" />

        {/* CENTER: Strong STRING X Wordmark */}
        <div className="flex items-center gap-1.5 select-none">
          <div className="flex items-center tracking-tight text-[22px] sm:text-[24px] font-black text-[#251436]">
            <span>STRING</span>
            <span className="mx-1" />
            <span className="text-[#F02A8A] relative">
              X
              <svg
                className="absolute -bottom-1 left-0 w-full h-1.5 overflow-visible"
                viewBox="0 0 18 5"
                fill="none"
              >
                <path
                  d="M1 1C5 4 13 4 17 1"
                  stroke="#FFC928"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>
        </div>

        {/* Right: Circular Profile Avatar with Active Dot */}
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label="View profile and settings"
          className="relative w-9 h-9 rounded-full border border-[#251436]/15 bg-white flex items-center justify-center p-0.5 ring-2 ring-white/70 hover:ring-[#894EFF]/30 active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs"
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-tr from-[#894EFF] to-[#B085FF] flex items-center justify-center text-white font-black text-xs">
            {avatarPhoto ? (
              <img
                src={avatarPhoto}
                alt={profile.fullName || 'User avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{firstName.charAt(0) || 'U'}</span>
            )}
          </div>
          {/* Green online/active indicator */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-white shadow-2xs" />
        </button>
      </header>

      {/* Subtle Hairline Divider Underneath App Bar */}
      <div className="w-full px-5 sm:px-6 shrink-0">
        <div className="w-full h-[1px] bg-[#251436]/8" />
      </div>

      {/* ================================================================== */}
      {/* 2. MAIN BODY (Spacious, Minimal, Direct Event Presentation)         */}
      {/* ================================================================== */}
      <main className="w-full px-5 sm:px-6 pt-5 pb-4 flex-1 flex flex-col justify-start overflow-hidden">
        {/* 1. PLAYFUL YELLOW EVENT TAG */}
        <div className="mb-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFC928] text-[#251436] font-black text-[11px] tracking-wider uppercase border border-[#251436]/35 shadow-[1.5px_1.5px_0px_#251436] transform -rotate-1 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#251436]" />
            <span>CAMPUS EVENTS</span>
          </div>
        </div>

        {/* 2. EVENT TITLE */}
        <div className="mb-3.5 shrink-0">
          <h1 className="text-2xl sm:text-[28px] font-black text-[#251436] tracking-tight leading-tight">
            NAVRATRI 2026
          </h1>
        </div>

        {/* 3. COMPACT NAVRATRI EVENT BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full rounded-[20px] bg-gradient-to-b from-[#24133A] via-[#1B0C2D] to-[#130720] border border-white/10 shadow-[0_4px_24px_rgba(20,8,34,0.2)] p-4 sm:p-4.5 relative overflow-hidden flex flex-col justify-between"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#894EFF]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FF4F81]/15 rounded-full blur-xl pointer-events-none" />

          {/* Banner Content Container */}
          <div className="relative z-10 flex flex-col space-y-3">
            {/* TOP ROW: Title & LIVE indicator */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black tracking-wider uppercase text-white/90">
                NAVRATRI 2026
              </span>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-full border border-[#10B981]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>LIVE</span>
              </span>
            </div>

            {/* Compact Navratri Artwork Illustration */}
            <NavratriVisual />

            {/* Short Concise Description */}
            <p className="text-xs sm:text-[13px] text-white/80 font-medium leading-relaxed">
              Match by vibe, energy &amp; dance style.
            </p>

            {/* Compact Metadata Row */}
            <div className="pt-2.5 border-t border-white/10 flex items-center gap-2 text-[11px] font-medium text-white/70">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4F81]" />
                <span className="font-semibold text-white/90">1.2K joining</span>
              </span>
              <span className="text-white/30">•</span>
              <span className="text-white/70">3 days left</span>
            </div>

            {/* Primary Full-Width CTA Button */}
            <div className="pt-1">
              <button
                type="button"
                id="find-my-match-btn"
                aria-label={isChecking ? 'Checking your match' : 'Find My Match for Navratri 2026'}
                aria-busy={isChecking}
                disabled={isChecking}
                onClick={handleSelectNavratri}
                className={`w-full h-[44px] px-4 font-bold text-xs sm:text-sm rounded-[13px] transition-all flex items-center justify-center gap-2 ${
                  isChecking
                    ? 'bg-[#894EFF]/85 text-white/90 cursor-not-allowed shadow-none'
                    : 'bg-[#894EFF] hover:bg-[#783cee] active:bg-[#6a2fdb] active:scale-[0.99] text-white shadow-[0_2px_12px_rgba(137,78,255,0.4)] cursor-pointer group'
                }`}
              >
                {isChecking ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                    <span>{displayLabel}</span>
                  </>
                ) : (
                  <>
                    <span>{displayLabel}</span>
                    <ArrowRight
                      size={16}
                      strokeWidth={2.5}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* 4. INTENTIONAL BALANCED WHITESPACE */}
        <div className="flex-1 min-h-[20px] pointer-events-none" />
      </main>
    </div>
  );
};
