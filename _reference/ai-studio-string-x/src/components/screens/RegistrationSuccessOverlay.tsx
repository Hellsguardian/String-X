import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { StringXLogo } from '../illustrations/GarbaIllustrations';

interface RegistrationSuccessOverlayProps {
  onBack?: () => void;
  onComplete: () => void;
}

// String X Brand Color Palette for Confetti
const CONFETTI_COLORS = ['#894EFF', '#F02A8A', '#FFC928', '#FFFFFF', '#08A98D', '#D4CEEB'];

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. PARTY-POPPER / CONFETTI CANNON CELEBRATION (Independent)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Realistic physics simulation:
 * - High initial impulse velocity
 * - Conical spread expansion
 * - Aerodynamic deceleration / drag
 * - Natural gravitational drop
 * - Multiple asymmetrical cannon blasts from bottom-left and bottom-right
 * - Autonomous 2–4s lifecycle that cleanly terminates independently
 */
const PartyPopperCelebration: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Explicitly set initial canvas dimensions before firing
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
    }

    // Create scoped confetti instance attached strictly to this container canvas
    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: false, // Ensures maximum reliability across mobile webviews & iframes
    });

    // Custom 4-point sparkle star shape matching String X festive identity
    let starShape: confetti.Shape;
    try {
      starShape = confetti.shapeFromPath({
        path: 'M 8 0 L 10 5.2 L 16 8 L 10 10.8 L 8 16 L 6 10.8 L 0 8 L 6 5.2 Z',
      });
    } catch {
      starShape = 'circle';
    }

    const shapes: confetti.Shape[] = ['circle', 'square', starShape];

    // Asymmetrical cannon bursts sequence (0ms to 920ms launch phase, 2.5–3.5s total flight time)
    const bursts = [
      // Burst 1 (0ms): Left explosive cannon blast
      {
        delay: 0,
        fire: () => {
          myConfetti({
            particleCount: 48,
            angle: 62,
            spread: 58,
            origin: { x: 0.08, y: 0.86 },
            startVelocity: 50,
            gravity: 1.18,
            decay: 0.92,
            drift: 0.15,
            ticks: 240,
            scalar: 0.95,
            colors: CONFETTI_COLORS,
            shapes,
            disableForReducedMotion: true,
          });
        },
      },
      // Burst 2 (110ms): Right explosive cannon blast (asymmetric timing, velocity, angle)
      {
        delay: 110,
        fire: () => {
          myConfetti({
            particleCount: 54,
            angle: 118,
            spread: 62,
            origin: { x: 0.92, y: 0.86 },
            startVelocity: 54,
            gravity: 1.22,
            decay: 0.91,
            drift: -0.15,
            ticks: 250,
            scalar: 1.0,
            colors: CONFETTI_COLORS,
            shapes,
            disableForReducedMotion: true,
          });
        },
      },
      // Burst 3 (280ms): Left follow-up impulse
      {
        delay: 280,
        fire: () => {
          myConfetti({
            particleCount: 36,
            angle: 56,
            spread: 48,
            origin: { x: 0.1, y: 0.84 },
            startVelocity: 44,
            gravity: 1.2,
            decay: 0.92,
            drift: 0.1,
            ticks: 220,
            scalar: 0.85,
            colors: ['#894EFF', '#FFC928', '#FFFFFF', '#F02A8A'],
            shapes,
            disableForReducedMotion: true,
          });
        },
      },
      // Burst 4 (440ms): Right follow-up impulse
      {
        delay: 440,
        fire: () => {
          myConfetti({
            particleCount: 40,
            angle: 125,
            spread: 52,
            origin: { x: 0.9, y: 0.84 },
            startVelocity: 47,
            gravity: 1.24,
            decay: 0.91,
            drift: -0.1,
            ticks: 230,
            scalar: 0.9,
            colors: ['#F02A8A', '#FFC928', '#894EFF', '#D4CEEB'],
            shapes,
            disableForReducedMotion: true,
          });
        },
      },
      // Burst 5 (680ms): Left glittering sparkle burst
      {
        delay: 680,
        fire: () => {
          myConfetti({
            particleCount: 26,
            angle: 66,
            spread: 42,
            origin: { x: 0.08, y: 0.86 },
            startVelocity: 38,
            gravity: 1.12,
            decay: 0.93,
            drift: 0.08,
            ticks: 200,
            scalar: 0.8,
            colors: ['#FFC928', '#FFFFFF', '#894EFF'],
            shapes: ['circle', starShape],
            disableForReducedMotion: true,
          });
        },
      },
      // Burst 6 (860ms): Right glittering sparkle burst
      {
        delay: 860,
        fire: () => {
          myConfetti({
            particleCount: 28,
            angle: 114,
            spread: 44,
            origin: { x: 0.92, y: 0.86 },
            startVelocity: 40,
            gravity: 1.15,
            decay: 0.93,
            drift: -0.08,
            ticks: 210,
            scalar: 0.85,
            colors: ['#FFC928', '#F02A8A', '#FFFFFF'],
            shapes: ['circle', starShape],
            disableForReducedMotion: true,
          });
        },
      },
    ];

    const timeoutIds = bursts.map((b) => setTimeout(b.fire, b.delay));

    // Cleanup when popper completes its 2–4s lifecycle
    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
      try {
        myConfetti.reset();
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
    />
  );
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 2. REGISTRATION SUCCESS TEXT (Independent, 10 Seconds)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * - Calm, centered message directly on canvas
 * - Smooth fade-in + slight upward rise at entrance
 * - Fully independent 10-second display duration
 * - Smooth fade-out before transitioning to radar
 */
