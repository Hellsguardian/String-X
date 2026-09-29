import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { GARBA_LEVELS } from '../../data/mockData';

interface GarbaLevelSelectorProps {
  value: string;
  onChange: (levelId: string, levelTitle: string) => void;
}

export const GarbaLevelSelector: React.FC<GarbaLevelSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-3 w-full select-none">
      {GARBA_LEVELS.map((level) => {
        const isSelected = value === level.id;
        return (
          <motion.div
            key={level.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(level.id, level.title)}
            className={`relative p-4 rounded-2xl border-3 cursor-pointer transition-all ${
              isSelected
                ? 'bg-white border-[#251436] shadow-[4px_4px_0px_#251436] -translate-y-0.5 ring-2 ring-[#894EFF]/30'
                : 'bg-white/80 border-[#251436]/25 hover:border-[#251436]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              {/* Expressive Emoji Icon Avatar */}
              <div
                className="w-12 h-12 rounded-2xl border-2 border-[#251436] flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                style={{ backgroundColor: level.bg }}
              >
                {level.icon}
              </div>

              {/* Text details */}
              <div className="flex-1 pr-6">
                <h4 className="text-base font-black text-[#251436] leading-snug">
                  {level.title}
                </h4>
                <p className="text-xs font-semibold text-[#251436]/70 mt-1 leading-relaxed">
                  {level.subtitle}
                </p>
              </div>
            </div>

            {/* Selected Checkmark */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-[#251436] text-white flex items-center justify-center"
              >
                <Check size={14} strokeWidth={3} />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
