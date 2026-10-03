import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

interface GenderSelectorProps {
  selectedGender: 'Male' | 'Female' | string;
  onSelect: (gender: 'Male' | 'Female') => void;
}

export const GenderSelector: React.FC<GenderSelectorProps> = ({
  selectedGender,
  onSelect,
}) => {
  const options: Array<{
    id: 'Male' | 'Female';
    label: string;
    imageSrc: string;
    alt: string;
  }> = [
    {
      id: 'Male',
      label: 'Male',
      imageSrc: '/assets/male_no_border.svg',
      alt: 'Male character illustration with city skyline',
    },
    {
      id: 'Female',
      label: 'Female',
      imageSrc: '/assets/female_no_border.svg',
      alt: 'Female character illustration with city skyline',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-3.5 w-full select-none">
      {options.map((option) => {
        const isSelected = selectedGender === option.id;

        return (
          <motion.button
            key={option.id}
            type="button"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => onSelect(option.id)}
            aria-pressed={isSelected}
            aria-label={`Select ${option.label}`}
            className={`group relative w-full aspect-[0.85] max-h-[162px] sm:max-h-[188px] rounded-2xl sm:rounded-[20px] overflow-hidden cursor-pointer select-none transition-all duration-200 flex flex-col justify-end text-left bg-[#1B112E] ${
              isSelected
                ? 'border-[2.5px] border-[#894EFF] shadow-[3.5px_3.5px_0px_#251436,0_0_10px_rgba(137,78,255,0.32)] -translate-y-0.5 ring-1 ring-inset ring-white/20'
                : 'border-2 border-[#251436] shadow-[3px_3px_0px_#251436] hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0px_#251436]'
            }`}
          >
            {/* Character Illustration with Smooth Grayscale -> Full Color Transition */}
            <img
              src={option.imageSrc}
              alt={option.alt}
              className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-all duration-220 ease-out ${
                isSelected
                  ? 'grayscale-0 contrast-100 brightness-100 opacity-100 scale-[1.02]'
                  : 'grayscale contrast-[0.92] brightness-95 opacity-80 scale-100 group-hover:opacity-90'
              }`}
              loading="eager"
            />

            {/* Subtle Gradient for Bottom Label Readability */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-[#140B24]/90 via-[#140B24]/20 to-transparent pointer-events-none transition-opacity duration-200 ${
                isSelected ? 'opacity-90' : 'opacity-80'
              }`}
            />

            {/* Compact White Circular Checkmark Badge for Selected State */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-white text-[#894EFF] border border-[#894EFF]/40 shadow-[0_1px_4px_rgba(0,0,0,0.35)] flex items-center justify-center pointer-events-none"
                >
                  <Check size={12} strokeWidth={3.5} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Integrated Translucent Deep-Purple Bottom Panel for Label */}
            <div className="relative z-10 w-full p-1.5 sm:p-2">
              <div
                className={`w-full py-1 sm:py-1.5 px-2 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 border ${
                  isSelected
                    ? 'bg-[#160D27]/95 border-[#894EFF]/50 shadow-[0_0_6px_rgba(137,78,255,0.25)]'
                    : 'bg-[#160D27]/80 border-white/10'
                }`}
              >
                <span
                  className={`text-xs sm:text-sm font-black tracking-wide leading-none select-none transition-colors duration-200 ${
                    isSelected ? 'text-white' : 'text-white/80'
                  }`}
                >
                  {option.label}
                </span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
