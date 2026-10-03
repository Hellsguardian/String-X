import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Sparkles,
  Flame,
  CheckCircle2,
  HeartHandshake,
  MessageCircle,
  Share2,
  MapPin,
  GraduationCap,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { EventDefinition, EventMatch } from '../../types/events';
import { MOCK_EVENT_MATCHES } from '../../data/eventsData';

interface EventMatchesScreenProps {
  currentEvent: EventDefinition;
  allEvents: EventDefinition[];
  joinedEventIds: string[];
  onSelectEvent: (eventId: string) => void;
  onBackToHome: () => void;
}

export const EventMatchesScreen: React.FC<EventMatchesScreenProps> = ({
  currentEvent,
  allEvents,
  joinedEventIds,
  onSelectEvent,
  onBackToHome,
}) => {
  const [activeMatchIdx, setActiveMatchIdx] = useState<number>(0);
  const [wavedMatchIds, setWavedMatchIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const matches: EventMatch[] = MOCK_EVENT_MATCHES[currentEvent.id] || [];
  const currentMatch = matches[activeMatchIdx];

  const handleWave = (matchId: string, name: string) => {
    if (wavedMatchIds.includes(matchId)) return;
    setWavedMatchIds((prev) => [...prev, matchId]);
    setToastMessage(`Wave sent to ${name}! 👋`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between overflow-hidden bg-[#E3E0F5] text-[#251436] select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#251436] text-white text-xs font-black rounded-xl border-2 border-[#FFC928] shadow-[3px_3px_0px_#894EFF] flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>✨</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="shrink-0 px-4 pt-3 pb-2 bg-[#E3E0F5]">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="w-9 h-9 rounded-xl bg-white border-2 border-[#251436] flex items-center justify-center text-[#251436] shadow-[2px_2px_0px_#251436] active:translate-y-0.5 cursor-pointer transition-all"
            aria-label="Back to discovery"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-1">
            <span className="text-base">{currentEvent.emoji}</span>
            <h1 className="text-sm font-black uppercase text-[#251436] tracking-wide">
              {currentEvent.title} Matches
            </h1>
          </div>

          <span className="text-xs font-mono font-bold text-[#894EFF] bg-white border border-[#251436] px-2 py-0.5 rounded-lg shadow-[1.5px_1.5px_0px_#251436]">
            {matches.length} FOUND
          </span>
        </div>

        {/* Event Switcher Tabs (if joined multiple events) */}
        {joinedEventIds.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {joinedEventIds.map((evtId) => {
              const evt = allEvents.find((e) => e.id === evtId);
              if (!evt) return null;
              const isActive = evt.id === currentEvent.id;
              return (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => {
                    setActiveMatchIdx(0);
                    onSelectEvent(evt.id);
                  }}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#251436] text-white border border-[#251436] shadow-xs'
                      : 'bg-white/80 text-[#251436] border border-[#251436]/30 hover:bg-white'
                  }`}
                >
                  <span>{evt.emoji}</span>
                  <span>{evt.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Match Card Area */}
      <div className="flex-1 flex flex-col px-4 sm:px-5 py-1 overflow-y-auto no-scrollbar">
        {matches.length === 0 ? (
          <div className="my-auto text-center p-6 bg-white rounded-3xl border-3 border-[#251436] shadow-[4px_4px_0px_#251436]">
            <span className="text-4xl mb-2 block">{currentEvent.emoji}</span>
            <h3 className="text-base font-black text-[#251436]">No matches in this pool yet</h3>
            <p className="text-xs text-[#251436]/70 mt-1">
              New college peers are joining this event every few minutes.
            </p>
          </div>
        ) : (
          currentMatch && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMatch.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="w-full flex-1 flex flex-col justify-between bg-white rounded-3xl border-3 border-[#251436] p-4 sm:p-5 shadow-[4px_4px_0px_#251436]"
              >
                {/* Photo & Compatibility Header */}
                <div className="flex gap-3.5 items-start">
                  <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl border-2 border-[#251436] overflow-hidden shadow-[2.5px_2.5px_0px_#251436] shrink-0">
                    <img
                      src={currentMatch.photoUrl}
                      alt={currentMatch.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 bg-[#10B981] text-white p-0.5 rounded-full border border-[#251436]">
                      <ShieldCheck size={11} strokeWidth={3} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Compatibility Pill */}
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFC928] text-[#251436] text-[11px] font-black border border-[#251436] shadow-[1px_1px_0px_#251436] mb-1">
                      <Flame size={12} className="text-[#F02A8A] fill-[#F02A8A]" />
                      <span>{currentMatch.compatibilityScore}% Compatibility</span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-[#251436] leading-tight truncate">
                      {currentMatch.name}
                    </h2>

                    <p className="text-xs font-bold text-[#894EFF] truncate">
                      "{currentMatch.nickname}" · {currentMatch.collegeYear}
                    </p>

                    <p className="text-[11px] font-semibold text-[#251436]/70 truncate mt-0.5">
                      {currentMatch.department}
                    </p>

                    <p className="text-[11px] text-[#251436]/60 truncate">
                      {currentMatch.college}
                    </p>
                  </div>
                </div>

                {/* Vibe Title & Quote */}
                <div className="my-3 p-3 rounded-2xl bg-[#F3EEFF] border-2 border-[#894EFF]/40 text-left">
                  <div className="text-xs font-black text-[#894EFF] flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>{currentMatch.vibeTitle}</span>
                  </div>
                  <p className="text-xs font-bold text-[#251436] mt-1 italic">
                    "{currentMatch.vibeQuote}"
                  </p>
                </div>

                {/* Why You Matched Highlights */}
                <div className="space-y-1.5 mb-3 text-left">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#251436]/60">
                    Why your vibes synced
                  </span>
                  <div className="flex flex-col gap-1">
                    {currentMatch.sharedHighlights.map((hl, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-1.5 text-xs font-medium text-[#251436]"
                      >
                        <CheckCircle2 size={13} className="text-[#08A98D] shrink-0 mt-0.5" />
                        <span className="leading-snug">{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dimension Scores Bar */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {currentMatch.dimensionScores.map((score, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-1.5 rounded-xl bg-[#251436]/5 border border-[#251436]/15 flex items-center justify-between text-[11px] font-bold"
                    >
                      <span className="text-[#251436]/75 truncate">{score.label}</span>
                      <span className="font-mono text-[#894EFF] font-black">{score.score}%</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#251436]/10">
                  <button
                    type="button"
                    onClick={() => handleWave(currentMatch.id, currentMatch.nickname)}
                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 border-[#251436] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#251436] active:translate-y-0.5 ${
                      wavedMatchIds.includes(currentMatch.id)
                        ? 'bg-[#E2F8F4] text-[#08A98D]'
                        : 'bg-white text-[#251436] hover:bg-[#F3EEFF]'
                    }`}
                  >
                    <span>{wavedMatchIds.includes(currentMatch.id) ? '👋 Waved' : 'Wave 👋'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setToastMessage(`Connection request sent to ${currentMatch.nickname}! 💬`);
                      setTimeout(() => setToastMessage(null), 2500);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#894EFF] text-white border-2 border-[#251436] text-xs font-black hover:bg-[#783dee] shadow-[2px_2px_0px_#251436] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle size={14} />
                    <span>Connect</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )
        )}
      </div>

      {/* Match Carousel Navigation (Dots & Next/Prev) */}
      {matches.length > 1 && (
        <div className="shrink-0 px-5 py-2.5 flex items-center justify-between bg-[#E3E0F5] border-t border-[#251436]/10">
          <button
            type="button"
            onClick={() => setActiveMatchIdx((prev) => (prev > 0 ? prev - 1 : matches.length - 1))}
            className="px-3 py-1 rounded-xl bg-white border-2 border-[#251436] text-xs font-black shadow-[1.5px_1.5px_0px_#251436] active:translate-y-0.5 cursor-pointer"
          >
            ← Previous
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {matches.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setActiveMatchIdx(dotIdx)}
                className={`w-2.5 h-2.5 rounded-full border border-[#251436] transition-all cursor-pointer ${
                  dotIdx === activeMatchIdx ? 'bg-[#894EFF] w-5' : 'bg-white'
                }`}
                aria-label={`Match ${dotIdx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActiveMatchIdx((prev) => (prev < matches.length - 1 ? prev + 1 : 0))}
            className="px-3 py-1 rounded-xl bg-white border-2 border-[#251436] text-xs font-black shadow-[1.5px_1.5px_0px_#251436] active:translate-y-0.5 cursor-pointer"
          >
            Next Match →
          </button>
        </div>
      )}
    </div>
  );
};
