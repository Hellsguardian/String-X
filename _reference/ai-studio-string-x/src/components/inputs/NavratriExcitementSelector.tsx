import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { NAVRATRI_EXCITEMENT_OPTIONS } from '../../data/mockData';

interface NavratriExcitementSelectorProps {
  selected: string[];
  onChange: (vibes: string[]) => void;
  maxSelection?: number;
}

export const NavratriExcitementSelector: React.FC<NavratriExcitementSelectorProps> = ({
  selected = [],
  onChange,
  maxSelection = 3,
}) => {
  const isMaxReached = selected.length >= maxSelection;

  const toggleOption = (title: string) => {
    if (selected.includes(title)) {
      onChange(selected.filter((item) => item !== title));
    } else {
      if (selected.length < maxSelection) {
        onChange([...selected, title]);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full select-none">
      {NAVRATRI_EXCITEMENT_OPTIONS.map((item) => {
        const isSelected = selected.includes(item.title);
        const isDisabled = !isSelected && isMaxReached;

        return (
          <motion.div
            key={item.id}
            whileHover={isDisabled ? undefined : { scale: 1.01 }}
            whileTap={isDisabled ? undefined : { scale: 0.98 }}
            onClick={() => {
              if (!isDisabled) {
                toggleOption(item.title);
              }
            }}
            className={`relative p-3.5 sm:p-4 rounded-2xl border-3 transition-all ${
              isSelected
                ? 'bg-white border-[#251436] shadow-[4px_4px_0px_#251436] -translate-y-0.5'
                : isDisabled
                ? 'bg-white/40 border-[#251436]/15 opacity-50 cursor-not-allowed'
                : 'bg-white/80 border-[#251436]/25 hover:border-[#251436] cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-3.5">
              {/* Square checkbox indicator - vertically centered relative to the entire card */}
              <div
                className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg border-2 flex items-center justify-center shrink-0 self-center transition-all ${
                  isSelected
                    ? 'bg-[#894EFF] border-[#894EFF] text-white shadow-xs'
                    : 'border-[#251436]/25 bg-white'
                }`}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={3.5} />
                  </motion.div>
                )}
              </div>

              {/* Title & Description */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-[#251436] leading-tight">
                  {item.title}
                </h3>
                <p className="text-xs font-semibold text-[#251436]/70 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
