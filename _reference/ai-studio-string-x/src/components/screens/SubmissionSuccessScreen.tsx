import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { StringXLogo } from '../illustrations/GarbaIllustrations';
import { UserProfile } from '../../types';
import {
  AssignedMatch,
  getAssignedMatch,
  subscribeToMatch,
  pollForMatch,
  assignMatch,
} from '../../services/matchmakingService';
import { RegistrationSuccessOverlay } from './RegistrationSuccessOverlay';

interface SubmissionSuccessScreenProps {
  profile?: UserProfile;
  collegeName?: string;
  onBack?: () => void;
  onContinueToCountdown: (match?: AssignedMatch) => void;
  onEnterMainApp?: () => void;
  showRegistrationCelebration?: boolean;
  onCelebrationComplete?: () => void;
}

interface DynamicCandidate {
  id: string;
  x: number; // percentage (relative to radar container: 50 + cos * radius)
  y: number; // percentage (relative to radar container: 50 + sin * radius)
  color: string;
  size: 'sm' | 'md' | 'lg';
  haloOpacity: number;
  glowBlur: number;
  waveDuration: string;
  waveDelay: string;
  waveDelay2: string;
  fadeDuration: number;
}

const CANDIDATE_COLORS = [
  '#08A98D', // Emerald / teal
  '#894EFF', // Purple
  '#F02A8A', // Pink
  '#FFC928', // Warm yellow
];

const CANDIDATE_SIZES: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

// Dot sizes increased by 10–15% (5.75px, 7.5px, 9.2px)
const SIZES_MAP = {
  sm: { dot: 'w-[5.75px] h-[5.75px]' },
  md: { dot: 'w-[7.5px] h-[7.5px]' },
  lg: { dot: 'w-[9.2px] h-[9.2px]' },
};

const DYNAMIC_STATUS_MESSAGES = [
  'Finding your Garba vibe…',
  'Scanning campus energy…',
  'Checking shared interests…',
  'Finding your rhythm…',
  'Looking for your string…',
  'Almost there…',
];

/**
 * Generate a randomized candidate set for a radar scanning cycle.
 * - Random number of dots: 3 to 7 dots.
 * - Position strictly within radar coordinate system: 18% to 37% distance from center (50%, 50%),
 *   avoiding the central target node (radius ~12%) and outer boundary (radius 50%).
 * - Random color from existing palette.
 * - Random size within existing size range (sm, md, lg).
 * - Random glow intensity and halo opacity.
 * - Anti-clustering so dots don't overlap awkwardly.
 */
function generateCycleCandidates(
  cycleId: number,
  count: number,
  cycleDuration: number
): DynamicCandidate[] {
  const dots: DynamicCandidate[] = [];
  const fadeDuration = Math.min(0.55, Math.max(0.35, Number((cycleDuration * 0.22).toFixed(2))));

  for (let i = 0; i < count; i++) {
    let x = 50;
    let y = 50;
    let attempts = 0;

    while (attempts < 30) {
      const angle = Math.random() * 2 * Math.PI;
      // Distance from center: safe zone between 18% and 37% aligned with radar rings
      const distancePercent = 18 + Math.random() * 19;

      const testX = Math.round((50 + Math.cos(angle) * distancePercent) * 10) / 10;
      const testY = Math.round((50 + Math.sin(angle) * distancePercent) * 10) / 10;

      // Minimum distance between dots (at least 10–13% separation)
      const minDistance = count >= 6 ? 10 : 13;
      const isTooClose = dots.some((other) => {
        return Math.hypot(testX - other.x, testY - other.y) < minDistance;
      });

      if (!isTooClose || attempts === 29) {
        x = testX;
        y = testY;
        break;
      }
      attempts++;
    }

    const color = CANDIDATE_COLORS[Math.floor(Math.random() * CANDIDATE_COLORS.length)];
    const size = CANDIDATE_SIZES[Math.floor(Math.random() * CANDIDATE_SIZES.length)];

    // Slightly different glow intensity and halo opacity per dot
    const haloOpacity = Number((0.32 + Math.random() * 0.22).toFixed(2)); // 0.32 to 0.54
    const glowBlur = Math.round(5 + Math.random() * 4); // 5px to 9px

    // Radiating sonar wave parameters
    const baseDelayNum = Number((i * 0.18 + Math.random() * 0.12).toFixed(2));
    const waveDelay = `${baseDelayNum}s`;
    const waveDelay2 = `${(baseDelayNum + 0.55).toFixed(2)}s`;
    const waveDuration = `${(1.1 + Math.random() * 0.3).toFixed(1)}s`;

    dots.push({
      id: `c${cycleId}-d${i}-${Math.random().toString(36).substring(2, 7)}`,
      x,
      y,
      color,
      size,
      haloOpacity,
      glowBlur,
      waveDuration,
      waveDelay,
      waveDelay2,
      fadeDuration,
    });
  }

  return dots;
}

