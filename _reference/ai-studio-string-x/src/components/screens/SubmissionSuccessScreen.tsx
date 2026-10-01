import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { StringXLogo } from '../illustrations/GarbaIllustrations';
import { UserProfile } from '../../types';
import {
  AssignedMatch,
  getAssignedMatch,
  subscribeToMatch,
  pollForMatch,
} from '../../services/matchmakingService';

interface SubmissionSuccessScreenProps {
  profile?: UserProfile;
  collegeName?: string;
  onBack?: () => void;
  onContinueToCountdown: (match?: AssignedMatch) => void;
  onEnterMainApp?: () => void;
}

interface CandidatePoint {
  id: string;
  x: number;
  y: number;
  color: string;
  delay: number;
}

const CANDIDATE_POINTS: CandidatePoint[] = [
  { id: 'c1', x: 57, y: 22, color: '#08A98D', delay: 0.2 },
  { id: 'c2', x: 62, y: 55, color: '#08A98D', delay: 0.5 },
  { id: 'c3', x: 63, y: 76, color: '#08A98D', delay: 0.8 },
  { id: 'c4', x: 28, y: 64, color: '#08A98D', delay: 1.1 },
  { id: 'c5', x: 38, y: 62, color: '#894EFF', delay: 1.4 },
  { id: 'c6', x: 34, y: 62, color: '#F02A8A', delay: 1.7 },
  { id: 'c7', x: 44, y: 68, color: '#08A98D', delay: 2.0 },
];

const WAITING_STATUS_MESSAGES = [
  'Evaluating candidate compatibility...',
  'Scanning campus for compatible energy...',
  'Checking shared interests...',
  'Finding your Garba vibe...',
  'Looking for your string...',
  'Still searching...',
];

