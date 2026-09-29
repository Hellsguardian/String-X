import React from 'react';
import { HorizontalHeightPicker } from './HorizontalHeightPicker';
import { WeightDialCircle } from './WeightDialCircle';

interface CombinedHeightWeightProps {
  heightCm: number;
  weightKg: number;
  onUpdateHeight: (heightCm: number) => void;
  onUpdateWeight: (weightKg: number) => void;
}

export const CombinedHeightWeight: React.FC<CombinedHeightWeightProps> = ({
  heightCm,
  weightKg,
  onUpdateHeight,
  onUpdateWeight,
}) => {
  return (
    <div className="w-full flex flex-col items-start select-none pt-0.5 pb-1">
      {/* 1. PRIMARY TITLE: HOW TALL ARE YOU? (LEFT ALIGNED) */}
      <h2 className="text-[24px] sm:text-[28px] font-black text-[#251436] tracking-tight leading-tight text-left mb-1">
        How tall are you?
      </h2>

      {/* 2. HEIGHT VALUE & INTERACTIVE RULER */}
      <div className="w-full flex flex-col items-start">
        <HorizontalHeightPicker
          value={heightCm || 171}
          onChange={onUpdateHeight}
          min={140}
          max={210}
        />
      </div>

      {/* 3. SECTION 2 TITLE: AND YOUR WEIGHT? (LEFT ALIGNED) */}
      <h2 className="text-[24px] sm:text-[28px] font-black text-[#251436] tracking-tight leading-tight text-left mt-2.5 sm:mt-3.5 mb-1 sm:mb-1.5">
        And your weight?
      </h2>

      {/* 4. HERO CIRCULAR WEIGHT METER & CONTROLS */}
      <div className="w-full flex flex-col items-center">
        <WeightDialCircle
          value={weightKg >= 0 ? weightKg : 0}
          onChange={onUpdateWeight}
          min={0}
          max={90}
        />
      </div>
    </div>
  );
};
