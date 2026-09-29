import React from 'react';
import { motion } from 'motion/react';
import { PU_EVENING_SPOTS } from '../../data/mockData';

interface EveningSpotSelectorProps {
  value?: string;
  onSelect: (spot: string) => void;
}

export const EveningSpotSelector: React.FC<EveningSpotSelectorProps> = ({
  value,
  onSelect,
}) => {
  return (
    <div className="w-full select-none">
      {/* Clean 2-column 2x2 grid with equal-dimension compact cards */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {PU_EVENING_SPOTS.map((spot) => {
          const isSelected = value === spot.id || value === spot.name;

          return (
            <motion.button
              key={spot.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect(spot.name)}
              className={`relative flex items-center justify-center px-3 py-3.5 sm:py-4 min-h-[56px] sm:min-h-[64px] rounded-2xl border-2 text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#894EFF] text-white border-[#251436] shadow-[2.5px_2.5px_0px_#251436] -translate-y-0.5'
                  : 'bg-white text-[#251436] border-[#251436]/25 hover:border-[#251436] shadow-[1.5px_1.5px_0px_#251436]/10'
              }`}
            >
              <span
                className={`text-xs sm:text-sm font-extrabold tracking-tight leading-snug ${
                  isSelected ? 'text-white' : 'text-[#251436]'
                }`}
              >
                {spot.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