export const SubmissionSuccessScreen: React.FC<SubmissionSuccessScreenProps> = ({
  onBack,
  onContinueToCountdown,
}) => {
  // Visual progress bar (starts at 0, ramps up to 84% while waiting, hits 100% ONLY on match)
  const [progress, setProgress] = useState(0);

  // Match state
  const [assignedMatch, setAssignedMatch] = useState<AssignedMatch | null>(null);
  const [isMatchFound, setIsMatchFound] = useState(false);

  // Status message index cycling while waiting
  const [statusIndex, setStatusIndex] = useState(0);

  // Navigation guard to prevent duplicate calls
  const hasNavigatedRef = useRef(false);

  // 1. Initial Ramp-Up Progress to 84% (represents ongoing search, NOT a completed match)
  useEffect(() => {
    const rampSteps = [0, 14, 27, 41, 58, 71, 84];
    let step = 0;

    const timer = setInterval(() => {
      if (step < rampSteps.length) {
        setProgress(rampSteps[step]);
        step++;
      } else {
        clearInterval(timer);
      }
    }, 450);

    return () => clearInterval(timer);
  }, []);

  // 2. Continuous Status Cycling while waiting (purely visual, does NOT trigger navigation)
  useEffect(() => {
    if (isMatchFound) return;

    const cycleTimer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % WAITING_STATUS_MESSAGES.length);
    }, 3200);

    return () => clearInterval(cycleTimer);
  }, [isMatchFound]);

  // 3. Match Detection Handler (Realtime or Poll)
  const handleMatchConfirmed = (match: AssignedMatch, isImmediate = false) => {
    if (hasNavigatedRef.current) return;

    setAssignedMatch(match);
    setIsMatchFound(true);
    setProgress(100);

    // If match already existed on load, transition quickly
    const delay = isImmediate ? 450 : 750;

    setTimeout(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        onContinueToCountdown(match);
      }
    }, delay);
  };

  // 4. Check for Existing Match & Setup Realtime / Polling Listeners
  useEffect(() => {
    // Check if match already exists in backend/storage
    const existing = getAssignedMatch();
    if (existing) {
      handleMatchConfirmed(existing, true);
      return;
    }

    // Subscribe to Realtime events (storage, CustomEvents, BroadcastChannel)
    const unsubscribeRealtime = subscribeToMatch((match) => {
      if (match) {
        handleMatchConfirmed(match, false);
      }
    });

    // Fallback polling every 2.5s in case realtime isn't caught
    const stopPolling = pollForMatch((match) => {
      if (match) {
        handleMatchConfirmed(match, false);
      }
    }, 2500);

    return () => {
      unsubscribeRealtime();
      stopPolling();
    };
  }, []);

  // Dynamic status text for the compatibility pill
  const getPillText = () => {
    if (isMatchFound) {
      return 'String found ✨';
    }
    return WAITING_STATUS_MESSAGES[statusIndex];
  };

  // Dynamic progress subtext below the progress bar
  const getSubtext = () => {
    if (isMatchFound) {
      return 'Your string has been found ✨';
    }
    return WAITING_STATUS_MESSAGES[statusIndex];
  };

  return (
    <div className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between p-4 sm:p-5 pt-[max(14px,env(safe-area-inset-top,0px))] pb-[max(16px,env(safe-area-inset-bottom,0px))] bg-[#251436] text-white select-none relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. BACKGROUND: Deep Plum #251436 + Precise Accent Dots (Image 2)
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

        {/* Tiny magenta/pink accent dot (Upper Right - Image 2) */}
        <div className="absolute top-[14%] right-[11%] w-1.5 h-1.5 rounded-full bg-[#F02A8A] opacity-70 pointer-events-none" />

        {/* Tiny teal accent dot (Lower Left - Image 2) */}
        <div className="absolute bottom-[20%] left-[10%] w-1.5 h-1.5 rounded-full bg-[#08A98D] opacity-65 pointer-events-none" />
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

        {/* Right spacer for balance */}
        <div className="w-9 h-9 opacity-0 pointer-events-none" />
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. MAIN CONTENT: Heading + Pill + Radar + Progress Section
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-20 w-full max-w-[330px] mx-auto py-1">
        {/* MAIN HEADING (Display typography matching Image 2) */}
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

          {/* SUPPORTING TEXT (Image 2) */}
          <p className="text-[11px] font-medium text-[#E3E0F5]/85 mt-2 max-w-[290px] mx-auto text-center leading-[1.35]">
            We’re searching campus for someone who matches
            <br />
            your energy, interests and Garba vibe.
          </p>

          {/* COMPATIBILITY STATUS PILL (Yellow text & dot) */}
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#180A26]/90 border border-[#894EFF]/40 shadow-[0_2px_12px_rgba(0,0,0,0.4)] select-none">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_6px_#FFC928] ${
                isMatchFound ? 'bg-[#08A98D]' : 'bg-[#FFC928] animate-pulse'
              }`}
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={getPillText()}
                initial={{ opacity: 0, y: 1.5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -1.5 }}
                transition={{ duration: 0.18 }}
                className="text-[11.5px] font-bold text-[#FFC928] tracking-normal"
              >
                {getPillText()}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* LARGE RADAR (Central Visual Element) */}
        <div className="my-3.5 sm:my-4 shrink-0 flex items-center justify-center">
          <div className="relative w-[218px] h-[218px] sm:w-[228px] sm:h-[228px] rounded-full bg-[#180826] border border-[#894EFF]/25 shadow-[0_0_32px_rgba(137,78,255,0.18)] flex items-center justify-center overflow-hidden">
            {/* Concentric rings & dashed radial division lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 228 228">
              {/* Outer circle */}
              <circle cx="114" cy="114" r="106" fill="none" stroke="#894EFF" strokeWidth="0.8" strokeOpacity="0.25" />
              {/* Circle 3 (dashed) */}
              <circle cx="114" cy="114" r="78" fill="none" stroke="#894EFF" strokeWidth="0.8" strokeOpacity="0.22" strokeDasharray="3 3" />
              {/* Circle 2 (dashed) */}
              <circle cx="114" cy="114" r="52" fill="none" stroke="#894EFF" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="3 3" />
              {/* Circle 1 (inner ring) */}
              <circle cx="114" cy="114" r="28" fill="none" stroke="#894EFF" strokeWidth="0.8" strokeOpacity="0.25" />

              {/* Dashed radial division lines (crosshairs) */}
              <line x1="0" y1="114" x2="228" y2="114" stroke="#894EFF" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="3 3" />
              <line x1="114" y1="0" x2="114" y2="228" stroke="#894EFF" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="3 3" />
              {/* Dashed diagonals */}
              <line x1="34" y1="34" x2="194" y2="194" stroke="#894EFF" strokeWidth="0.6" strokeOpacity="0.12" strokeDasharray="3 3" />
              <line x1="194" y1="34" x2="34" y2="194" stroke="#894EFF" strokeWidth="0.6" strokeOpacity="0.12" strokeDasharray="3 3" />
            </svg>

            {/* ROTATING RADAR SWEEP LINE with magenta/purple trail (Pauses when match found) */}
            <div
              className={`absolute inset-0 rounded-full pointer-events-none ${
                isMatchFound ? 'opacity-40 transition-opacity duration-500' : 'animate-spin'
              }`}
              style={{ animationDuration: '3.6s', animationTimingFunction: 'linear' }}
            >
              {/* Conical magenta/purple sweep trail */}
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg at 50% 50%, rgba(255, 201, 40, 0.42) 0deg, rgba(240, 42, 138, 0.24) 22deg, rgba(137, 78, 255, 0.12) 58deg, transparent 78deg, transparent 360deg)',
                }}
              />
              {/* Leading golden sweep line */}
              <div className="absolute top-0 left-1/2 w-[1.5px] h-1/2 bg-[#FFC928] origin-bottom shadow-[0_0_8px_#FFC928]" />
            </div>

            {/* CANDIDATE POINTS with soft glowing halos */}
            {CANDIDATE_POINTS.map((pt) => (
              <motion.div
                key={pt.id}
                className="absolute pointer-events-none flex items-center justify-center"
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                animate={{
                  opacity: isMatchFound ? 0.9 : [0.45, 1, 0.45],
                  scale: isMatchFound ? 1.15 : [0.9, 1.2, 0.9],
                }}
                transition={{
                  repeat: isMatchFound ? 0 : Infinity,
                  duration: 2.4,
                  delay: pt.delay,
                  ease: 'easeInOut',
                }}
              >
                {/* Soft diffused aura */}
                <div
                  className="w-4 h-4 rounded-full absolute opacity-35 blur-[1px]"
                  style={{ backgroundColor: pt.color }}
                />
                {/* Crisp core dot */}
                <div
                  className="w-2 h-2 rounded-full z-10 shadow-xs"
                  style={{ backgroundColor: pt.color }}
                />
              </motion.div>
            ))}

            {/* RADAR CENTER TARGET: Golden Outer Ring + Miniature Disco Ball */}
            {/* Scanning ripple expanding from the center */}
            <motion.div
              className="absolute w-8 h-8 rounded-full border border-[#FFC928]/40 pointer-events-none"
              animate={{
                scale: [1, 2.4],
                opacity: [0.7, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: 'easeOut',
              }}
            />

            {/* Central golden circular target ring */}
            <div className="relative z-20 w-8 h-8 rounded-full bg-[#180826] border-2 border-[#FFC928] flex items-center justify-center shadow-[0_0_14px_rgba(255,201,40,0.65)]">
              {/* Miniature faceted silver disco ball sphere */}
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <circle cx="8" cy="8" r="6.5" fill="#D4CEEB" />
                <line x1="2" y1="5.5" x2="14" y2="5.5" stroke="#7E77A4" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
                <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="#7E77A4" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
                <line x1="2" y1="10.5" x2="14" y2="10.5" stroke="#7E77A4" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
                <line x1="5.5" y1="2" x2="5.5" y2="14" stroke="#7E77A4" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
                <line x1="8" y1="1.5" x2="8" y2="14.5" stroke="#7E77A4" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
                <line x1="10.5" y1="2" x2="10.5" y2="14" stroke="#7E77A4" strokeWidth="0.6" strokeDasharray="1.2 1.2" />
                <circle cx="6" cy="6" r="1.5" fill="#FFFFFF" opacity="0.9" />
              </svg>
            </div>
          </div>
        </div>

        {/* BELOW THE RADAR (Grouped together with Warm Yellow accents) */}
        <div className="shrink-0 w-full max-w-[270px] mx-auto">
          {/* Top row: MATCHMAKING in lavender, percentage in Warm Yellow */}
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] font-black uppercase text-[#E3E0F5]/50 tracking-widest">
              MATCHMAKING
            </span>
            <span className="text-[13px] font-black text-[#FFC928] tracking-tight">
              {progress}%
            </span>
          </div>

          {/* Thin progress bar with purple-to-yellow gradient */}
          <div className="w-full h-1.5 bg-[#180A26] rounded-full overflow-hidden border border-[#894EFF]/20 p-[0.5px]">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #894EFF 0%, #F02A8A 50%, #FFC928 100%)',
              }}
            />
          </div>

          {/* Dynamic subtext: Bright Warm Yellow as in Image 2 */}
          <AnimatePresence mode="wait">
            <motion.p
              key={getSubtext()}
              initial={{ opacity: 0, y: 1.5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -1.5 }}
              transition={{ duration: 0.18 }}
              className="text-[12px] font-bold text-[#FFC928] text-center mt-1.5 tracking-normal"
            >
              {getSubtext()}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. BOTTOM STATUS: ● Finding your kind of people... (Image 2)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="shrink-0 flex justify-center z-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#180A26]/80 border border-[#E3E0F5]/15 shadow-xs select-none">
          <span className="w-2 h-2 rounded-full bg-[#08A98D]/70 shrink-0" />
          <span className="text-[11px] font-medium text-[#E3E0F5]/55 tracking-normal">
            Finding your kind of people...
          </span>
        </div>
      </div>
    </div>
  );
};
