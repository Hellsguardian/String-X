import React, { useRef, useState, useCallback } from 'react';

interface ExcitementSliderProps {
  value?: number;
  onChange: (value: number) => void;
}

export const ExcitementSlider: React.FC<ExcitementSliderProps> = ({
  value = 50,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Clamp value strictly between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, Math.round(value)));

  const updateFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawPercent = ((clientX - rect.left) / rect.width) * 100;
      const nextValue = Math.max(0, Math.min(100, Math.round(rawPercent)));
      onChange(nextValue);
    },
    [onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer was already released
      }
    }
  };

  // Exact requested status messages based on slider value ranges:
  // 0–20%    → Not really feeling it 😅
  // 21–40%   → Curious to see the crowd 👀
  // 41–60%   → Ready to vibe with campus! ✨
  // 61–80%   → Definitely joining the energy 🔥
  // 81–100%  → Can't wait! 🪩
  const getExcitementText = (val: number) => {
    if (val <= 20) return 'Not really feeling it 😅';
    if (val <= 40) return 'Curious to see the crowd 👀';
    if (val <= 60) return 'Ready to vibe with campus! ✨';
    if (val <= 80) return 'Definitely joining the energy 🔥';
    return "Can't wait! 🪩";
  };

  return (
    <div className="w-full select-none flex flex-col items-center">
      {/* 
        Fixed Reserved-Height Section for Percentage + Status Pill:
        Keeps vertical dimensions 100% structurally locked regardless of 0%, 9%, 32%, 49%, 100%
      */}
      <div className="w-full flex flex-col items-center justify-center shrink-0 h-[124px] sm:h-[136px] my-2 sm:my-3">
        {/* Large Percentage Value with % symbol attached and centered */}
        <div className="h-[72px] sm:h-[80px] flex items-center justify-center shrink-0">
          <div className="inline-flex items-baseline justify-center tracking-tight font-black tabular-nums text-[#251436]">
            <span className="text-6xl sm:text-7xl leading-none inline-block text-right">
              {clampedValue}
            </span>
            <span className="text-3xl sm:text-4xl text-[#894EFF] font-black leading-none ml-1">
              %
            </span>
          </div>
        </div>

        {/* Status Pill in a Fixed Reserved-Height Area so changing text never moves anything */}
        <div className="h-[36px] sm:h-[40px] flex items-center justify-center w-full px-2 shrink-0 mt-1 sm:mt-1.5">
          <div className="px-4 py-1.5 rounded-full bg-white border-2 border-[#251436] shadow-[2px_2px_0px_#251436] text-xs sm:text-sm font-extrabold text-[#251436] whitespace-nowrap text-center select-none">
            {getExcitementText(clampedValue)}
          </div>
        </div>
      </div>

      {/* Slider Container with Structurally Locked Vertical Position */}
      <div className="w-full px-2 sm:px-4 shrink-0">
        {/* Interactive Track Area */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative h-12 w-full flex items-center cursor-pointer touch-none select-none"
        >
          {/* Background Track */}
          <div className="w-full h-4 rounded-full bg-white border-2 border-[#251436] shadow-[2.5px_2.5px_0px_#251436] overflow-hidden relative">
            {/* Filled Progress Bar */}
            <div
              className="h-full bg-gradient-to-r from-[#894EFF] to-[#F02A8A] rounded-full"
              style={{ width: `${clampedValue}%` }}
            />
          </div>

          {/* Draggable Circular Thumb (moves horizontally only) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
            style={{ left: `${clampedValue}%` }}
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFC928] border-3 border-[#251436] flex items-center justify-center relative cursor-grab active:cursor-grabbing transition-transform duration-75 ${
                isDragging
                  ? 'scale-110 shadow-[4px_4px_0px_#251436]'
                  : 'shadow-[3px_3px_0px_#251436]'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#251436]" />
            </div>
          </div>
        </div>

        {/* Descriptive Endpoints with Fixed Height */}
        <div className="h-6 flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#251436]/75 mt-1 px-1">
          <span>Not excited</span>
          <span>Can't wait! 🔥</span>
        </div>
      </div>
    </div>
  );
};
