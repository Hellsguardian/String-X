import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Sparkles, Users, Clock, ShieldCheck, HeartHandshake } from 'lucide-react';
import { EventDefinition } from '../../types/events';

interface EventIntroScreenProps {
  event: EventDefinition;
  onStartQuestions: () => void;
  onBack: () => void;
  alreadyAnswered?: boolean;
  onViewMatchesDirectly?: () => void;
}

export const EventIntroScreen: React.FC<EventIntroScreenProps> = ({
  event,
  onStartQuestions,
  onBack,
  alreadyAnswered = false,
  onViewMatchesDirectly,
}) => {
  return (
    <div className="w-full flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar px-5 sm:px-6 py-4 bg-[#E3E0F5] text-[#251436] select-none">
      {/* Top Header with Back Button */}
      <div className="flex items-center justify-between shrink-0 mb-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white border-2 border-[#251436] flex items-center justify-center text-[#251436] shadow-[2px_2px_0px_#251436] hover:bg-[#F3EEFF] active:translate-y-0.5 cursor-pointer transition-all"
          aria-label="Back to discovery"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>

        <span className="text-[11px] font-black uppercase tracking-wider text-[#251436] bg-white border-2 border-[#251436] px-3 py-1 rounded-full shadow-[2px_2px_0px_#251436]">
          {event.title} EVENT
        </span>

        <div className="w-10" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center text-center my-auto max-w-sm mx-auto">
        {/* Animated Event Icon Badge */}
        <motion.div
          initial={{ scale: 0.7, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-3 border-[#251436] flex items-center justify-center text-4xl sm:text-5xl shadow-[4px_4px_0px_#251436] mb-4"
          style={{ backgroundColor: event.accentBg }}
        >
          <span>{event.emoji}</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-2xl sm:text-3xl font-black text-[#251436] tracking-tight leading-tight mb-2"
        >
          {event.introHeadline}
        </motion.h1>

        {/* Supporting Text */}
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.3 }}
          className="text-xs sm:text-sm font-semibold text-[#251436]/75 leading-relaxed max-w-xs mb-5"
        >
          {event.introSubtitle}
        </motion.p>

        {/* Metadata Card: Time & Participants */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="w-full bg-white rounded-2xl border-2 border-[#251436] p-3.5 shadow-[3px_3px_0px_#251436] flex items-center justify-around gap-2 mb-4"
        >
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-[#251436]/60 uppercase">Questions</span>
            <span className="text-sm font-black text-[#251436] mt-0.5">{event.questions.length} Quick</span>
          </div>

          <div className="w-[1px] h-8 bg-[#251436]/15" />

          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-[#251436]/60 uppercase">Est. Time</span>
            <span className="text-sm font-black text-[#894EFF] mt-0.5">~60 Seconds</span>
          </div>

          <div className="w-[1px] h-8 bg-[#251436]/15" />

          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-[#251436]/60 uppercase">Joined</span>
            <span className="text-sm font-black text-[#08A98D] mt-0.5">{event.participantCount}</span>
          </div>
        </motion.div>

        {/* Reassurance */}
        <p className="text-[11px] font-medium text-[#251436]/65 flex items-center justify-center gap-1.5">
          <Sparkles size={12} className="text-[#894EFF]" />
          <span>Used exclusively to calculate mutual compatibility.</span>
        </p>
      </div>

      {/* Bottom CTA Button */}
      <div className="shrink-0 pt-3 pb-1">
        {alreadyAnswered && onViewMatchesDirectly ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onViewMatchesDirectly}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#08A98D] text-white text-base font-black border-3 border-[#251436] shadow-[3.5px_3.5px_0px_#251436] hover:bg-[#079179] active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>View Matches ({event.title})</span>
              <ArrowRight size={18} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={onStartQuestions}
              className="w-full py-2.5 px-4 rounded-xl bg-white/70 text-[#251436] text-xs font-black border border-[#251436]/30 hover:bg-white active:translate-y-0.5 cursor-pointer transition-all"
            >
              Retake / Update Vibe Answers
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartQuestions}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#894EFF] text-white text-base font-black border-3 border-[#251436] shadow-[3.5px_3.5px_0px_#251436] hover:bg-[#783dee] active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <span>Let's do it</span>
            <ArrowRight size={18} strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
};