/**
 * Organic progress calculation: calculates next confidence target between 15% and 90%
 */
function getNextTarget(current: number): number {
  const roll = Math.random();
  let delta: number;

  if (current < 35) {
    delta = Math.floor(Math.random() * 12) + 8;
  } else if (current > 80) {
    if (roll < 0.65) {
      delta = -(Math.floor(Math.random() * 12) + 6);
    } else {
      delta = Math.floor(Math.random() * 5) + 1;
    }
  } else {
    if (roll < 0.58) {
      delta = Math.floor(Math.random() * 13) + 5;
    } else if (roll < 0.88) {
      delta = -(Math.floor(Math.random() * 10) + 4);
    } else {
      delta = (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
    }
  }

  let next = current + delta;
  if (next < 15) next = 15 + Math.floor(Math.random() * 5);
  if (next > 90) next = 84 + Math.floor(Math.random() * 6);
  return next;
}

export const SubmissionSuccessScreen: React.FC<SubmissionSuccessScreenProps> = ({
  onBack,
  onContinueToCountdown,
  showRegistrationCelebration = false,
  onCelebrationComplete,
}) => {
  // One-time registration celebration guard (triggered ONLY on transition from Page 21 -> Page 22)
  const shouldCelebrateOnMount = useRef<boolean>(
    Boolean(
      showRegistrationCelebration ||
      (typeof window !== 'undefined' && sessionStorage.getItem('stringx_show_registration_celebration') === 'true')
    )
  );

  // Immediately clear the session flag so refresh/revisit will never replay
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('stringx_show_registration_celebration');
      } catch {
        // ignore
      }
    }
  }, []);

  const [isCelebrating, setIsCelebrating] = useState<boolean>(shouldCelebrateOnMount.current);

  const handleCelebrationComplete = useCallback(() => {
    setIsCelebrating(false);
    onCelebrationComplete?.();
  }, [onCelebrationComplete]);

  // Algorithmic Target Progress (strictly 15–90% while searching, 100% on match)
  const [targetProgress, setTargetProgress] = useState(38);

  // Smoothly displayed counter and progress bar width
  const [displayedProgress, setDisplayedProgress] = useState(38);

  // Match state
  const [_assignedMatch, setAssignedMatch] = useState<AssignedMatch | null>(null);
  const [isMatchFound, setIsMatchFound] = useState(false);

  // Smooth persistent candidate signals with randomized 3–7 dots and 1–4s lifecycle
  const [candidates, setCandidates] = useState<DynamicCandidate[]>(() => {
    const initialDuration = Number((1.5 + Math.random() * 2.0).toFixed(2));
    const initialCount = Math.floor(Math.random() * 5) + 3; // 3 to 7 dots
    return generateCycleCandidates(1, initialCount, initialDuration);
  });
  const dotSeqRef = useRef(10);

  // Status message index cycling
  const [statusIndex, setStatusIndex] = useState(0);

  // Navigation guard
  const hasNavigatedRef = useRef(false);

  // 1. Radar Dot Scanning Lifecycle:
  // Random duration (1.0s to 4.0s) and random dot count (3 to 7) per cycle
  // Beam rotation remains fixed and independent; only dot lifecycle uses 1–4s duration
  useEffect(() => {
    if (isMatchFound || isCelebrating) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleNextDotCycle = () => {
      // Continuous random duration between 1.0s and 4.0s (e.g. 1.74s, 3.42s)
      const nextDurationSec = Number((1.0 + Math.random() * 3.0).toFixed(2));
      const nextDurationMs = Math.round(nextDurationSec * 1000);

      timeoutId = setTimeout(() => {
        if (isMatchFound) return;

        dotSeqRef.current += 1;
        const cycleId = dotSeqRef.current;
        // Random dot count: 3, 4, 5, 6, or 7 dots
        const nextCount = Math.floor(Math.random() * 5) + 3;
        const nextDots = generateCycleCandidates(cycleId, nextCount, nextDurationSec);

        setCandidates(nextDots);
        scheduleNextDotCycle();
      }, nextDurationMs);
    };

    scheduleNextDotCycle();

    return () => clearTimeout(timeoutId);
  }, [isMatchFound, isCelebrating]);

  // 2. Organic Progress Updates at Irregular Intervals (1.4s to 2.8s)
  useEffect(() => {
    if (isMatchFound || isCelebrating) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleNext = () => {
      const delayMs = Math.floor(Math.random() * 1400) + 1400; // 1.4s to 2.8s
      timeoutId = setTimeout(() => {
        setTargetProgress((prev) => getNextTarget(prev));
        scheduleNext();
      }, delayMs);
    };

    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, [isMatchFound, isCelebrating]);

  // 3. Smooth Number & Progress Bar Interpolation (smooth tick, never abrupt jumps)
  useEffect(() => {
    if (displayedProgress === targetProgress) return;

    const diff = targetProgress - displayedProgress;
    const step = Math.sign(diff) * Math.max(1, Math.min(Math.abs(diff), Math.ceil(Math.abs(diff) / 8)));
    const tickMs = isMatchFound ? 22 : 45;

    const timer = setTimeout(() => {
      setDisplayedProgress((prev) => {
        if (Math.abs(targetProgress - prev) <= Math.abs(step)) {
          return targetProgress;
        }
        return prev + step;
      });
    }, tickMs);

    return () => clearTimeout(timer);
  }, [displayedProgress, targetProgress, isMatchFound]);

  // 4. Smooth Status Text Cycling every 3.8 seconds
  useEffect(() => {
    if (isMatchFound || isCelebrating) return;

    const cycleTimer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % DYNAMIC_STATUS_MESSAGES.length);
    }, 3800);

    return () => clearInterval(cycleTimer);
  }, [isMatchFound, isCelebrating]);

  // 5. Match Detection Handler
  const handleMatchConfirmed = (match: AssignedMatch, isImmediate = false) => {
    if (hasNavigatedRef.current) return;

    setAssignedMatch(match);
    setIsMatchFound(true);
    setTargetProgress(100);

    // Confirmation duration: allows scanner to decelerate, dots to converge toward center,
    // and status to show "String found ✨" before transitioning to Page 24.
    const delay = isImmediate ? 600 : 1450;

    setTimeout(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        onContinueToCountdown(match);
      }
    }, delay);
  };

  // 6. Check for Existing Match & Setup Realtime / Polling Listeners
  useEffect(() => {
    if (isCelebrating) return;

    const existing = getAssignedMatch();
    if (existing) {
      handleMatchConfirmed(existing, true);
      return;
    }

    const unsubscribeRealtime = subscribeToMatch((match) => {
      if (match) {
        handleMatchConfirmed(match, false);
      }
    });

    const stopPolling = pollForMatch((match) => {
      if (match) {
        handleMatchConfirmed(match, false);
      }
    }, 2500);

    return () => {
      unsubscribeRealtime();
      stopPolling();
    };
  }, [isCelebrating]);

  return (
    <div 
      className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between p-4 sm:p-5 bg-[#251436] text-white select-none relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
      }}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. BACKGROUND: Deep Plum #251436 + Precise Accent Dots
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Subtle radial depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(66, 39, 156, 0.26) 0%, rgba(37, 20, 54, 0.52) 60%, transparent 85%)',
          }}
        />

        {/* Subtle grid dots */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #E3E0F5 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. TOP NAVIGATION: Back Button + Centered STRING X
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="relative flex items-center justify-between shrink-0 z-20 w-full h-10">
        {/* Back button at upper-left */}
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-[#1B0B2A] hover:bg-[#230D35] active:scale-95 border border-[#894EFF]/30 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs z-30"
          aria-label="Go back"
        >
          <ArrowLeft size={16} strokeWidth={2.4} />
        </button>

        {/* STRING X logo centered horizontally */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
          <StringXLogo size="sm" light={true} />
        </div>

        {/* Symmetrical right spacer */}
        <div className="w-9 h-9 opacity-0 pointer-events-none" />
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          REGISTRATION COMPLETION CELEBRATION OVERLAY (Page 21 -> 22)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {isCelebrating && (
          <RegistrationSuccessOverlay
            onBack={onBack}
            onComplete={handleCelebrationComplete}
          />
        )}
      </AnimatePresence>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. MAIN CONTENT: Heading + DYNAMIC HERO RADAR + Status Section
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        key="main-radar-view"
        initial={shouldCelebrateOnMount.current ? { opacity: 0, scale: 0.98 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex flex-col items-center justify-center relative z-20 w-full max-w-[340px] mx-auto py-2"
      >
          {/* MAIN HEADING */}
          <div className="text-center shrink-0">
            <h1 className="text-[28px] sm:text-[30px] font-black tracking-tight leading-[1.12] text-white text-center">
              Your string is
              <br />
              getting{' '}
              <span
                className="bg-gradient-to-r from-[#FF9F28] via-[#F02A8A] to-[#894EFF] bg-clip-text text-transparent font-black"
                style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                connected.
              </span>
            </h1>

            {/* SUPPORTING TEXT (11px, subtle and clean) */}
            <p className="text-[11px] font-medium text-[#E3E0F5]/85 mt-2 max-w-[290px] mx-auto text-center leading-[1.35]">
              We’re searching campus for someone who matches
              <br />
              your energy, interests and Garba vibe.
            </p>
          </div>

          {/* DYNAMIC HERO RADAR */}
          <div className="my-5 sm:my-6 shrink-0 flex items-center justify-center">
            <div className="relative w-[232px] h-[232px] sm:w-[246px] sm:h-[246px] rounded-full bg-[#180826] border border-[#894EFF]/25 shadow-[0_0_36px_rgba(137,78,255,0.18)] flex items-center justify-center overflow-hidden">
              {/* Concentric rings & dashed radial division lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 246 246">
                {/* Outer circle */}
                <circle cx="123" cy="123" r="115" fill="none" stroke="#894EFF" strokeWidth="1" strokeOpacity="0.38" />
                {/* Circle 3 (dashed) */}
                <circle cx="123" cy="123" r="84" fill="none" stroke="#894EFF" strokeWidth="0.9" strokeOpacity="0.34" strokeDasharray="3 3" />
                {/* Circle 2 (dashed) */}
                <circle cx="123" cy="123" r="56" fill="none" stroke="#894EFF" strokeWidth="0.9" strokeOpacity="0.36" strokeDasharray="3 3" />
                {/* Circle 1 (inner ring) */}
                <circle cx="123" cy="123" r="30" fill="none" stroke="#894EFF" strokeWidth="1" strokeOpacity="0.38" />

                {/* Dashed radial division lines (crosshairs) */}
                <line x1="0" y1="123" x2="246" y2="123" stroke="#894EFF" strokeWidth="0.9" strokeOpacity="0.28" strokeDasharray="3 3" />
                <line x1="123" y1="0" x2="123" y2="246" stroke="#894EFF" strokeWidth="0.9" strokeOpacity="0.28" strokeDasharray="3 3" />
                {/* Dashed diagonals */}
                <line x1="36" y1="36" x2="210" y2="210" stroke="#894EFF" strokeWidth="0.7" strokeOpacity="0.18" strokeDasharray="3 3" />
                <line x1="210" y1="36" x2="36" y2="210" stroke="#894EFF" strokeWidth="0.7" strokeOpacity="0.18" strokeDasharray="3 3" />
              </svg>

              {/* CONTINUOUS ROTATING RADAR SWEEP LINE (Never stops rotating during search) */}
              <div
                className={`absolute inset-0 rounded-full pointer-events-none ${
                  isMatchFound ? 'animate-radar-sweep-settled opacity-40' : 'animate-radar-sweep opacity-100'
                }`}
              >
                {/* Conical luminous sweep trail */}
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg at 50% 50%, rgba(255, 216, 104, 0.60) 0deg, rgba(240, 42, 138, 0.38) 22deg, rgba(137, 78, 255, 0.22) 58deg, rgba(137, 78, 255, 0.08) 92deg, transparent 112deg, transparent 360deg)',
                  }}
                />
                {/* Leading golden sweep line with luminous beam glow */}
                <div
                  className="absolute top-0 left-1/2 w-[2px] h-1/2 -translate-x-1/2 origin-bottom pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, rgba(255, 201, 40, 0.35) 0%, #FFD868 55%, #FFFFFF 100%)',
                    boxShadow: '0 0 10px rgba(255, 201, 40, 0.85), 0 0 4px #FFFFFF',
                  }}
                />
              </div>

              {/* DYNAMIC CANDIDATE SIGNALS: Coherent radar coordinate system with smooth non-blinking transitions */}
              <AnimatePresence>
                {candidates.map((pt) => {
                  return (
                    <motion.div
                      key={pt.id}
                      className="absolute pointer-events-none flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${pt.x}%`,
                        top: `${pt.y}%`,
                      }}
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={
                        isMatchFound
                          ? {
                              left: '50%',
                              top: '50%',
                              opacity: [1, 0.7, 0],
                              scale: [1, 1.2, 0],
                            }
                          : { opacity: 1, scale: 1 }
                      }
                      exit={{ opacity: 0, scale: 0.3 }}
                      transition={
                        isMatchFound
                          ? { duration: 1.15, ease: [0.16, 1, 0.3, 1] }
                          : { duration: pt.fadeDuration || 0.45, ease: 'easeInOut' }
                      }
                    >
                      {/* Layer B — Sonar Signal Waves: Concentric expanding rings */}
                      {!isMatchFound && (
                        <>
                          {/* Wave Ring 1 */}
                          <div
                            className="animate-signal-wave"
                            style={{
                              borderColor: pt.color,
                              animationName: 'stringx-signal-wave',
                              animationDuration: pt.waveDuration,
                              animationTimingFunction: 'ease-out',
                              animationIterationCount: 'infinite',
                              animationDelay: pt.waveDelay,
                            }}
                          />
                          {/* Wave Ring 2: Staggered second expanding ring */}
                          <div
                            className="animate-signal-wave"
                            style={{
                              borderColor: pt.color,
                              animationName: 'stringx-signal-wave',
                              animationDuration: pt.waveDuration,
                              animationTimingFunction: 'ease-out',
                              animationIterationCount: 'infinite',
                              animationDelay: pt.waveDelay2,
                            }}
                          />
                        </>
                      )}

                      {/* Layer A — Core: Sharp, perfectly circular colored dot with proportional halo and specular glow */}
                      <div className="relative flex items-center justify-center pointer-events-none">
                        {/* Proportional soft micro-halo with randomized intensity */}
                        <div
                          className="w-3.5 h-3.5 rounded-full absolute blur-[1.4px] pointer-events-none"
                          style={{
                            backgroundColor: pt.color,
                            opacity: pt.haloOpacity,
                          }}
                        />
                        {/* Solid core signal point (5.75–9.2px: +10–15%) with bright specular center */}
                        <div
                          className={`${SIZES_MAP[pt.size].dot} rounded-full z-10 pointer-events-none relative`}
                          style={{
                            background: `radial-gradient(circle at 35% 35%, #FFFFFF 0%, ${pt.color} 70%)`,
                            boxShadow: `0 0 ${pt.glowBlur}px ${pt.color}99, 0 0 2px rgba(0,0,0,0.6)`,
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* RADAR CENTER TARGET: Golden Outer Ring + Miniature Disco Ball */}
              {/* Primary scanning ripple expanding from the center */}
              <motion.div
                className="absolute w-8 h-8 rounded-full border border-[#FFC928]/60 pointer-events-none"
                animate={{
                  scale: isMatchFound ? [1, 3.2] : [1, 2.6],
                  opacity: isMatchFound ? [0.95, 0] : [0.8, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: isMatchFound ? 1.4 : 2.2,
                  ease: 'easeOut',
                }}
              />
              {/* Secondary staggered scanning ripple for continuous radiating radar feel */}
              <motion.div
                className="absolute w-8 h-8 rounded-full border border-[#894EFF]/45 pointer-events-none"
                animate={{
                  scale: isMatchFound ? [1, 3.2] : [1, 2.6],
                  opacity: isMatchFound ? [0.8, 0] : [0.65, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: isMatchFound ? 1.4 : 2.2,
                  delay: 1.1,
                  ease: 'easeOut',
                }}
              />

              {/* Central golden circular target ring */}
              <motion.div
                animate={isMatchFound ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.2 }}
                onClick={() => {
                  // Developer test trigger: tapping the central disco ball assigns a match
                  if (!isMatchFound) {
                    assignMatch();
                  }
                }}
                title="Central radar focal point"
                className="relative z-20 w-8 h-8 rounded-full bg-[#180826] border-2 border-[#FFC928] flex items-center justify-center shadow-[0_0_16px_rgba(255,201,40,0.65)] cursor-pointer"
              >
                {/* Miniature faceted silver disco ball sphere */}
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0 pointer-events-none">
                  <circle cx="8" cy="8" r="6.5" fill="#D4CEEB" />
                  <line x1="2" y1="5.5" x2="14" y2="5.5" stroke="#7E77A4" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
                  <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="#7E77A4" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
                  <line x1="2" y1="10.5" x2="14" y2="10.5" stroke="#7E77A4" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
                  <line x1="5.5" y1="2" x2="5.5" y2="14" stroke="#7E77A4" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
                  <line x1="8" y1="1.5" x2="8" y2="14.5" stroke="#7E77A4" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
                  <line x1="10.5" y1="2" x2="10.5" y2="14" stroke="#7E77A4" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
                  <circle cx="6" cy="6" r="1.5" fill="#FFFFFF" opacity="0.9" />
                </svg>
              </motion.div>
            </div>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              RESTRUCTURED STATUS AREA: Algorithmic Fluctuating Confidence
              Structure:
              MATCHMAKING                         84%
              [ progress bar ]
              ● Finding your Garba vibe…
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="shrink-0 w-full max-w-[270px] mx-auto">
            {/* Top row: MATCHMAKING in lavender, smoothly updating percentage in Warm Yellow */}
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[10px] font-black uppercase text-[#E3E0F5]/50 tracking-widest">
                MATCHMAKING
              </span>
              <span className="text-[13px] font-black text-[#FFC928] tracking-tight tabular-nums">
                {displayedProgress}%
              </span>
            </div>

            {/* Thin progress bar with purple-to-yellow gradient */}
            <div className="w-full h-1.5 bg-[#180A26] rounded-full overflow-hidden border border-[#894EFF]/20 p-[0.5px]">
              <motion.div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${displayedProgress}%`,
                  background: 'linear-gradient(90deg, #894EFF 0%, #F02A8A 50%, #FFC928 100%)',
                }}
              />
            </div>

            {/* Dynamic status text: Simple text with tiny colored status dot (NOT in a pill) */}
            <div className="mt-2.5 flex items-center justify-center min-h-[22px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isMatchFound ? 'matched' : DYNAMIC_STATUS_MESSAGES[statusIndex]}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="flex items-center justify-center gap-2 select-none"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isMatchFound
                        ? 'bg-[#08A98D] shadow-[0_0_6px_#08A98D]'
                        : 'bg-[#FFC928] shadow-[0_0_6px_#FFC928] animate-pulse'
                    }`}
                  />
                  <span className="text-[12px] font-semibold text-[#E3E0F5]/90 tracking-normal">
                    {isMatchFound ? 'String found ✨' : DYNAMIC_STATUS_MESSAGES[statusIndex]}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Symmetrical bottom spacer */}
      <div className="w-full h-5 shrink-0" />
    </div>
  );
};
