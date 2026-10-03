import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';

interface AgeSelectorProps {
  value?: number; // Selected birth year (e.g. 2006)
  onChange: (birthYear: number) => void;
  min?: number;
  max?: number;
}

const MIN_YEAR = 1996;
const MAX_YEAR = 2010;
const DEFAULT_CENTER_YEAR = 2004;
const ITEM_HEIGHT = 54; // px per year row
const VISIBLE_ITEMS = 5; // 2 above, 1 selected, 2 below
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 270px
const PADDING_Y = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 108px
const QUICK_YEARS = [2003, 2004, 2005, 2006, 2007];

export const AgeSelector: React.FC<AgeSelectorProps> = ({
  value,
  onChange,
  min = MIN_YEAR,
  max = MAX_YEAR,
}) => {
  const currentYear = new Date().getFullYear();
  const hasSelected = typeof value === 'number' && value >= min && value <= max;
  const currentDisplayYear = hasSelected ? value : DEFAULT_CENTER_YEAR;
  const calculatedAge = hasSelected ? currentYear - value : null;

  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mouse drag state for desktop preview
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);

  // Generate birth years strictly from 1996 to 2010
  const years: number[] = [];
  for (let y = min; y <= max; y++) {
    years.push(y);
  }

  // Scroll to a specific birth year
  const scrollToYear = useCallback((targetYear: number, smooth = true) => {
    if (!containerRef.current) return;
    const targetIndex = targetYear - min;
    const targetScrollTop = targetIndex * ITEM_HEIGHT;

    isProgrammaticScroll.current = true;
    containerRef.current.scrollTo({
      top: targetScrollTop,
      behavior: smooth ? 'smooth' : 'auto',
    });

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 350);
  }, [min]);

  // Sync scroll position when prop changes externally
  useEffect(() => {
    if (!isDragging && hasSelected) {
      scrollToYear(value, true);
    }
  }, [value, hasSelected, scrollToYear, isDragging]);

  // Initial centering on mount (does not fire onChange so user must explicitly choose)
  useEffect(() => {
    const targetYear = hasSelected ? value : DEFAULT_CENTER_YEAR;
    isProgrammaticScroll.current = true;
    const timer = setTimeout(() => {
      scrollToYear(targetYear, false);
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 100);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll events with snapping detection
  const handleScroll = () => {
    if (!containerRef.current || isProgrammaticScroll.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const computedIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const computedYear = Math.min(Math.max(min + computedIndex, min), max);

    if (computedYear !== value) {
      onChange(computedYear);
    }

    // Debounced snap check to ensure clean center resting
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      if (!isDragging && containerRef.current) {
        const finalScroll = (computedYear - min) * ITEM_HEIGHT;
        if (Math.abs(containerRef.current.scrollTop - finalScroll) > 2) {
          containerRef.current.scrollTo({
            top: finalScroll,
            behavior: 'smooth',
          });
        }
      }
    }, 120);
  };

  // Tap a year to center and select it
  const handleSelectYear = (year: number) => {
    onChange(year);
    scrollToYear(year, true);
  };

  // Desktop mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = containerRef.current.scrollTop;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const deltaY = e.clientY - dragStartY.current;
    containerRef.current.scrollTop = dragStartScrollTop.current - deltaY;
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (containerRef.current) {
      const computedIndex = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);
      const computedYear = Math.min(Math.max(min + computedIndex, min), max);
      onChange(computedYear);
      scrollToYear(computedYear, true);
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none pt-1 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Large Dynamic Age Display (Derived from selected Birth Year) + Badge */}
      <div className="flex flex-col items-center justify-center mb-3">
        <div className="flex items-baseline justify-center gap-2">
          <motion.span
            key={calculatedAge !== null ? calculatedAge : 'unselected'}
            initial={{ scale: 0.88, y: -4, opacity: 0.8 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="text-6xl font-black text-[#251436] tracking-tight"
          >
            {calculatedAge !== null ? calculatedAge : '—'}
          </motion.span>
          <span className="text-2xl font-black text-[#894EFF] tracking-tight">
            yrs
          </span>
        </div>

        {/* LOCKED IN 🔒 Badge */}
        <div
          id="age-locked-in-tag"
          className={`mt-1.5 px-3.5 py-1 bg-[#D4CEEF] border-2 border-[#251436] rounded-full text-xs font-black text-[#251436] shadow-[2px_2px_0px_#251436] tracking-wide select-none transition-opacity duration-150 ${
            hasSelected ? 'opacity-100' : 'opacity-70'
          }`}
        >
          LOCKED IN 🔒
        </div>
      </div>

      {/* 2. Vertical Wheel / Roller Birth Year Picker (1996 → 2010) */}
      <div className="relative w-full max-w-[280px] flex items-center justify-center my-1">
        {/* Background Highlight Capsule for Selected Birth Year */}
        <div
          style={{
            top: `${PADDING_Y}px`,
            height: `${ITEM_HEIGHT}px`,
          }}
          className="absolute left-4 right-4 bg-white border-3 border-[#251436] rounded-2xl shadow-[3px_3px_0px_#251436] pointer-events-none z-0 flex items-center justify-between px-3"
        >
          {/* Subtle Electric Purple accent indicator bars */}
          <span className="w-1.5 h-6 rounded-full bg-[#894EFF]" />
          <span className="w-1.5 h-6 rounded-full bg-[#894EFF]" />
        </div>

        {/* Top Gradient Fade Overlay */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#E8E5F6] via-[#E8E5F6]/80 to-transparent pointer-events-none z-20 rounded-t-2xl" />

        {/* Bottom Gradient Fade Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#E8E5F6] via-[#E8E5F6]/80 to-transparent pointer-events-none z-20 rounded-b-2xl" />

        {/* Scrollable Roller Container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          style={{
            height: `${CONTAINER_HEIGHT}px`,
            paddingTop: `${PADDING_Y}px`,
            paddingBottom: `${PADDING_Y}px`,
          }}
          className={`w-full overflow-y-auto snap-y snap-mandatory scrollbar-none z-10 overscroll-contain cursor-grab ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
        >
          {years.map((year) => {
            const isSelected = hasSelected && year === value;
            const distance = Math.abs(year - currentDisplayYear);

            // Compute depth effect styling based on distance from center
            let typographyClass = 'text-base font-semibold text-[#251436]/30';
            let scaleClass = 'scale-90';

            if (distance === 0) {
              typographyClass = isSelected || !hasSelected
                ? 'text-3xl font-black text-[#251436]'
                : 'text-2xl font-bold text-[#251436]';
              scaleClass = 'scale-110';
            } else if (distance === 1) {
              typographyClass = 'text-xl font-bold text-[#251436]/65';
              scaleClass = 'scale-95';
            } else if (distance === 2) {
              typographyClass = 'text-base font-semibold text-[#251436]/40';
              scaleClass = 'scale-85';
            }

            return (
              <div
                key={year}
                style={{ height: `${ITEM_HEIGHT}px` }}
                onClick={() => handleSelectYear(year)}
                className="snap-center w-full flex items-center justify-center cursor-pointer transition-all duration-150"
              >
                <div
                  className={`flex items-center justify-center transition-transform duration-150 ${scaleClass}`}
                >
                  <span className={`tracking-tight select-none ${typographyClass}`}>
                    {year}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Quick-Tap Common Birth Years (2003 → 2007) */}
      <div className="w-full max-w-[320px] mt-2 flex flex-col items-center">
        <div className="text-[10px] font-bold tracking-wider text-[#251436]/50 uppercase mb-1.5">
          QUICK PICK
        </div>
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {QUICK_YEARS.map((quickYear) => {
            const isQuickSelected = quickYear === value;
            return (
              <button
                key={quickYear}
                type="button"
                onClick={() => handleSelectYear(quickYear)}
                className={`min-w-[48px] px-2.5 h-8 rounded-xl font-extrabold text-xs transition-all duration-150 flex items-center justify-center cursor-pointer border ${
                  isQuickSelected
                    ? 'bg-[#894EFF] text-white border-[#251436] shadow-[2px_2px_0px_#251436] -translate-y-0.5'
                    : 'bg-white/80 text-[#251436]/75 border-[#251436]/30 hover:border-[#251436] hover:bg-white active:scale-95'
                }`}
              >
                {quickYear}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
