import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Check, X } from 'lucide-react';
import { INDIAN_STATES_LIST, INDIAN_UNION_TERRITORIES } from '../../data/mockData';

interface StateSelectorModalProps {
  value: string;
  onChange: (state: string) => void;
}

export const StateSelector: React.FC<StateSelectorModalProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();

  const filteredStates = INDIAN_STATES_LIST.filter(s =>
    s.toLowerCase().includes(query)
  );

  const filteredUTs = INDIAN_UNION_TERRITORIES.filter(u =>
    u.toLowerCase().includes(query)
  );

  const showOther = query === '' || 'other'.includes(query);
  const hasAnyResults = filteredStates.length > 0 || filteredUTs.length > 0 || showOther;

  const popularStates = ['Gujarat', 'Maharashtra', 'Rajasthan', 'Delhi', 'Madhya Pradesh'];

  return (
    <div className="w-full select-none">
      {/* Visual State Trigger Card */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="w-full p-4 rounded-2xl bg-white border-3 border-[#251436] shadow-[4px_4px_0px_#251436] flex items-center justify-between transition-all hover:bg-white/90 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FFC928] border-2 border-[#251436] flex items-center justify-center text-xl">
            📍
          </div>
          <div className="text-left">
            <span className="text-[11px] font-extrabold uppercase text-[#894EFF] tracking-wider block">
              Selected Home State
            </span>
            <span className="text-xl font-black text-[#251436] block">
              {value || 'Select your state'}
            </span>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-[#D4CEEF] border-2 border-[#251436] text-xs font-black text-[#251436]">
          Change ▾
        </div>
      </motion.button>

      {/* Quick Select Popular Pills */}
      <div className="mt-4">
        <span className="text-xs font-bold text-[#251436]/70 uppercase tracking-wider block mb-2">
          Popular college hubs:
        </span>
        <div className="flex flex-wrap gap-2">
          {popularStates.map(state => (
            <button
              key={state}
              type="button"
              onClick={() => onChange(state)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 transition-all cursor-pointer ${
                value === state
                  ? 'bg-[#894EFF] text-white border-[#251436] shadow-[2px_2px_0px_#251436]'
                  : 'bg-white text-[#251436] border-[#251436]/30 hover:border-[#251436]'
              }`}
            >
              {state === 'Gujarat' ? '🦁 Gujarat' : state}
            </button>
          ))}
        </div>
      </div>

      {/* Modal / Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#251436]/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="w-full max-w-md bg-[#E3E0F5] border-t-4 sm:border-4 border-[#251436] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-black text-[#251436]">Where's Home?</h3>
                  <p className="text-xs font-semibold text-[#251436]/70">Find your regional Garba tribe</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-full bg-white border-2 border-[#251436] flex items-center justify-center text-[#251436] hover:bg-[#D4CEEF] cursor-pointer"
                >
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              {/* Search input */}
              <div className="relative mb-3.5">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#251436]/60" />
                <input
                  type="text"
                  placeholder="Search 28 states & 8 UTs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border-2 border-[#251436] rounded-xl text-sm font-bold text-[#251436] placeholder:text-[#251436]/40 focus:outline-hidden focus:ring-2 focus:ring-[#894EFF]"
                />
              </div>

              {/* State & UT list */}
              <div className="overflow-y-auto space-y-2 flex-1 pr-1 overscroll-contain">
                {!hasAnyResults && (
                  <div className="text-center py-8 text-[#251436]/60 font-bold text-sm">
                    No state or territory found
                  </div>
                )}

                {/* Section: STATES */}
                {filteredStates.length > 0 && (
                  <div>
                    <div className="sticky top-0 z-10 bg-[#E3E0F5] pt-1 pb-1.5 px-0.5 mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#894EFF] bg-[#D4CEEF] px-2.5 py-0.5 rounded-md border border-[#894EFF]/30">
                        STATES
                      </span>
                      <span className="text-[10px] font-bold text-[#251436]/50">
                        {filteredStates.length} of 28
                      </span>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      {filteredStates.map(state => {
                        const isSelected = value === state;
                        return (
                          <button
                            key={state}
                            type="button"
                            onClick={() => {
                              onChange(state);
                              setIsOpen(false);
                            }}
                            className={`w-full p-3 sm:p-3.5 rounded-xl border-2 font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#894EFF] text-white border-[#251436] shadow-[3px_3px_0px_#251436]'
                                : 'bg-white text-[#251436] border-[#251436]/20 hover:border-[#251436]'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <MapPin size={16} className={isSelected ? 'text-[#FFC928]' : 'text-[#894EFF]'} />
                              {state}
                            </span>
                            {isSelected && <Check size={18} strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section: UNION TERRITORIES */}
                {filteredUTs.length > 0 && (
                  <div className={filteredStates.length > 0 ? "pt-3" : ""}>
                    <div className="sticky top-0 z-10 bg-[#E3E0F5] pt-1 pb-1.5 px-0.5 mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#08A98D] bg-[#E2F8F4] px-2.5 py-0.5 rounded-md border border-[#08A98D]/30">
                        UNION TERRITORIES
                      </span>
                      <span className="text-[10px] font-bold text-[#251436]/50">
                        {filteredUTs.length} of 8
                      </span>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      {filteredUTs.map(ut => {
                        const isSelected = value === ut;
                        return (
                          <button
                            key={ut}
                            type="button"
                            onClick={() => {
                              onChange(ut);
                              setIsOpen(false);
                            }}
                            className={`w-full p-3 sm:p-3.5 rounded-xl border-2 font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#894EFF] text-white border-[#251436] shadow-[3px_3px_0px_#251436]'
                                : 'bg-white text-[#251436] border-[#251436]/20 hover:border-[#251436]'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <MapPin size={16} className={isSelected ? 'text-[#FFC928]' : 'text-[#08A98D]'} />
                              {ut}
                            </span>
                            {isSelected && <Check size={18} strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Final Option: Other */}
                {showOther && (
                  <div className="pt-2 pb-1">
                    <button
                      key="Other"
                      type="button"
                      onClick={() => {
                        onChange('Other');
                        setIsOpen(false);
                      }}
                      className={`w-full p-3 sm:p-3.5 rounded-xl border-2 font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${
                        value === 'Other'
                          ? 'bg-[#894EFF] text-white border-[#251436] shadow-[3px_3px_0px_#251436]'
                          : 'bg-white text-[#251436] border-[#251436]/20 hover:border-[#251436]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin size={16} className={value === 'Other' ? 'text-[#FFC928]' : 'text-[#251436]/60'} />
                        Other
                      </span>
                      {value === 'Other' && <Check size={18} strokeWidth={3} />}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
