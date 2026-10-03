import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Users, ArrowRight, Calendar, MapPin, CheckCircle, Flame, Compass } from 'lucide-react';
import { STRINGX_EVENTS } from '../../data/eventsData';
import { EventDefinition, EventCategory } from '../../types/events';

interface EventDiscoveryFeedProps {
  onSelectEvent: (eventId: string) => void;
  joinedEventIds: string[];
}

export const EventDiscoveryFeed: React.FC<EventDiscoveryFeedProps> = ({
  onSelectEvent,
  joinedEventIds,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all');

  const filteredEvents = STRINGX_EVENTS.filter((evt) => {
    if (selectedCategory === 'all') return true;
    return evt.category === selectedCategory;
  });

  const categories: { id: EventCategory; label: string; emoji: string }[] = [
    { id: 'all', label: 'All Events', emoji: '✨' },
    { id: 'cultural', label: 'Festive & Garba', emoji: '🪩' },
    { id: 'campus', label: 'Campus Life', emoji: '🎓' },
    { id: 'fest', label: 'Annual Fests', emoji: '🎤' },
    { id: 'social', label: 'Casual Meets', emoji: '☕' },
  ];

  return (
    <div className="w-full flex-1 flex flex-col overflow-y-auto no-scrollbar pb-6 px-4 sm:px-5">
      {/* 
        HERO SECTION:
        - Compact & visually punchy
        - "Ready to find your people?"
        - "Pick an event. Tell us your vibe. We'll handle the pairing."
      */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full pt-2 pb-3.5 mb-2"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#894EFF] bg-white border border-[#251436] px-2.5 py-0.5 rounded-full shadow-[1.5px_1.5px_0px_#251436]">
            <Sparkles size={11} className="text-[#FFC928] fill-[#FFC928]" />
            <span>Welcome to STRING X</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-[28px] font-black text-[#251436] tracking-tight leading-[1.15]">
          Ready to find your people?
        </h1>
        <p className="text-xs sm:text-[13px] font-medium text-[#251436]/75 mt-1 leading-relaxed max-w-sm">
          Pick an event. Tell us your vibe. We'll handle the pairing.
        </p>
      </motion.div>

      {/* FILTER BUTTONS / SEGMENTED TABS */}
      <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 mb-2">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#251436] text-white border-2 border-[#251436] shadow-[2px_2px_0px_#894EFF]'
                  : 'bg-white text-[#251436] border-2 border-[#251436]/30 hover:border-[#251436] shadow-[1.5px_1.5px_0px_rgba(37,20,54,0.15)]'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION HEADER */}
      <div className="flex items-baseline justify-between mb-2.5">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-[#251436]">
            Discover Your Next Thing
          </h2>
          <p className="text-[11px] font-medium text-[#251436]/70">
            Events where you can meet someone who matches your vibe.
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#894EFF] bg-white border border-[#251436]/40 px-2 py-0.5 rounded-md">
          {filteredEvents.length} LIVE
        </span>
      </div>

      {/* INTERACTIVE EVENT CARDS LIST */}
      <div className="flex flex-col gap-3.5">
        {filteredEvents.map((event, idx) => {
          const isJoined = joinedEventIds.includes(event.id);
          const isNavratri = event.id === 'navratri';

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelectEvent(event.id)}
              className={`group relative w-full text-left rounded-2xl sm:rounded-3xl border-3 border-[#251436] bg-white p-4 sm:p-4.5 cursor-pointer transition-all duration-200 select-none shadow-[4px_4px_0px_#251436] hover:shadow-[5px_5px_0px_#251436]`}
            >
              {/* Top Accent Strip & Badge */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-2 border-[#251436] flex items-center justify-center text-xl sm:text-2xl shadow-[2px_2px_0px_#251436] shrink-0"
                    style={{ backgroundColor: event.accentBg }}
                  >
                    <span>{event.emoji}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-lg sm:text-xl font-black text-[#251436] tracking-tight group-hover:text-[#894EFF] transition-colors leading-tight">
                        {event.title}
                      </h3>
                      {isNavratri && (
                        <span className="text-[10px] font-black uppercase text-[#F02A8A] bg-[#FFECF4] border border-[#F02A8A]/40 px-1.5 py-0.2 rounded-md">
                          Trending 🔥
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[#894EFF]">
                      {event.tagline}
                    </p>
                  </div>
                </div>

                {/* Participant Count Pill */}
                <div className="flex items-center gap-1 bg-[#251436]/5 text-[#251436] border border-[#251436]/20 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0">
                  <Users size={12} className="text-[#894EFF]" />
                  <span>{event.participantCount}</span>
                </div>
              </div>

              {/* Short Description */}
              <p className="text-xs text-[#251436]/75 font-normal leading-relaxed line-clamp-2 mb-3">
                {event.shortDesc}
              </p>

              {/* Date & Location Minimal Metadata */}
              <div className="flex items-center gap-3 text-[11px] text-[#251436]/65 font-medium mb-3 pb-2.5 border-b border-[#251436]/10">
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-[#894EFF]" />
                  <span>{event.date}</span>
                </span>
                <span className="hidden sm:flex items-center gap-1 truncate max-w-[150px]">
                  <MapPin size={12} className="text-[#F02A8A]" />
                  <span>{event.location}</span>
                </span>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between">
                {isJoined ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#08A98D] bg-[#E2F8F4] border border-[#08A98D] px-2.5 py-1 rounded-xl">
                    <CheckCircle size={13} strokeWidth={2.5} />
                    <span>Vibe Synced · View Matches</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#251436]/60">
                    {event.questions.length} Quick Questions
                  </span>
                )}

                <div
                  className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-[#251436] transition-all shadow-[2px_2px_0px_#251436] ${
                    isJoined
                      ? 'bg-white text-[#251436] hover:bg-[#F3EEFF]'
                      : 'bg-[#894EFF] text-white hover:bg-[#783dee] group-hover:translate-x-0.5'
                  }`}
                >
                  <span>{isJoined ? 'See Matches' : 'Join event'}</span>
                  <ArrowRight size={13} strokeWidth={3} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trust & Privacy Reassurance */}
      <div className="mt-5 p-3 rounded-2xl bg-white/70 border border-[#251436]/20 flex items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFC928] border border-[#251436] flex items-center justify-center text-xs font-black shadow-[1px_1px_0px_#251436]">
            🛡️
          </div>
          <p className="text-[11px] font-semibold text-[#251436]/75">
            Strict campus verification. Zero bots. Only genuine college peers.
          </p>
        </div>
      </div>
    </div>
  );
};
