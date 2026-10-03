import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { GARBA_ENERGIES } from '../../data/mockData';

interface GarbaEnergySelectorProps {
  value: 'Chill' | 'Casual' | 'Energetic' | 'No Breaks';
  onChange: (energy: 'Chill' | 'Casual' | 'Energetic' | 'No Breaks') => void;
}

export const GarbaEnergySelector: React.FC<GarbaEnergySelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-3 w-full select-none">
      {GARBA_ENERGIES.map((item) => {
        const isSelected = value === item.level;
        return (
          <motion.div
            key={item.level}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(item.level as any)}
            className={`relative p-4 rounded-2xl border-3 cursor-pointer transition-all ${
              isSelected
                ? 'bg-white border-[#251436] shadow-[4px_4px_0px_#251436] -translate-y-0.5'
                : 'bg-white/80 border-[#251436]/25 hover:border-[#251436]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-[#251436]">
                {item.title}
              </span>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-[#894EFF] text-white flex items-center justify-center">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
            </div>

            <p className="text-xs font-semibold text-[#251436]/70 mt-1 leading-relaxed">
              {item.description}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};