const SuccessText: React.FC<{ isFadingOut: boolean }> = ({ isFadingOut }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={
        isFadingOut
          ? { opacity: 0, y: -10, transition: { duration: 0.6, ease: 'easeInOut' } }
          : { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
      }
      className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-[320px] mx-auto select-none relative z-20 py-4"
    >
      {/* Line 1: Headline */}
      <h2 className="text-[25px] sm:text-[27px] font-black tracking-tight text-white leading-[1.2] text-center">
        Your string has been registered. 💜
      </h2>

      {/* Line 2: Purpose */}
      <p className="text-[14px] sm:text-[15px] font-semibold text-[#E3E0F5]/95 mt-3.5 leading-[1.4] text-center">
        Now it's time to find who it's connected to.
      </p>

      {/* Line 3: Timeline & campus context */}
      <p className="text-[12px] sm:text-[13px] font-medium text-[#E3E0F5]/75 mt-2.5 leading-[1.45] text-center max-w-[285px]">
        We'll search campus and try to connect you before Navratri begins.
      </p>
    </motion.div>
  );
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * REGISTRATION SUCCESS OVERLAY (Entrance Celebration)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Houses two completely decoupled components:
 * - PartyPopperCelebration (2–4s physical cannon simulation)
 * - SuccessText (10s calm informational message)
 *
 * Exits smoothly after 10s to reveal the Page 22 radar screen underneath.
 */
export const RegistrationSuccessOverlay: React.FC<RegistrationSuccessOverlayProps> = ({
  onBack,
  onComplete,
}) => {
  const [isTextFadingOut, setIsTextFadingOut] = useState(false);
  const [isPopperVisible, setIsPopperVisible] = useState(true);

  // 1. Independent Party-Popper Lifecycle: 2–4 seconds (~3.4s)
  useEffect(() => {
    const popperTimer = setTimeout(() => {
      // Party poppers finish and disappear naturally
      setIsPopperVisible(false);
    }, 3400);

    return () => clearTimeout(popperTimer);
  }, []);

  // 2. Independent Success Text Lifecycle: Exactly 10 seconds total
  useEffect(() => {
    // At 9.4s, begin smooth fade-out
    const fadeTimer = setTimeout(() => {
      setIsTextFadingOut(true);
    }, 9400);

    // At 10.0s, overlay finishes and reveals radar underneath
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 10000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Graceful skip/advance if user taps anywhere to proceed
  const handleSkipOrProceed = () => {
    if (isTextFadingOut) return;
    setIsTextFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  return (
    <motion.div
      key="registration-success-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      onClick={handleSkipOrProceed}
      className="absolute inset-0 z-40 w-full h-full flex flex-col justify-between p-4 sm:p-5 bg-[#251436] text-white select-none overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] cursor-pointer"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
      }}
    >
      {/* Background depth & grid dots (identical to Page 22) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(66, 39, 156, 0.26) 0%, rgba(37, 20, 54, 0.52) 60%, transparent 85%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #E3E0F5 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Top Header: Back Button + Centered STRING X branding */}
      <header className="relative flex items-center justify-between shrink-0 z-20 w-full h-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBack?.();
          }}
          className="w-9 h-9 rounded-xl bg-[#1B0B2A] hover:bg-[#230D35] active:scale-95 border border-[#894EFF]/30 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs z-30"
          aria-label="Go back"
        >
          <ArrowLeft size={16} strokeWidth={2.4} />
        </button>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
          <StringXLogo size="sm" light={true} />
        </div>

        <div className="w-9 h-9 opacity-0 pointer-events-none" />
      </header>

      {/* Completely decoupled component 1: Party-Popper (2–4s) */}
      {isPopperVisible && <PartyPopperCelebration />}

      {/* Completely decoupled component 2: Success Text (10s) */}
      <SuccessText isFadingOut={isTextFadingOut} />

      {/* Symmetrical bottom spacer */}
      <div className="w-full h-5 shrink-0" />
    </motion.div>
  );
};
