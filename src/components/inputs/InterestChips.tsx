import React from 'react';
import { motion } from 'motion/react';
import { GENERAL_INTERESTS } from '../../data/mockData';

interface InterestChipsProps {
  selected: string[];
  onChange: (interests: string[]) => void;
  maxSelection?: number;
}

export const InterestChips: React.FC<InterestChipsProps> = ({
  selected,
  onChange,
  maxSelection = 6
}) => {
  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(i => i !== id));
    } else {
      if (selected.length < maxSelection) {
        onChange([...selected, id]);
      }
    }
  };

  return (
    <div className="w-full select-none">
      {/* Category header & counter: removed feedback badge as requested */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-xs font-bold text-[#251436]/70 uppercase tracking-wider">
          Tap your favorites ({selected.length}/{maxSelection}):
        </span>
      </div>

      {/* Centered space-efficient responsive wrapping chip layout */}
      <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 w-full max-w-full">
        {GENERAL_INTERESTS.map((item) => {
          const isSelected = (selected || []).includes(item.id) || (selected || []).includes(item.label);
          return (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleInterest(item.id)}
              className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-[12.5px] font-extrabold border-2 transition-all cursor-pointer whitespace-nowrap leading-snug ${
                isSelected
                  ? 'bg-[#894EFF] text-white border-[#251436] shadow-[2.5px_2.5px_0px_#251436] -translate-y-0.5'
                  : 'bg-white text-[#251436] border-[#251436]/25 hover:border-[#251436] shadow-[1px_1px_0px_#251436]/10'
              }`}
            >
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
