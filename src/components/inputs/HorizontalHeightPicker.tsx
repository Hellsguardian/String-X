import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';

interface HorizontalHeightPickerProps {
  value: number; // in cm (e.g. 171)
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export const HorizontalHeightPicker: React.FC<HorizontalHeightPickerProps> = ({
  value,
  onChange,
  min = 140,
  max = 210,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down'>('up');
  const prevValRef = useRef(value);

  // Dragging and inertia physics refs
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const hasMovedRef = useRef(false);
  const velocityHistory = useRef<{ x: number; time: number }[]>([]);
  const inertiaAnimRef = useRef<number | null>(null);
  const snapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Height conversion to feet & inches
  const totalInches = Math.round(value / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  // Spacing in pixels per 1 cm for a tactile, perfectly proportioned physical ruler
  const PIXELS_PER_CM = 36;

  // Generate range of heights
  const heights = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  // Direction detection for number slide transition above
  useEffect(() => {
    if (value > prevValRef.current) {
      setSlideDirection('up');
    } else if (value < prevValRef.current) {
      setSlideDirection('down');
    }
    prevValRef.current = value;
  }, [value]);

  const triggerHaptic = (ms = 4) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  };

  const stopInertia = () => {
    if (inertiaAnimRef.current !== null) {
      cancelAnimationFrame(inertiaAnimRef.current);
      inertiaAnimRef.current = null;
    }
  };

  // Scroll/center smoothly to target value
  const scrollToValue = useCallback(
    (targetVal: number, smooth = true) => {
      if (!containerRef.current) return;
      const targetIndex = targetVal - min;
      const scrollPosition = targetIndex * PIXELS_PER_CM;
      containerRef.current.scrollTo({
        left: scrollPosition,
        behavior: smooth ? 'smooth' : 'auto',
      });
    },
    [min, PIXELS_PER_CM]
  );

  // Initial scroll to value
  useEffect(() => {
    scrollToValue(value, false);
  }, []);

  // Sync scroll if value changed externally and user is not actively dragging
  useEffect(() => {
    if (!isDragging && containerRef.current) {
      const currentScroll = containerRef.current.scrollLeft;
      const targetScroll = (value - min) * PIXELS_PER_CM;
      if (Math.abs(currentScroll - targetScroll) > PIXELS_PER_CM * 0.7) {
        scrollToValue(value, true);
      }
    }
  }, [value, isDragging, min, scrollToValue, PIXELS_PER_CM]);

  // Clean up animations and timers on unmount
  useEffect(() => {
    return () => {
      stopInertia();
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    };
  }, []);

  // Continuous scroll handler (fires on finger swipes, trackpad flicks, and pointer drags)
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;
    const calculatedIndex = Math.round(scrollLeft / PIXELS_PER_CM);
    const clampedIndex = Math.max(0, Math.min(max - min, calculatedIndex));
    const snappedValue = min + clampedIndex;

    if (snappedValue !== value) {
      onChange(snappedValue);
      setHasInteracted(true);
      triggerHaptic(4);
    }

    // Gentle magnetic snap settling (debounced when user stops scrolling)
    if (!isDragging) {
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      snapTimerRef.current = setTimeout(() => {
        if (!containerRef.current) return;
        const finalTarget = clampedIndex * PIXELS_PER_CM;
        if (Math.abs(containerRef.current.scrollLeft - finalTarget) > 1) {
          containerRef.current.scrollTo({
            left: finalTarget,
            behavior: 'smooth',
          });
        }
      }, 90);
    }
  };

  // Pointer Down: user touches or clicks anywhere on the ruler surface
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    stopInertia();
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);

    setIsDragging(true);
    setHasInteracted(true);
    hasMovedRef.current = false;
    dragStartX.current = e.clientX;
    dragStartScrollLeft.current = containerRef.current?.scrollLeft || 0;

    velocityHistory.current = [{ x: e.clientX, time: performance.now() }];

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Pointer Move: direct 1:1 scroll manipulation across the entire ruler
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const deltaX = e.clientX - dragStartX.current;
    if (Math.abs(deltaX) > 2) {
      hasMovedRef.current = true;
    }

