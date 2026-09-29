import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { StringXLogo } from '../illustrations/GarbaIllustrations';
import { UserProfile } from '../../types';

interface SubmissionSuccessScreenProps {
  profile?: UserProfile;
  collegeName?: string;
  onBack?: () => void;
  onContinueToCountdown: () => void;
  onEnterMainApp?: () => void;
}

interface CandidateSignal {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number; // px
  color: string;
  glow: string;
  opacity: number;
  pulseDelay: number;
  pulseDuration: number;
}

const ACCENT_COLORS = [
  { color: '#FFC928', glow: 'rgba(255, 201, 40, 0.75)' },
  { color: '#F02A8A', glow: 'rgba(240, 42, 138, 0.75)' },
  { color: '#894EFF', glow: 'rgba(137, 78, 255, 0.75)' },
  { color: '#08A98D', glow: 'rgba(8, 169, 141, 0.75)' },
];

/**
 * Procedurally generates 1 to 5 candidate signals at completely randomized polar positions.
 * Ensures dots stay within radar bounds and avoid overlapping the central user marker.
 */
function generateRandomSignals(cycle: number): CandidateSignal[] {
  const count = Math.floor(Math.random() * 5) + 1; // Strictly 1 to 5 signals
  const signals: CandidateSignal[] = [];

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let x = 50;
    let y = 50;
    let tooClose = true;

    while (attempts < 20 && tooClose) {
      // Distance from center: between 19% and 42% (center is 50%, outer ring boundary is 50%)
      const minR = 19;
      const maxR = 42;
      const r = minR + Math.random() * (maxR - minR);
      const angle = Math.random() * 2 * Math.PI;

      x = Math.round((50 + r * Math.cos(angle)) * 10) / 10;
      y = Math.round((50 + r * Math.sin(angle)) * 10) / 10;

      // Prevent dots from awkwardly clumping on top of each other (min 11% distance)
      tooClose = signals.some(s => {
        const dx = s.x - x;
        const dy = s.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 11;
      });
      attempts++;
    }

    const col = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
    signals.push({
      id: `sig-${cycle}-${i}-${x}-${y}`,
      x,
      y,
      size: 6 + Math.floor(Math.random() * 4), // 6 to 9px - small, subtle, premium
      color: col.color,
      glow: col.glow,
      opacity: 0.65 + Math.random() * 0.35,
      pulseDelay: Math.random() * 1.2,
      pulseDuration: 1.8 + Math.random() * 0.8,
    });
  }

  return signals;
}

// Live Search Status (Above Radar)
const SEARCH_STATUS_MESSAGES = [
  'Scanning nearby strings…',
  'Checking Garba vibes…',
  'Matching shared interests…',
  'Comparing campus preferences…',
  'Finding compatible energy…',
  'Searching again…'
];

// Human, social bottom status messages
const BOTTOM_ACTIVITY_MESSAGES = [
  'Scanning campus strings…',
  'Finding your kind of people…',
  'Looking for your rhythm…',
  'Still searching…',
  'Your string is out there…'
];

