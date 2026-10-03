import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Check, X, Search, Home } from 'lucide-react';

export const FEMALE_HOSTELS = [
  'Sarojini Bhawan',
  'Indira Bhawan',
  'Teresa Bhawan',
  'Janki Bhawan',
  'Kalpana Bhawan',
  'Shakuntala Bhawan',
  'Rani Laxmibai Bhawan',
  'Abraham Lincoln',
  'Ratan Tata Bhawan',
  'Other / Off Campus',
];

export const MALE_HOSTELS = [
  'Shastri Bhawan',
  'Kalam Bhawan',
  'Tagore Bhawan',
  'Dhyan Bhawan',
  'Sardar Bhawan',
  'Milkha Bhawan',
  'Atal Bhawan',
  'Azad Bhawan',
  'Tilak Bhawan',
  'Abraham Lincoln',
  'Ratan Tata Bhawan',
  'Other / Off Campus',
];

interface CampusHostelSelectorProps {
  gender: string;
  university: string;
  hostel: string;
  onSelectUniversity: (university: string) => void;
  onSelectHostel: (hostel: string) => void;
}

export const CampusHostelSelector: React.FC<CampusHostelSelectorProps> = ({
  gender,
  university,
  hostel,
  onSelectUniversity,
  onSelectHostel,
}) => {
  const [isHostelSheetOpen, setIsHostelSheetOpen] = useState(false);
  const [hostelSearch, setHostelSearch] = useState('');
  const [showSumandeepModal, setShowSumandeepModal] = useState(false);

  const isFemale = gender.toLowerCase() === 'female';
  const hostelList = isFemale ? FEMALE_HOSTELS : MALE_HOSTELS;

  const filteredHostels = hostelList.filter((h) =>
    h.toLowerCase().includes(hostelSearch.toLowerCase().trim())
  );

  const isParulSelected = university === 'Parul University';

  const handleSelectParul = () => {
    onSelectUniversity('Parul University');
  };

  const handleSelectSumandeep = () => {
    // Deselect Parul if previously selected, so hostel section does not appear
    if (university === 'Parul University') {
      onSelectUniversity('');
    }
    setShowSumandeepModal(true);
  };

  const handleSelectHostel = (selected: string) => {
    onSelectHostel(selected);
    setIsHostelSheetOpen(false);
    setHostelSearch('');
  };

  return (
    <div className="w-full select-none space-y-4 pt-1">
      {/* 1. UNIVERSITY SELECTION SECTION */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#251436]/70 mb-2">
          YOUR UNIVERSITY
        </label>

        <div className="grid grid-cols-2 gap-3">
          {/* Parul University */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98, y: 1 }}
            onClick={handleSelectParul}
            className={`p-3.5 sm:p-4 rounded-2xl border-3 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[105px] sm:min-h-[112px] shadow-[3.5px_3.5px_0px_#251436] active:shadow-[2px_2px_0px_#251436] ${
              isParulSelected
                ? 'bg-[#894EFF] text-white border-[#251436]'
                : 'bg-white text-[#251436] border-[#251436] hover:bg-[#FAF9FF]'
            }`}
          >
            <div className="flex items-start justify-between w-full">
              <div
                className={`w-9 h-9 rounded-xl border-2 border-[#251436] flex items-center justify-center shrink-0 transition-colors shadow-[1px_1px_0px_#251436] ${
                  isParulSelected
                    ? 'bg-[#FFC928] text-[#251436]'
                    : 'bg-[#E3E0F5] text-[#251436]'
                }`}
              >
                <Building2 size={18} strokeWidth={2.5} />
              </div>

              {isParulSelected && (
                <div className="w-5 h-5 rounded-full bg-white text-[#894EFF] border-2 border-[#251436] flex items-center justify-center shadow-[1px_1px_0px_#251436]">
                  <Check size={12} strokeWidth={3.5} />
                </div>
              )}
            </div>

            <div className="mt-2.5">
              <span className="text-sm sm:text-[15px] font-black tracking-tight block leading-tight">
                Parul University
              </span>
              <span
                className={`text-[11px] font-semibold block mt-0.5 ${
                  isParulSelected ? 'text-white/80' : 'text-[#251436]/65'
                }`}
              >
                Vadodara, Gujarat
              </span>
            </div>
          </motion.button>

          {/* Sumandeep Vidyapeeth */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98, y: 1 }}
            onClick={handleSelectSumandeep}
            className="p-3.5 sm:p-4 rounded-2xl border-3 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[105px] sm:min-h-[112px] bg-white text-[#251436] border-[#251436] shadow-[3.5px_3.5px_0px_#251436] active:shadow-[2px_2px_0px_#251436] hover:bg-[#FAF9FF]"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-9 h-9 rounded-xl border-2 border-[#251436] flex items-center justify-center shrink-0 bg-[#E3E0F5] text-[#251436] shadow-[1px_1px_0px_#251436]">
                <Building2 size={18} strokeWidth={2.5} />
              </div>
            </div>

            <div className="mt-2.5">
              <span className="text-sm sm:text-[15px] font-black tracking-tight block leading-tight">
                Sumandeep Vidyapeeth
              </span>
              <span className="text-[11px] font-semibold text-[#251436]/65 block mt-0.5">
                Piparia, Vadodara
              </span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* 2. CONDITIONAL HOSTEL SELECTION SECTION (REVEALED ONLY WHEN PARUL UNIVERSITY IS SELECTED) */}
      <AnimatePresence>
        {isParulSelected && (
          <motion.div
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden space-y-2 pt-2"
          >
            <div className="flex items-baseline justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#251436]/70">
                YOUR HOSTEL
              </label>
              <span className="text-[11px] font-semibold text-[#251436]/60">
                {isFemale ? 'Girls Hostels' : 'Boys Hostels'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-[#251436]/70">
              Pick your hostel or choose off campus.
            </p>

            {/* Large Interactive Hostel Selection Card */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98, y: 1 }}
              onClick={() => setIsHostelSheetOpen(true)}
              className="w-full p-3.5 sm:p-4 rounded-2xl bg-white border-3 border-[#251436] shadow-[4px_4px_0px_#251436] active:shadow-[2px_2px_0px_#251436] flex items-center justify-between transition-all hover:bg-white/95 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <div className="w-11 h-11 rounded-xl bg-[#FFC928] border-2 border-[#251436] flex items-center justify-center text-[#251436] shrink-0 shadow-[1px_1px_0px_#251436]">
                  <Home size={20} strokeWidth={2.5} />
                </div>

                <div className="text-left min-w-0 flex-1">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                      hostel ? 'text-[#894EFF]' : 'text-[#251436]/60'
                    }`}
                  >
                    {hostel ? 'SELECTED HOSTEL' : 'CAMPUS HOSTEL'}
                  </span>
                  <span
                    className={`text-base sm:text-lg font-black block truncate ${
                      hostel ? 'text-[#251436]' : 'text-[#251436]/40'
                    }`}
                  >
                    {hostel || 'Select your hostel'}
                  </span>
                </div>
              </div>

              <div
                className={`px-3 py-1.5 rounded-xl border-2 border-[#251436] text-xs font-black text-[#251436] shrink-0 transition-colors ${
                  hostel ? 'bg-[#D4CEEF]' : 'bg-[#FFC928] shadow-[1px_1px_0px_#251436]'
                }`}
              >
                {hostel ? 'Change ▾' : 'Choose ▾'}
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. SUMANDEEP VIDYAPEETH AVAILABILITY MODAL */}
      <AnimatePresence>
        {showSumandeepModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#251436]/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="w-full max-w-sm bg-[#FAF9FF] border-3.5 border-[#251436] rounded-3xl p-5 sm:p-6 shadow-[6px_6px_0px_#251436] flex flex-col items-center text-center relative"
            >
              {/* Close X Button */}
              <button
                type="button"
                onClick={() => setShowSumandeepModal(false)}
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white border-2 border-[#251436] flex items-center justify-center text-[#251436] hover:bg-[#D4CEEF] transition-colors cursor-pointer shadow-[1px_1px_0px_#251436]"
                aria-label="Close dialog"
              >
                <X size={16} strokeWidth={3} />
              </button>

              {/* Playful Icon Badge */}
              <div className="w-14 h-14 rounded-2xl bg-[#FFC928] border-3 border-[#251436] flex items-center justify-center text-2xl shadow-[2px_2px_0px_#251436] mb-3 mt-1">
                👀
              </div>

              {/* Title */}
              <h3 className="text-2xl font-black text-[#251436] tracking-tight">
                Not there yet 👀
              </h3>

              {/* Body */}
              <p className="text-xs sm:text-sm font-semibold text-[#251436]/80 mt-2.5 leading-relaxed px-1">
                We haven't opened STRING X for <span className="font-extrabold text-[#251436]">Sumandeep Vidyapeeth</span> yet.
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[#251436]/80 mt-1.5 leading-relaxed px-1">
                We're expanding campus by campus, and Sumandeep is on our list.
              </p>

              {/* Friendly closing line */}
              <p className="text-xs sm:text-sm font-black text-[#894EFF] mt-3">
                Hang tight — we'd love to have your campus here soon. 💜
              </p>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => setShowSumandeepModal(false)}
                className="w-full mt-5 py-3 px-4 bg-[#894EFF] hover:bg-[#7839EE] text-white font-black text-sm rounded-2xl border-3 border-[#251436] shadow-[3px_3px_0px_#251436] active:translate-y-0.5 active:shadow-[1px_1px_0px_#251436] transition-all cursor-pointer"
              >
                Got it
              </button>

              {/* Secondary Action Link */}
              <button
                type="button"
                onClick={() => setShowSumandeepModal(false)}
                className="mt-2.5 text-xs font-bold text-[#251436]/70 hover:text-[#251436] transition-colors cursor-pointer"
              >
                Choose another university
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. HOSTEL BOTTOM SHEET OVERLAY */}
      <AnimatePresence>
        {isHostelSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#251436]/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full max-w-md bg-[#E3E0F5] border-t-4 sm:border-4 border-[#251436] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[82vh] max-h-[82dvh] flex flex-col"
              style={{
                paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
              }}
            >
              {/* Sheet Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#251436] leading-tight">
                    Pick your hostel
                  </h3>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-0.5">
                    Choose where you stay on campus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsHostelSheetOpen(false);
                    setHostelSearch('');
                  }}
                  className="w-9 h-9 rounded-full bg-white border-2 border-[#251436] flex items-center justify-center text-[#251436] hover:bg-[#D4CEEF] transition-colors cursor-pointer shadow-[1px_1px_0px_#251436]"
                >
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#251436]/60"
                />
                <input
                  type="text"
                  placeholder="Search hostel or bhawan..."
                  value={hostelSearch}
                  onChange={(e) => setHostelSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#251436] rounded-xl text-sm font-bold text-[#251436] placeholder:text-[#251436]/40 focus:outline-hidden focus:ring-2 focus:ring-[#894EFF]"
                />
              </div>

              {/* Hostels List */}
              <div className="overflow-y-auto space-y-2 flex-1 pr-1 pb-1">
                {filteredHostels.length > 0 ? (
                  filteredHostels.map((h) => {
                    const isSelected = hostel === h;
                    return (
                      <motion.button
                        key={h}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectHostel(h)}
                        className={`w-full p-3.5 rounded-xl border-2 font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#894EFF] text-white border-[#251436] shadow-[3px_3px_0px_#251436]'
                            : 'bg-white text-[#251436] border-[#251436]/20 hover:border-[#251436]'
                        }`}
                      >
                        <span className="leading-snug break-words pr-2">
                          {h}
                        </span>
                        {isSelected && <Check size={18} strokeWidth={3} />}
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-sm font-bold text-[#251436]/60">
                    No hostel found for "{hostelSearch}"
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
