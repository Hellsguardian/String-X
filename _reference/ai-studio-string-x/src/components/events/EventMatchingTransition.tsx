import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, Music, Flame } from 'lucide-react';
import { EventDefinition } from '../../types/events';

interface EventMatchingTransitionProps {
  event: EventDefinition;
  answers: Record<string, any>;
  onProceedToMatches: () => void;
}

export const EventMatchingTransition: React.FC<EventMatchingTransitionProps> = ({
  event,
  answers,
  onProceedToMatches,
}) => {
  // Phase 1: "Finding your rhythm..." / "Calculating frequencies..." (0 - 1.6s)
  // Phase 2: Animated Compatibility Breakdown (1.6s+)
  // Phase 3: "Your Garba pool is ready" (2.8s+)
  const [phase, setPhase] = useState<'calculating' | 'bars' | 'ready'>('calculating');

  // Compute animated scores dynamically from user answers or defaults
  const dimensions = event.vibeDimensions.map((dim) => {
    // If social slider was answered, sync into social score
    if (dim.key === 'social' && typeof answers['social-energy'] === 'number') {
      return { ...dim, score: answers['social-energy'] };
    }
    // High energy modifier
    return { ...dim, score: dim.defaultScore };
  });

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('bars');
    }, 1400);

    const t2 = setTimeout(() => {
      setPhase('ready');
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const eventVibeHeading = event.id === 'navratri' ? 'GARBA VIBE' : `${event.title} VIBE`;
  const eventReadyHeading =
    event.id === 'navratri' ? 'Your Garba pool is ready.' : `Your ${event.title} pool is ready.`;

  return (
    <div className="w-full flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar px-5 sm:px-6 py-5 bg-[#251436] text-white select-none">
      {/* Top Header Tag */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">{event.emoji}</span>
          <span className="text-xs font-black tracking-wider uppercase text-[#FFC928]">
            STRING X ALGORITHM
          </span>
        </div>

        <span className="text-[10px] font-mono text-white/60 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
          EVENT PAIRING
        </span>
      </div>

      {/* Center Dynamic Animation Stage */}
      <div className="flex-1 flex flex-col justify-center items-center text-center my-auto max-w-sm mx-auto w-full">
        {/* Phase 1: Pulsing Radar Indicator */}
        {phase === 'calculating' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="relative w-24 h-24 rounded-full border-3 border-[#FFC928] flex items-center justify-center mb-5 bg-[#1B0F28] shadow-[0_0_25px_rgba(255,201,40,0.35)]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                className="absolute inset-2 border-2 border-dashed border-[#894EFF] rounded-full"
              />
              <span className="text-4xl">{event.emoji}</span>
            </div>

            <motion.h2
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="text-xl sm:text-2xl font-black text-white tracking-tight"
            >
              {event.id === 'navratri' ? 'Finding your rhythm...' : 'Mapping your campus vibe...'}
            </motion.h2>
            <p className="text-xs text-[#E3E0F5]/70 mt-1 max-w-[240px]">
              Analyzing 3-taali synchronization, energy stamina & late-night frequency.
            </p>
          </motion.div>
        )}

        {/* Phase 2 & 3: Compatibility Visualization & Pool Ready */}
        {phase !== 'calculating' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full flex flex-col items-center"
          >
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#894EFF]/30 border border-[#894EFF] text-xs font-black text-[#FFC928] mb-3">
              <Sparkles size={12} />
              <span>{eventVibeHeading}</span>
            </div>

            {/* Vibe Breakdown Metrics Box */}
            <div className="w-full bg-[#1B0F28] rounded-2xl border-2 border-[#894EFF]/50 p-4 shadow-[3px_3px_0px_#894EFF] mb-5 text-left">
              <div className="space-y-3">
                {dimensions.map((dim, idx) => (
                  <div key={dim.key} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-[#E3E0F5]">
                      <span>{dim.label}</span>
                      <span className="font-mono text-[#FFC928]">{dim.score}%</span>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dim.score}%` }}
                        transition={{ delay: 0.15 + idx * 0.12, duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: dim.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Reveal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-white mb-1">
                <CheckCircle2 size={20} className="text-[#08A98D]" strokeWidth={2.5} />
                <span>{eventReadyHeading}</span>
              </div>

              <p className="text-xs text-[#E3E0F5]/80 max-w-xs leading-relaxed">
                We found people whose vibe lines up with yours on campus.
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Bottom CTA Button */}
      <div className="shrink-0 pt-2 pb-1">
        <button
          type="button"
          onClick={onProceedToMatches}
          disabled={phase === 'calculating'}
          className={`w-full py-3.5 px-6 rounded-2xl text-base font-black border-3 border-[#251436] transition-all flex items-center justify-center gap-2 ${
            phase !== 'calculating'
              ? 'bg-[#FFC928] text-[#251436] shadow-[3.5px_3.5px_0px_#894EFF] hover:bg-[#ffcf42] active:translate-y-0.5 cursor-pointer'
              : 'bg-white/15 text-white/40 border-white/10 cursor-not-allowed shadow-none'
          }`}
        >
          <span>See my matches</span>
          <ArrowRight size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
