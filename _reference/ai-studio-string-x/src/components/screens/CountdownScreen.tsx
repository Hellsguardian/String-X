import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, Instagram } from 'lucide-react';
import { StringXLogo } from '../illustrations/GarbaIllustrations';
import { MatchRevealModal } from './MatchRevealModal';
import { UserProfile } from '../../types';

interface CountdownScreenProps {
  profile: UserProfile;
  onBack?: () => void;
  onViewProfile?: () => void;
  onEnterEventDiscovery?: () => void;
  onRevealMatch?: () => void;
}

export const CountdownScreen: React.FC<CountdownScreenProps> = ({
  profile,
  onBack,
  onRevealMatch,
}) => {
  const [showRevealModal, setShowRevealModal] = useState(false);

  // Navratri Countdown timer logic (days, hours, minutes, seconds)
  // Target: 12 days, 7 hours, 40 minutes, 40 seconds
  const [timeLeft, setTimeLeft] = useState({
    days: 12,
    hours: 7,
    minutes: 40,
    seconds: 40
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          // When countdown reaches zero, trigger the Match Reveal experience
          if (onRevealMatch) {
            onRevealMatch();
          } else {
            setShowRevealModal(true);
          }
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between p-5 sm:p-6 pt-[max(16px,env(safe-area-inset-top,0px))] pb-[max(16px,env(safe-area-inset-bottom,0px))] bg-[#251436] text-white select-none relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 9. BACKGROUND & VISUAL ATMOSPHERE: Atmospheric ambient particles & subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft radial atmospheric glow behind the countdown */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 50% 46%, rgba(255, 201, 40, 0.18) 0%, rgba(240, 42, 138, 0.12) 38%, transparent 70%)'
          }}
        />

        {/* Slow-drifting ambient micro-particles */}
        <motion.div
          animate={{ y: [0, -14, 0], opacity: [0.15, 0.45, 0.15] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="absolute top-14 left-8 w-1 h-1 rounded-full bg-[#FFC928]"
        />
        <motion.div
          animate={{ y: [0, 16, 0], opacity: [0.12, 0.4, 0.12] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          className="absolute top-28 right-8 w-1.5 h-1.5 rounded-full bg-[#F02A8A]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.4, 0.15] }}
          transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
          className="absolute bottom-28 left-10 w-1 h-1 rounded-full bg-[#08A98D]"
        />
      </div>

      {/* 1. TOP STATUS BAR: Native Android-style Back Button + Mathematically Centered STRING X */}
      <div className="relative flex items-center shrink-0 z-10 w-full h-10 sm:h-11">
        {/* Back button on the far left: 40px rounded-square, dark translucent purple, subtle lavender border */}
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-[#1B0B2A]/80 hover:bg-[#1B0B2A] active:translate-y-0.5 border border-[#E3E0F5]/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs z-20"
          aria-label="Go back"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>

        {/* STRING-X logo mathematically centered relative to the entire screen width */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
          <StringXLogo size="sm" light={true} />
        </div>
      </div>

      {/* CENTER STACK: Hero Heading + Hero Countdown + Status Message */}
      <div className="flex-1 min-h-0 flex flex-col justify-center items-center text-center py-2 relative z-10">
        {/* 1 & 2. MAIN HEADING (Directly above the countdown) */}
        <div className="shrink-0 mb-3 sm:mb-4">
          <h1 className="text-2xl sm:text-[28px] font-black text-white tracking-tight leading-[1.12]">
            String <span className="bg-gradient-to-r from-[#FFC928] via-[#F02A8A] to-[#894EFF] bg-clip-text text-transparent">attached.</span>
          </h1>
          <p className="text-xs font-semibold text-[#E3E0F5]/80 max-w-xs mx-auto mt-1.5 leading-normal">
            Your Garba partner is locked in.<br />
            Their identity will be revealed when Navratri begins.
          </p>
        </div>

        {/* 3 & 4. COUNTDOWN — THE HERO ⭐ */}
        <div className="relative w-full max-w-[324px] mx-auto flex flex-col items-center">
          {/* Subtle golden ambient glow around the timer */}
          <div
            className="absolute -inset-4 rounded-3xl opacity-35 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(255, 201, 40, 0.25) 0%, rgba(240, 42, 138, 0.15) 50%, transparent 75%)'
            }}
          />

          {/* Uppercase Label */}
          <div className="text-[10px] font-mono font-black text-[#E3E0F5]/70 tracking-widest uppercase mb-2 text-center flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC928] animate-pulse" />
            <span>MATCH REVEALS IN</span>
          </div>

          {/* Four Large Premium Countdown Cards */}
          <div className="grid grid-cols-4 gap-2 w-full">
            {/* DAYS */}
            <div className="bg-white text-[#251436] py-3.5 px-1 rounded-2xl border-2 border-[#FFC928] shadow-[2.5px_2.5px_0px_#FFC928] flex flex-col items-center relative overflow-hidden">
              <span className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[9.5px] font-black uppercase tracking-wider text-[#894EFF] mt-1.5">
                DAYS
              </span>
            </div>

            {/* HOURS */}
            <div className="bg-white text-[#251436] py-3.5 px-1 rounded-2xl border-2 border-[#FFC928] shadow-[2.5px_2.5px_0px_#FFC928] flex flex-col items-center relative overflow-hidden">
              <span className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[9.5px] font-black uppercase tracking-wider text-[#894EFF] mt-1.5">
                HOURS
              </span>
            </div>

            {/* MINS */}
            <div className="bg-white text-[#251436] py-3.5 px-1 rounded-2xl border-2 border-[#FFC928] shadow-[2.5px_2.5px_0px_#FFC928] flex flex-col items-center relative overflow-hidden">
              <span className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9.5px] font-black uppercase tracking-wider text-[#894EFF] mt-1.5">
                MINS
              </span>
            </div>

            {/* SECS (Pink Accent with live ticking & subtle pulse) */}
            <div className="bg-[#F02A8A] text-white py-3.5 px-1 rounded-2xl border-2 border-white shadow-[2.5px_2.5px_0px_#FFFFFF] flex flex-col items-center relative overflow-hidden">
              <motion.span
                key={timeLeft.seconds}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className="text-3xl sm:text-4xl font-black tracking-tight leading-none"
              >
                {String(timeLeft.seconds).padStart(2, '0')}
              </motion.span>
              <span className="text-[9.5px] font-black uppercase tracking-wider text-white mt-1.5">
                SECS
              </span>
              {/* Subtle animated light travelling across seconds */}
              <motion.div
                animate={{ x: [-60, 60], opacity: [0, 0.4, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                className="absolute inset-y-0 w-8 bg-white/25 skew-x-12 pointer-events-none"
              />
            </div>
          </div>

          {/* 5. MATCH STATUS MESSAGE (Under the Timer) */}
          <button
            type="button"
            onClick={onRevealMatch || (() => setShowRevealModal(true))}
            className="w-full mt-4 p-3 rounded-2xl bg-[#1B0B2A]/70 hover:bg-[#1B0B2A]/90 active:scale-[0.98] border border-[#894EFF]/30 hover:border-[#894EFF]/60 text-center backdrop-blur-xs transition-all cursor-pointer group"
          >
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#FFC928] mb-1">
              <Lock size={12} className="text-[#FFC928]" />
              <span>Identity Locked</span>
            </div>
            <p className="text-xs font-semibold text-white leading-relaxed">
              Your STRING X match is safely hidden until Navratri.
            </p>
            <p className="text-[11px] font-medium text-[#E3E0F5]/80 mt-1 flex items-center justify-center gap-1 group-hover:text-[#FFC928] transition-colors">
              <span>Tap to preview Match Reveal</span>
              <span>→</span>
            </p>
          </button>
        </div>
      </div>

      {/* 7 & 8. INSTAGRAM CTA & MINIMAL BOTTOM AREA (No Profile button) */}
      <div className="shrink-0 pt-2 pb-1 space-y-2 relative z-10 w-full max-w-[320px] mx-auto text-center">
        {/* Instagram CTA */}
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 active:translate-y-0.5 border border-[#F02A8A]/40 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer backdrop-blur-xs"
        >
          {/* Instagram gradient icon badge */}
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#FFC928] via-[#F02A8A] to-[#894EFF] flex items-center justify-center text-white shrink-0">
            <Instagram size={13} strokeWidth={2.5} />
          </div>
          <span>Follow us on Instagram →</span>
        </a>

        {/* Small supporting microtext */}
        <p className="text-[10px] font-semibold text-[#E3E0F5]/70">
          Get Navratri updates & reveal-day surprises
        </p>

        {/* Subtle secondary note */}
        <p className="text-[9.5px] font-medium text-[#E3E0F5]/50 pt-0.5">
          Your match will be revealed automatically on Navratri.
        </p>
      </div>

      {/* Match Reveal Modal (Triggered when countdown reaches zero) */}
      <MatchRevealModal
        isOpen={showRevealModal}
        onClose={() => setShowRevealModal(false)}
        userNickname={profile.nickname || profile.fullName}
      />
    </div>
  );
};
