import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, X, Lock } from 'lucide-react';
import { PrimaryButton } from '../ui/PrimaryButton';

interface LandingScreenProps {
  onStart: () => void;
  onViewCountdown?: () => void;
  onGoogleSignIn?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onStart: _onStart,
  onGoogleSignIn,
}) => {
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [showPhoneToast, setShowPhoneToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpenAuthSheet = () => {
    setIsAuthSheetOpen(true);
  };

  const handleCloseAuthSheet = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setShowPhoneToast(false);
    setIsAuthSheetOpen(false);
  };

  const handlePhoneAuth = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    // Briefly toggle state to re-trigger slide-in animation if tapped repeatedly
    setShowPhoneToast(false);
    setTimeout(() => {
      setShowPhoneToast(true);
      toastTimerRef.current = setTimeout(() => {
        setShowPhoneToast(false);
      }, 2800);
    }, 30);
  };

  const handleGoogleAuth = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setShowPhoneToast(false);
    setIsAuthSheetOpen(false);
    if (onGoogleSignIn) {
      onGoogleSignIn();
    }
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between p-5 sm:p-6 text-white select-none overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
      style={{
        paddingTop: 'max(20px, env(safe-area-inset-top, 20px))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
      }}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FULL-PAGE BLEED BACKGROUND ILLUSTRATION LAYER
          Vibrant, colorful, unobstructed artwork
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0">
        <img
          src="/assets/main.png"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/assets/main.svg';
          }}
          alt="STRING X Rooftop Festival Scene"
          className="w-full h-full object-cover object-center"
          loading="eager"
        />

        {/* Localized subtle bottom gradient for comfortable CTA contrast over the dark rooftop */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#140620]/95 via-[#140620]/45 to-transparent pointer-events-none" />

        {/* Very soft atmospheric ambient glow near the glowing pink string */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 60%, rgba(240, 42, 138, 0.25) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FLOATING FOREGROUND UI CONTENT
          Editorial minimal top + wide open window + bottom CTA
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between flex-1 min-h-0 pointer-events-auto">
        {/* TOP BRANDING & EDITORIAL SUBTEXT ONLY (Shifted ~5-8% downward into the sky) */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center text-center pt-9 sm:pt-13 shrink-0"
        >
          {/* STRING X Primary Wordmark */}
          <div className="inline-flex items-center justify-center gap-2 select-none drop-shadow-xs">
            <span className="text-3xl sm:text-[38px] font-black tracking-tight text-[#1B0B2A]">
              STRING
            </span>
            <span className="relative text-3xl sm:text-[38px] font-black text-[#F02A8A]">
              X
              {/* Subtle curved string under X */}
              <svg
                className="absolute -bottom-1 left-0 w-full h-2 overflow-visible"
                viewBox="0 0 20 6"
                fill="none"
              >
                <path
                  d="M1 1C5 5 15 5 19 1"
                  stroke="#FFC928"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>

          {/* Clean Editorial Subtext: "One thread. Many stories." */}
          <div className="mt-2 sm:mt-2.5 text-center select-none">
            <p className="text-sm sm:text-[15px] font-bold text-[#1B0B2A]/90 tracking-tight leading-snug drop-shadow-xs">
              One thread.
            </p>
            <p className="text-sm sm:text-[15px] font-bold text-[#1B0B2A]/90 tracking-tight leading-snug drop-shadow-xs">
              Many stories.
            </p>
            {/* Playful curved thread stroke accent */}
            <div className="flex justify-center mt-1">
              <svg width="42" height="6" viewBox="0 0 42 6" fill="none">
                <path
                  d="M2 3.5C12 1 30 1 40 3.5"
                  stroke="#FFC928"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* MIDDLE OPEN WINDOW:
            Completely unobstructed view of the moon, city skyline,
            two rooftop students, cat, and glowing pink connection string */}
        <div className="flex-1 min-h-[120px] pointer-events-none" />

        {/* LOWER AREA: Subtle Social Proof + CTA + Microcopy */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="shrink-0 flex flex-col items-center w-full pb-1 sm:pb-2"
        >
          {/* Subtle Floating Translucent Social Proof Pill */}
          <div className="mb-3 sm:mb-3.5 flex justify-center">
            <div className="inline-flex items-center gap-2 py-1.5 px-3.5 bg-[#1B0B2A]/80 backdrop-blur-md border border-[#894EFF]/35 rounded-full shadow-md">
              <div className="flex -space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-[#FFC928] border border-[#251436] flex items-center justify-center text-[10px]">💃</span>
                <span className="w-5 h-5 rounded-full bg-[#F02A8A] border border-[#251436] flex items-center justify-center text-[10px]">🕺</span>
                <span className="w-5 h-5 rounded-full bg-[#08A98D] border border-[#251436] flex items-center justify-center text-[10px]">🪩</span>
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#E3E0F5]">
                <strong className="text-[#FFC928]">2,400+ students</strong> ready to pair up
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="w-full">
            <PrimaryButton
              label="Get Started"
              onClick={handleOpenAuthSheet}
              variant="primary"
              icon={true}
            />
          </div>

          {/* Clean Bottom Subtitle */}
          <div className="w-full pt-2.5 sm:pt-3 text-center">
            <p className="text-xs sm:text-[13px] font-semibold text-[#E3E0F5]/80 tracking-wide drop-shadow-xs">
              Your campus. Your vibe.
            </p>
          </div>
        </motion.div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          AUTHENTICATION METHOD BOTTOM SHEET POPUP
          Slides smoothly up from the bottom with refined dimmed backdrop
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {isAuthSheetOpen && (
          <>
            {/* Refined Dimming Backdrop with moderate blur and contextual transparency */}
            <motion.div
              key="auth-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              onClick={handleCloseAuthSheet}
              className="absolute inset-0 z-40 bg-[#12051E]/70 backdrop-blur-[3.5px]"
              aria-label="Close authentication selector"
            />

            {/* Bottom Sheet Card */}
            <motion.div
              key="auth-bottom-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 32,
                stiffness: 340,
                mass: 0.85,
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 400) {
                  handleCloseAuthSheet();
                }
              }}
              className="absolute inset-x-0 bottom-0 z-50 bg-[#1D0C2E] border-t-3 border-x-3 border-[#2E1647] rounded-t-[34px] sm:rounded-t-[38px] shadow-[0px_-16px_48px_rgba(15,4,25,0.9)] flex flex-col max-h-[88%] text-white"
            >
              {/* Subtle top ambient glow */}
              <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#894EFF]/12 via-[#894EFF]/4 to-transparent pointer-events-none rounded-t-[34px] sm:rounded-t-[38px]" />

              {/* Natural top-right integrated Close Button */}
              <button
                type="button"
                onClick={handleCloseAuthSheet}
                className="absolute top-3.5 right-4 sm:top-4 sm:right-5 w-8 h-8 rounded-full bg-white/8 hover:bg-white/16 active:scale-95 text-[#E3E0F5]/70 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 z-20 shadow-xs"
                aria-label="Close"
              >
                <X size={15} strokeWidth={2.4} />
              </button>

              {/* Top drag handle */}
              <div className="pt-3 pb-1 flex flex-col items-center cursor-grab active:cursor-grabbing relative z-10">
                <div className="w-10 h-1 rounded-full bg-[#E3E0F5]/25 hover:bg-[#E3E0F5]/35 transition-colors" />
              </div>

              {/* Sheet Inner Content */}
              <div className="px-6 sm:px-8 pt-2 pb-7 sm:pb-8 flex flex-col relative z-10">
                {/* ✦ / Connection visual element (Subtle floating animated motif) */}
                <div className="flex justify-center mb-2.5">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: -4 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: [0, -3, 0],
                    }}
                    transition={{
                      opacity: { duration: 0.35, ease: 'easeOut' },
                      scale: { duration: 0.35, ease: 'easeOut' },
                      y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    className="relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#2A1343]/90 border border-[#894EFF]/35 shadow-[0_2px_14px_rgba(137,78,255,0.22)]"
                  >
                    {/* Node 1 */}
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#894EFF] opacity-50" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#894EFF]" />
                    </span>

                    {/* Connecting thread SVG motif */}
                    <svg width="28" height="12" viewBox="0 0 28 12" fill="none" className="overflow-visible">
                      <path
                        d="M1 6C7 1 11 11 17 6C20 3.5 24 9 27 6"
                        stroke="#F02A8A"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeOpacity="0.35"
                        className="filter blur-[1px]"
                      />
                      <path
                        d="M1 6C7 1 11 11 17 6C20 3.5 24 9 27 6"
                        stroke="url(#sheet-thread-gradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="sheet-thread-gradient" x1="0" y1="0" x2="28" y2="0" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#894EFF" />
                          <stop offset="0.5" stopColor="#FFC928" />
                          <stop offset="1" stopColor="#F02A8A" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Node 2 */}
                    <span className="relative flex h-2 w-2">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F02A8A] opacity-50"
                        style={{ animationDelay: '1s' }}
                      />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F02A8A]" />
                    </span>
                  </motion.div>
                </div>

                {/* Expressive Header & Supporting Line with gentle entrance */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
                  className="flex flex-col items-center text-center"
                >
                  <h3 className="text-[22px] sm:text-[25px] font-black text-white tracking-tight leading-snug">
                    Welcome to{' '}
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[#894EFF]">STRING</span>
                      <span className="relative inline-block text-[#F02A8A]">
                        X
                        {/* Signature brand yellow thread accent under X */}
                        <svg
                          className="absolute -bottom-0.5 left-0 w-full h-1.5 overflow-visible"
                          viewBox="0 0 16 5"
                          fill="none"
                        >
                          <path
                            d="M1 1C4 3.5 12 3.5 15 1"
                            stroke="#FFC928"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </span>
                  </h3>
                  <p className="text-[13px] sm:text-sm font-semibold text-[#E3E0F5]/75 mt-1 tracking-wide">
                    One thread. Many stories.
                  </p>
                </motion.div>

                {/* Subtle compositional divider line */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#E3E0F5]/15 to-transparent mt-4 mb-4 sm:mt-5 sm:mb-5" />

                {/* Authentication Options List with OR divider (PRESERVED) */}
                <div className="flex flex-col">
                  {/* Option 1: Continue with Google */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="w-full h-[54px] px-5 rounded-2xl bg-white hover:bg-neutral-50 text-[#251436] border-2.5 border-[#251436] font-extrabold text-[15px] flex items-center justify-start gap-3.5 shadow-[3px_3px_0px_#251436] active:translate-y-0.5 active:shadow-[1px_1px_0px_#251436] transition-all cursor-pointer group"
                  >
                    {/* Official Google 'G' Multi-Color Icon */}
                    <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                      <svg width="22" height="22" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.39 7.35 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.61 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                    </div>
                    <span className="tracking-tight text-left">Continue with Google</span>
                  </button>

                  {/* Supporting subtext: Student emails only */}
                  <p className="text-[11.5px] font-semibold text-[#E3E0F5]/65 text-center mt-2 sm:mt-2.5 tracking-normal select-none">
                    Student emails only.
                  </p>

                  {/* Compact & visually secondary "OR" Divider */}
                  <div className="flex items-center my-2 sm:my-2.5 px-2">
                    <div className="flex-1 h-px bg-[#E3E0F5]/15" />
                    <span className="px-3.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#E3E0F5]/45 select-none">
                      OR
                    </span>
                    <div className="flex-1 h-px bg-[#E3E0F5]/15" />
                  </div>

                  {/* Option 2: Continue with Phone Number (Subtle locked indicator, stays visible) */}
                  <motion.button
                    type="button"
                    onClick={handlePhoneAuth}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-[54px] px-5 rounded-2xl bg-[#894EFF]/85 hover:bg-[#894EFF]/95 text-white border-2.5 border-[#251436] font-extrabold text-[15px] flex items-center justify-start gap-3.5 shadow-[3px_3px_0px_#251436] active:translate-y-0.5 active:shadow-[1px_1px_0px_#251436] transition-all cursor-pointer group opacity-90 hover:opacity-100"
                  >
                    {/* Clean Phone Icon */}
                    <div className="w-7 h-7 shrink-0 flex items-center justify-center text-[#FFC928]">
                      <Phone size={20} strokeWidth={2.4} />
                    </div>
                    <span className="tracking-tight text-left">Continue with Phone Number</span>
                    {/* Subtle lock indicator communicating phone sign-up is not available yet */}
                    <div className="ml-auto w-6 h-6 rounded-full bg-[#1D0C2E]/40 border border-white/10 flex items-center justify-center text-[#E3E0F5]/60 group-hover:text-white/85 transition-colors shrink-0">
                      <Lock size={12} strokeWidth={2.4} />
                    </div>
                  </motion.button>
                </div>

                {/* Maybe later button */}
                <div className="mt-4 sm:mt-5 text-center">
                  <button
                    type="button"
                    onClick={handleCloseAuthSheet}
                    className="text-xs sm:text-[13px] font-semibold text-[#E3E0F5]/60 hover:text-white py-1.5 px-4 rounded-lg transition-colors cursor-pointer select-none"
                  >
                    Maybe later
                  </button>
                </div>
              </div>

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  TEMPORARY FLOATING TOAST NOTIFICATION
                  Centered horizontally immediately above the bottom sheet
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <AnimatePresence>
                {showPhoneToast && (
                  <motion.div
                    key="phone-unavailable-toast"
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    onClick={() => setShowPhoneToast(false)}
                    className="absolute -top-[68px] sm:-top-[74px] inset-x-0 mx-auto w-fit max-w-[94%] z-60 pointer-events-auto cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[#160523]/95 border border-[#F02A8A]/45 shadow-[0_8px_32px_rgba(15,3,24,0.9)] backdrop-blur-md">
                      {/* Small Lock Icon in glowing container */}
                      <div className="w-8 h-8 rounded-xl bg-[#2A1343] border border-[#894EFF]/40 flex items-center justify-center shrink-0 text-[#FFC928] shadow-xs">
                        <Lock size={15} strokeWidth={2.4} />
                      </div>

                      {/* Notification Copy */}
                      <div className="flex flex-col text-left pr-1 select-none">
                        <span className="text-[12.5px] sm:text-[13px] font-black text-white leading-tight tracking-tight">
                          Phone sign-up isn&apos;t available yet
                        </span>
                        <span className="text-[10.5px] sm:text-[11px] font-semibold text-[#E3E0F5]/70 leading-tight mt-0.5">
                          String X currently supports Google sign-in only.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
