import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Minus, Plus } from 'lucide-react';

interface WeightSelectorProps {
  value: number; // in kg
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export const WeightSelector: React.FC<WeightSelectorProps> = ({
  value,
  onChange,
  min = 38,
  max = 130
}) => {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore
      }
    }
  };

  const handleStep = (delta: number) => {
    triggerHaptic();
    setDirection(delta > 0 ? 'up' : 'down');
    onChange(Math.max(min, Math.min(max, value + delta)));
  };

  const startHold = (delta: number) => {
    handleStep(delta);
    let speed = 200;
    const repeat = () => {
      handleStep(delta);
      speed = Math.max(50, speed * 0.85); // accelerate smoothly
      timerRef.current = setTimeout(repeat, speed);
    };
    timerRef.current = setTimeout(repeat, speed);
  };

  const stopHold = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Convert kg to lbs for extra quick context
  const weightLbs = Math.round(value * 2.20462);

  return (
    <div className="w-full flex flex-col items-center justify-center py-4 select-none">
      {/* Visual Weight scale dial / badge */}
      <div className="relative mb-6">
        <div className="w-52 h-52 rounded-full bg-white border-4 border-[#251436] shadow-[6px_6px_0px_#251436] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle concentric decorative rings */}
          <div className="absolute inset-2 rounded-full border border-dashed border-[#251436]/20 pointer-events-none" />
          <div className="absolute inset-6 rounded-full border border-[#894EFF]/15 pointer-events-none" />

          {/* Top indicator pin */}
          <div className="absolute top-3 w-3 h-5 bg-[#F02A8A] rounded-b-full border border-[#251436]" />

          {/* Animated Big Number */}
          <div className="relative flex items-baseline justify-center overflow-hidden h-20 w-36">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={value}
                initial={{ y: direction === 'up' ? 30 : -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: direction === 'up' ? -30 : 30, opacity: 0 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className="text-6xl font-black text-[#251436] tracking-tight"
              >
                {value}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Unit pill */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FFC928] text-[#251436] border border-[#251436]">
              kg
            </span>
            <span className="text-xs font-semibold text-[#251436]/60">
              ({weightLbs} lbs)
            </span>
          </div>
        </div>
      </div>

      {/* Tactile + / - Stepper Buttons */}
      <div className="flex items-center justify-center gap-6 w-full max-w-xs">
        <button
          type="button"
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          className="w-16 h-16 rounded-2xl bg-white border-3 border-[#251436] shadow-[4px_4px_0px_#251436] flex items-center justify-center text-[#251436] active:translate-y-1 active:shadow-[1px_1px_0px_#251436] transition-all hover:bg-[#D4CEEF]"
          aria-label="Decrease weight"
        >
          <Minus size={28} strokeWidth={3} />
        </button>

        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#251436]/70 block">
            Tap or Hold
          </span>
          <span className="text-[11px] font-semibold text-[#894EFF]">
            Fast scroll supported
          </span>
        </div>

        <button
          type="button"
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          className="w-16 h-16 rounded-2xl bg-[#894EFF] border-3 border-[#251436] shadow-[4px_4px_0px_#251436] flex items-center justify-center text-white active:translate-y-1 active:shadow-[1px_1px_0px_#251436] transition-all hover:bg-[#7836f0]"
          aria-label="Increase weight"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </div>

      {/* Quick selection chips */}
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {[50, 55, 60, 65, 70, 75, 80].map((quick) => (
          <button
            key={quick}
            type="button"
            onClick={() => handleStep(quick - value)}
            className={`px-3 py-1 text-xs font-bold rounded-lg border-2 border-[#251436] transition-all ${
              value === quick
                ? 'bg-[#F02A8A] text-white shadow-[2px_2px_0px_#251436]'
                : 'bg-white text-[#251436] hover:bg-white/90'
            }`}
          >
            {quick} kg
          </button>
        ))}
      </div>
    </div>
  );
};
