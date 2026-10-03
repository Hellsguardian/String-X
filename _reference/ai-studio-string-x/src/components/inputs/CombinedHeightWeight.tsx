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
    <div className="w-full h-full flex-1 flex flex-col justify-between items-center select-none min-h-0 max-w-[380px] mx-auto page-height-weight gap-[clamp(6px,1.4dvh,16px)]">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. HEIGHT CONTAINER — APPROXIMATELY 35% OF CONTENT
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="w-full flex flex-col min-h-0 relative height-section"
        style={{
          flex: '35 35 0%',
          minHeight: 0,
        }}
      >
        {/* A. Heading: Anchored Top-Left with responsive typography */}
        <h2 className="text-[clamp(19px,2.6dvh,25px)] font-black text-[#251436] tracking-tight leading-tight text-left shrink-0 mb-1 height-heading">
          How tall are you?
        </h2>

        {/* B. Height input UI: Centered horizontally and vertically in remaining area */}
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center height-input-area">
          <HorizontalHeightPicker
            value={heightCm || 171}
            onChange={onUpdateHeight}
            min={140}
            max={210}
          />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. WEIGHT CONTAINER — APPROXIMATELY 65% OF CONTENT
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="w-full flex flex-col min-h-0 relative weight-section"
        style={{
          flex: '65 65 0%',
          minHeight: 0,
        }}
      >
        {/* Heading: Anchored Top-Left with responsive typography */}
        <h2 className="text-[clamp(19px,2.6dvh,25px)] font-black text-[#251436] tracking-tight leading-tight text-left shrink-0 mb-1 weight-heading">
          And your weight?
        </h2>

        {/* Meter (centered in flex: 1) + Controls (anchored at bottom) */}
        <div className="flex-1 min-h-0 w-full flex flex-col">
          <WeightDialCircle
            value={weightKg >= 0 ? weightKg : 0}
            onChange={onUpdateWeight}
            min={0}
            max={90}
          />
        </div>
      </section>
    </div>
  );
};