export const SubmissionSuccessScreen: React.FC<SubmissionSuccessScreenProps> = ({
  profile,
  onBack,
  onContinueToCountdown,
}) => {
  const [scanCycle, setScanCycle] = useState(0);
  const [signals, setSignals] = useState<CandidateSignal[]>(() => generateRandomSignals(0));
  const [searchStatusIndex, setSearchStatusIndex] = useState(0);
  const [bottomStatusIndex, setBottomStatusIndex] = useState(0);
  const [progress, setProgress] = useState(34);
  const [isMatchFound, setIsMatchFound] = useState(false);
  const hasNavigatedRef = useRef(false);

  // Every complete radar rotation (~3.0s), regenerate a new batch of 1 to 5 signals
  useEffect(() => {
    if (isMatchFound) return;

    const cycleInterval = setInterval(() => {
      setScanCycle(prev => {
        const next = prev + 1;
        setSignals(generateRandomSignals(next));
        return next;
      });
    }, 3000);

    return () => clearInterval(cycleInterval);
  }, [isMatchFound]);

  // Smoothly cycle search status above radar
  useEffect(() => {
    if (isMatchFound) return;

    const statusTimer = setInterval(() => {
      setSearchStatusIndex(prev => (prev + 1) % SEARCH_STATUS_MESSAGES.length);
    }, 2500);

    return () => clearInterval(statusTimer);
  }, [isMatchFound]);

  // Smoothly cycle bottom human activity status
  useEffect(() => {
    if (isMatchFound) return;

    const bottomTimer = setInterval(() => {
      setBottomStatusIndex(prev => (prev + 1) % BOTTOM_ACTIVITY_MESSAGES.length);
    }, 2800);

    return () => clearInterval(bottomTimer);
  }, [isMatchFound]);

  // Natural fluctuating AI matchmaking curve
  useEffect(() => {
    const curve = [34, 43, 52, 48, 61, 72, 68, 79, 88, 94, 100];
    let step = 0;

    const progressTimer = setInterval(() => {
      step++;
      if (step < curve.length) {
        setProgress(curve[step]);
        if (curve[step] === 100) {
          triggerMatchFound();
          clearInterval(progressTimer);
        }
      } else {
        triggerMatchFound();
        clearInterval(progressTimer);
      }
    }, 550);

    return () => clearInterval(progressTimer);
  }, []);

  // Match found moment: brief focused celebration then automatic transition
  const triggerMatchFound = () => {
    if (hasNavigatedRef.current) return;
    setIsMatchFound(true);
    setProgress(100);

    // Auto-navigate to next page after short match-detected animation (750ms)
    setTimeout(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        onContinueToCountdown();
      }
    }, 750);
  };

  return (
    <div
      onClick={() => {
        // Quick tap accelerator for developers or impatient users
        if (!isMatchFound) {
          triggerMatchFound();
        }
      }}
      className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between p-5 sm:p-6 pt-[max(16px,env(safe-area-inset-top,0px))] pb-[max(16px,env(safe-area-inset-bottom,0px))] bg-[#251436] text-white select-none relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* 8. SUBTLE AMBIENT LIFE: Soft background atmospheric glow & floating micro-particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft radial background glow centered on radar */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 50% 52%, rgba(137, 78, 255, 0.16) 0%, rgba(240, 42, 138, 0.08) 35%, transparent 68%)'
          }}
        />

        {/* Tiny slow-drifting micro-particles */}
        <motion.div
          animate={{ y: [0, -14, 0], opacity: [0.15, 0.45, 0.15] }}
          transition={{ repeat: Infinity, duration: 6.5, ease: "easeInOut" }}
          className="absolute top-14 left-7 w-1 h-1 rounded-full bg-[#FFC928]"
        />
        <motion.div
          animate={{ y: [0, 15, 0], opacity: [0.12, 0.4, 0.12] }}
          transition={{ repeat: Infinity, duration: 7.5, ease: "easeInOut" }}
          className="absolute top-28 right-8 w-1.5 h-1.5 rounded-full bg-[#F02A8A]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ repeat: Infinity, duration: 5.8, ease: "easeInOut" }}
          className="absolute bottom-24 left-10 w-1 h-1 rounded-full bg-[#08A98D]"
        />
      </div>

      {/* 2. TOP STATUS BAR: Native Android-style Back Button + Mathematically Centered STRING X */}
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

        {/* STRING-X logo mathematically centered relative to the entire phone viewport width */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
          <StringXLogo size="sm" light={true} />
        </div>
      </div>

      {/* 1. BALANCED CENTRAL COMPOSITION */}
      <div className="flex-1 min-h-0 flex flex-col justify-center items-center text-center py-1 sm:py-2 relative z-10">
        {/* 3. MAIN HEADING */}
        <div className="shrink-0 mb-2 sm:mb-2.5">
          <h1 className="text-2xl sm:text-[28px] font-black text-white tracking-tight leading-[1.12]">
            {isMatchFound ? (
              <span className="text-[#FFC928]">String connected!</span>
            ) : (
              <>
                Your string is<br />
                getting <span className="bg-gradient-to-r from-[#FFC928] via-[#F02A8A] to-[#894EFF] bg-clip-text text-transparent">connected.</span>
              </>
            )}
          </h1>
          <p className="text-xs font-semibold text-[#E3E0F5]/75 max-w-xs mx-auto mt-1 leading-normal">
            {isMatchFound
              ? 'Locking connection before partner reveal…'
              : "We're searching campus for someone who matches your energy, interests and Garba vibe."}
          </p>
        </div>

        {/* 4. LIVE SEARCH STATUS (Directly Above Radar) */}
        <div className="h-6 mb-2 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={isMatchFound ? 'found' : searchStatusIndex}
              initial={{ opacity: 0, y: 3, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -3, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1B0B2A]/80 border border-[#894EFF]/35 text-[11px] font-bold text-[#FFC928] shadow-[0_0_12px_rgba(137,78,255,0.15)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFC928] animate-pulse" />
              <span>{isMatchFound ? '✨ Match signal synchronized!' : SEARCH_STATUS_MESSAGES[searchStatusIndex]}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 5, 6 & 7. HERO LIVE MATCHMAKING RADAR */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Radar Scanner Container */}
          <div className="relative w-[218px] h-[218px] sm:w-[234px] sm:h-[234px] flex items-center justify-center">
            {/* 5 Thin Concentric Radar Rings */}
            <div className="absolute inset-0 rounded-full border border-[#894EFF]/25 bg-[#170924]/75 backdrop-blur-xs shadow-[0_0_40px_rgba(137,78,255,0.22)]" />
            <div className="absolute w-[82%] h-[82%] rounded-full border border-[#894EFF]/18" />
            <div className="absolute w-[64%] h-[64%] rounded-full border border-[#894EFF]/22" />
            <div className="absolute w-[46%] h-[46%] rounded-full border border-[#894EFF]/28" />
            <div className="absolute w-[28%] h-[28%] rounded-full border border-[#894EFF]/35" />

            {/* Subtle Radial Axis Grid Lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-full h-[1px] border-b border-dashed border-white" />
              <div className="h-full w-[1px] border-r border-dashed border-white absolute" />
              <div className="w-full h-[1px] border-b border-dashed border-white/60 rotate-45 absolute" />
              <div className="w-full h-[1px] border-b border-dashed border-white/60 -rotate-45 absolute" />
            </div>

            {/* Continuous Rotating Radar Sweep Beam with Glowing Leading Edge */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3.0, ease: "linear" }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  'conic-gradient(from 0deg, rgba(240, 42, 138, 0.36) 0deg, rgba(137, 78, 255, 0.16) 55deg, transparent 115deg, transparent 360deg)'
              }}
            >
              {/* Glowing Leading Sweep Line */}
              <div className="w-1/2 h-[1.5px] bg-gradient-to-r from-transparent via-[#FFC928]/85 to-[#FFC928] absolute top-1/2 right-1/2 origin-right shadow-[0_0_8px_#FFC928]" />
            </motion.div>

            {/* 6. Candidate Signals (1 to 5 dots only, newly randomized every complete sweep) */}
            <AnimatePresence>
              {signals.map((sig, idx) => {
                const isTargetMatch = isMatchFound && idx === 0;

                return (
                  <motion.div
                    key={sig.id}
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{
                      opacity: isTargetMatch ? 1 : [0.4, sig.opacity, 0.4],
                      scale: isTargetMatch ? 1.6 : [0.85, 1.25, 0.85],
                    }}
                    exit={{ opacity: 0, scale: 0.2 }}
                    transition={{
                      repeat: isTargetMatch ? 0 : Infinity,
                      duration: sig.pulseDuration,
                      delay: sig.pulseDelay,
                      ease: "easeInOut",
                    }}
                    style={{
                      left: `${sig.x}%`,
                      top: `${sig.y}%`,
                      width: `${sig.size}px`,
                      height: `${sig.size}px`,
                      backgroundColor: isTargetMatch ? '#FFC928' : sig.color,
                      boxShadow: isTargetMatch ? '0 0 16px #FFC928' : `0 0 8px ${sig.glow}`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-10"
                  >
                    {/* Subtle Expanding Signal Pulse Ring */}
                    <span
                      style={{ borderColor: isTargetMatch ? '#FFC928' : sig.color }}
                      className={`absolute -inset-1 rounded-full border opacity-50 ${
                        isTargetMatch ? 'animate-ping duration-700' : 'animate-ping'
                      }`}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* 7. RADAR CENTER ("YOU" Origin Matchmaking Node) */}
            <div className="relative z-20 flex flex-col items-center">
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#251436] border-2 border-[#FFC928] shadow-[0_0_16px_rgba(255,201,40,0.7)] flex items-center justify-center overflow-hidden">
                {profile?.photoUrl ? (
                  <img src={profile.photoUrl} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">🪩</span>
                )}
              </div>
              <motion.div
                animate={{ scale: [1, 2.3], opacity: [0.55, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border-2 border-[#FFC928]/60 pointer-events-none"
              />
            </div>
          </div>

          {/* 9. REDESIGNED MATCHMAKING PROGRESS (VISUALLY INTEGRATED) */}
          <div className="w-full max-w-[260px] mt-3">
            <div className="flex items-center justify-between text-[9.5px] font-mono font-bold text-[#E3E0F5]/60 uppercase tracking-widest mb-1 px-0.5">
              <span>MATCHMAKING</span>
              <span className="text-[#FFC928] font-bold">{progress}%</span>
            </div>
            <div className="w-full h-[5px] bg-[#1B0B2A] rounded-full overflow-hidden border border-[#894EFF]/30">
              <motion.div
                className="h-full bg-gradient-to-r from-[#894EFF] via-[#F02A8A] to-[#FFC928] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              />
            </div>
            <p className="text-[11px] font-bold text-[#FFC928] mt-1 text-center h-4">
              {isMatchFound
                ? '✨ Match locked! Connecting string…'
                : 'Evaluating candidate compatibility…'}
            </p>
          </div>
        </div>
      </div>

      {/* 10. REFINED BOTTOM LIVE ACTIVITY STATUS (Human, Poetic & Seamless) */}
      <div className="shrink-0 pb-1 flex flex-col items-center justify-center relative z-10">
        {isMatchFound ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFC928]/20 border border-[#FFC928]/60 text-xs font-black text-[#FFC928]"
          >
            <Sparkles size={14} className="text-[#FFC928] animate-spin" />
            <span>Connecting to reveal countdown…</span>
          </motion.div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-[#E3E0F5]/70 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#08A98D] animate-ping" />
            <AnimatePresence mode="wait">
              <motion.span
                key={bottomStatusIndex}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                {BOTTOM_ACTIVITY_MESSAGES[bottomStatusIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