    // Swiping left moves higher values into the center; swiping right moves lower values into center
    containerRef.current.scrollLeft = dragStartScrollLeft.current - deltaX;

    const now = performance.now();
    velocityHistory.current.push({ x: e.clientX, time: now });
    if (velocityHistory.current.length > 5) {
      velocityHistory.current.shift();
    }
  };

  // Pointer Up / Cancel: handle release with momentum inertia & settling
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    // Calculate release velocity from recent pointer positions
    let releaseVelocity = 0;
    const history = velocityHistory.current;
    if (history.length >= 2) {
      const latest = history[history.length - 1];
      const earliest = history[0];
      const dt = latest.time - earliest.time;
      if (dt > 12 && dt < 240) {
        releaseVelocity = (latest.x - earliest.x) / dt; // px per ms
      }
    }
    velocityHistory.current = [];

    // Fast flick: apply momentum glide
    if (Math.abs(releaseVelocity) > 0.22) {
      let currentVelocity = -releaseVelocity * 17;
      const friction = 0.92;

      const runInertia = () => {
        if (!containerRef.current) return;

        if (Math.abs(currentVelocity) > 0.5) {
          containerRef.current.scrollLeft += currentVelocity;
          currentVelocity *= friction;
          inertiaAnimRef.current = requestAnimationFrame(runInertia);
        } else {
          // Settles cleanly on the nearest whole centimeter
          const targetIndex = Math.round(containerRef.current.scrollLeft / PIXELS_PER_CM);
          const clampedIndex = Math.max(0, Math.min(max - min, targetIndex));
          containerRef.current.scrollTo({
            left: clampedIndex * PIXELS_PER_CM,
            behavior: 'smooth',
          });
          inertiaAnimRef.current = null;
        }
      };

      inertiaAnimRef.current = requestAnimationFrame(runInertia);
    } else {
      // Slow release: settle smoothly onto nearest centimeter
      if (containerRef.current) {
        const targetIndex = Math.round(containerRef.current.scrollLeft / PIXELS_PER_CM);
        const clampedIndex = Math.max(0, Math.min(max - min, targetIndex));
        containerRef.current.scrollTo({
          left: clampedIndex * PIXELS_PER_CM,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-start select-none">
      {/* 1. HERO HEIGHT VALUE DISPLAY (Left-aligned) */}
      <div className="w-full flex items-baseline justify-start gap-2 mb-2 select-none">
        <motion.span
          key={value}
          initial={{
            scale: 0.94,
            y: slideDirection === 'up' ? 3 : -3,
            opacity: 0.8,
          }}
          animate={{
            scale: 1,
            y: 0,
            opacity: 1,
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="text-[44px] sm:text-[48px] font-black text-[#251436] tracking-tight leading-none"
        >
          {value}
        </motion.span>
        <span className="text-2xl font-black text-[#894EFF] leading-none">
          cm
        </span>
        <span className="text-sm font-bold text-[#251436]/50 ml-1 leading-none">
          ({feet}'{inches}")
        </span>
      </div>

      {/* 2. THE ENTIRE RULER (Scrollable Picker with Soft Central Focus Window) */}
      <div className="w-full flex justify-center">
        <div
          id="height-ruler-interactive-surface"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-full max-w-[340px] sm:max-w-[360px] h-18 sm:h-20 bg-[#FFFFFF] border-3 border-[#251436] rounded-2xl shadow-[4px_4px_0px_#251436] overflow-hidden flex items-center cursor-grab active:cursor-grabbing transition-shadow duration-150 ${
            isDragging ? 'shadow-[2px_2px_0px_#251436] bg-[#FAF8FE]' : 'hover:border-[#894EFF]/80'
          }`}
        >
          {/* Soft inner physical depth shadow */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_rgba(37,20,54,0.06)] rounded-2xl z-20" />

          {/* Subtle Horizontal Baseline connecting the ticks */}
          <div className="absolute left-0 right-0 bottom-4 h-[1px] bg-[#251436]/10 pointer-events-none z-0" />

          {/* 
            SOFT CENTRAL SELECTION WINDOW:
            - Very light translucent lavender/purple background
            - Thin Electric Purple outline
            - Rounded corners
            - Subtle glow & depth
            - NO vertical blue/purple line through the number!
            - pointer-events-none so touches go straight to the ruler surface
          */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 top-1.5 bottom-1.5 w-13 sm:w-15 pointer-events-none rounded-xl border-2 border-[#894EFF] bg-[#894EFF]/12 shadow-[0_0_14px_rgba(137,78,255,0.24)] z-10 transition-transform duration-150 ${
              isDragging ? 'scale-105 bg-[#894EFF]/18 shadow-[0_0_20px_rgba(137,78,255,0.38)]' : 'scale-100'
            }`}
          />

          {/* Edge Gradient Depth Masks for smooth peripheral fade */}
          <div className="absolute top-0 bottom-0 left-0 w-14 sm:w-16 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-20" />
          <div className="absolute top-0 bottom-0 right-0 w-14 sm:w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-20" />

          {/* 
            RULER SCROLL TRACK:
            - Entire ruler physically moves and scrolls
            - no-scrollbar utility completely removes any native scrollbar thumb
            - scrollSnapType for natural mobile gesture snap
          */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-x-auto no-scrollbar flex items-center touch-pan-x"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollSnapType: isDragging ? 'none' : 'x mandatory',
              paddingLeft: `calc(50% - ${PIXELS_PER_CM / 2}px)`,
              paddingRight: `calc(50% - ${PIXELS_PER_CM / 2}px)`,
            }}
          >
            {heights.map((cm) => {
              const isSelected = cm === value;
              const diff = Math.abs(cm - value);
              const isMajor = cm % 5 === 0;

              return (
                <div
                  key={cm}
                  onClick={() => {
                    if (hasMovedRef.current) return;
                    onChange(cm);
                    setHasInteracted(true);
                    scrollToValue(cm, true);
                    triggerHaptic(6);
                  }}
                  style={{
                    width: `${PIXELS_PER_CM}px`,
                    scrollSnapAlign: 'center',
                  }}
                  className="flex-shrink-0 flex flex-col items-center justify-between cursor-pointer select-none pt-2.5 pb-3.5 h-full"
                  title={`${cm} cm`}
                >
                  {/* 
                    NUMBER LABEL:
                    - Center selected number is larger, darker Deep Plum, and perfectly centered
                    - Neighbors gradually fade with clear depth hierarchy
                  */}
                  <span
                    className={`leading-none select-none transition-all duration-150 ${
                      isSelected
                        ? 'text-lg sm:text-xl font-black text-[#251436] scale-110 tracking-tight'
                        : diff === 1
                        ? 'text-xs sm:text-[13px] font-bold text-[#251436]/70 scale-100'
                        : diff === 2
                        ? 'text-[11px] font-semibold text-[#251436]/40'
                        : diff === 3
                        ? 'text-[10px] font-medium text-[#251436]/25'
                        : isMajor
                        ? 'text-[10px] font-semibold text-[#251436]/20'
                        : 'opacity-0'
                    }`}
                  >
                    {cm}
                  </span>

                  {/* 
                    TICK MARK SYSTEM:
                    - Center tick: subtle Electric Purple accent pip (NOT a line through the number!)
                    - Major 5cm: longer tick
                    - Intermediate: smaller tick
                  */}
                  <div
                    className={`rounded-full transition-all duration-150 ${
                      isSelected
                        ? 'h-3 w-1 bg-[#894EFF] shadow-[0px_0px_4px_#894EFF]'
                        : diff === 1
                        ? 'h-4.5 w-0.5 bg-[#251436]/45'
                        : diff === 2
                        ? 'h-3.5 w-0.5 bg-[#251436]/30'
                        : isMajor
                        ? 'h-3 w-0.5 bg-[#251436]/25'
                        : 'h-2 w-0.5 bg-[#251436]/15'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. PLAYFUL TRANSITION HINT (↔ Swipe to choose) */}
      <div className="w-full flex items-center justify-center gap-1.5 mt-2 select-none">
        <span className="text-xs font-black text-[#894EFF]">↔</span>
        <span className="text-[11px] font-bold text-[#251436]/65 tracking-tight">
          Swipe to choose
        </span>
      </div>
    </div>
  );
};
