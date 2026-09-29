import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Minus, Plus } from 'lucide-react';

interface HeightRulerProps {
  value: number; // in cm (e.g. 168)
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

const MIN_HEIGHT = 145;
const MAX_HEIGHT = 205;
const ITEM_HEIGHT = 42; // px per row
const VISIBLE_ITEMS = 5; // 2 above, 1 selected, 2 below
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 210px
const PADDING_Y = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 84px

/**
 * Completely gender-neutral StringX illustrated human.
 * Represents "a person" without gender-coded features:
 * - Simple unisex textured crop hairstyle
 * - Neutral facial expression (friendly smile, clean eyes)
 * - Relaxed oversized hoodie with front kangaroo pocket
 * - Straight-leg casual pants and clean sneakers
 * - Zero measurement lines or text on the illustration
 */
const NeutralHumanCharacter: React.FC<{ bounceKey: number }> = ({ bounceKey }) => {
  return (
    <motion.div
      key={bounceKey}
      initial={{ scale: 0.97, y: -2 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 450, damping: 24 }}
      className="relative flex flex-col items-center select-none"
    >
      <svg
        width="100"
        height="195"
        viewBox="0 0 100 195"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[100px] h-auto drop-shadow-sm"
      >
        {/* Soft ground shadow */}
        <ellipse cx="50" cy="189" rx="38" ry="5.5" fill="#D4CEEF" />

        {/* --- LEGS & PANTS (Straight-leg unisex casual trousers in Deep Plum) --- */}
        {/* Left Leg */}
        <path
          d="M38 108 L35 168 L46 168 L48 108 Z"
          fill="#251436"
          stroke="#251436"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Right Leg */}
        <path
          d="M52 108 L54 168 L65 168 L62 108 Z"
          fill="#251436"
          stroke="#251436"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Subtle trouser inseam / cuffs */}
        <line x1="35" y1="165" x2="46" y2="165" stroke="#3D2357" strokeWidth="1.5" />
        <line x1="54" y1="165" x2="65" y2="165" stroke="#3D2357" strokeWidth="1.5" />

        {/* --- SNEAKERS (Clean unisex sneakers) --- */}
        {/* Left Sneaker */}
        <path
          d="M30 178 C30 171 35 168 40 168 L47 168 L47 178 L30 178 Z"
          fill="#FFFFFF"
          stroke="#251436"
          strokeWidth="1.8"
        />
        <rect x="28" y="178" width="20" height="7" rx="2.5" fill="#FFFFFF" stroke="#251436" strokeWidth="1.8" />
        {/* Accent strip on sneaker */}
        <path d="M35 174 L42 174" stroke="#894EFF" strokeWidth="2" strokeLinecap="round" />

        {/* Right Sneaker */}
        <path
          d="M53 168 L60 168 C65 168 70 171 70 178 L53 178 L53 168 Z"
          fill="#FFFFFF"
          stroke="#251436"
          strokeWidth="1.8"
        />
        <rect x="52" y="178" width="20" height="7" rx="2.5" fill="#FFFFFF" stroke="#251436" strokeWidth="1.8" />
        <path d="M58 174 L65 174" stroke="#894EFF" strokeWidth="2" strokeLinecap="round" />

        {/* --- TORSO & OVERSIZED HOODIE --- */}
        {/* Main Hoodie Body (Electric Purple #894EFF) */}
        <path
          d="M26 58 L74 58 L71 112 L29 112 Z"
          fill="#894EFF"
          stroke="#251436"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Front Kangaroo Pouch Pocket */}
        <path
          d="M34 84 L66 84 L63 106 L37 106 Z"
          fill="#783EE8"
          stroke="#251436"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Small Teal Tag on Pocket */}
        <rect x="36" y="87" width="5" height="3" rx="1" fill="#08A98D" />

        {/* Relaxed Left Arm / Sleeve with hand in pocket */}
        <path
          d="M26 60 L18 86 L28 92 L34 76 Z"
          fill="#894EFF"
          stroke="#251436"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Relaxed Right Arm / Sleeve with hand in pocket */}
        <path
          d="M74 60 L82 86 L72 92 L66 76 Z"
          fill="#894EFF"
          stroke="#251436"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Hoodie Neckband / Collar */}
        <path
          d="M40 56 Q50 63 60 56 Q50 51 40 56 Z"
          fill="#F8F7FD"
          stroke="#251436"
          strokeWidth="1.5"
        />
        {/* Hoodie Drawstrings */}
        <line x1="46" y1="60" x2="45" y2="73" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="45" cy="74" r="1.5" fill="#FFC928" />
        <line x1="54" y1="60" x2="55" y2="73" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="55" cy="74" r="1.5" fill="#FFC928" />

        {/* --- NECK & HEAD --- */}
        <rect x="45" y="47" width="10" height="11" rx="2" fill="#F3C99F" stroke="#251436" strokeWidth="1.5" />

        {/* Face (Neutral warm tone) */}
        <ellipse cx="50" cy="36" rx="14" ry="15" fill="#F3C99F" stroke="#251436" strokeWidth="1.8" />

        {/* Neutral friendly eyes */}
        <ellipse cx="44" cy="34" rx="1.8" ry="2.2" fill="#251436" />
        <circle cx="44.6" cy="33.3" r="0.6" fill="#FFFFFF" />
        <ellipse cx="56" cy="34" rx="1.8" ry="2.2" fill="#251436" />
        <circle cx="56.6" cy="33.3" r="0.6" fill="#FFFFFF" />

        {/* Soft, neutral eyebrows */}
        <path d="M41 29 Q44 28 47 29" stroke="#251436" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M53 29 Q56 28 59 29" stroke="#251436" strokeWidth="1.4" strokeLinecap="round" />

        {/* Simple cute nose */}
        <path d="M50 36 L49 39 L51 39" stroke="#DCA276" strokeWidth="1.4" strokeLinecap="round" />

        {/* Warm relaxed smile */}
        <path d="M45 42 Q50 46 55 42" stroke="#251436" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Unisex Modern Shaggy Textured Hair (Deep Plum #251436) */}
        <path
          d="M36 32 C35 22 41 15 50 15 C59 15 65 22 64 32 C62 26 57 23 50 23 C43 23 38 26 36 32 Z"
          fill="#251436"
        />
        {/* Soft hair strands on forehead */}
        <path
          d="M37 28 C41 24 45 27 50 25 C54 27 59 24 63 28 C61 24 55 20 50 20 C45 20 39 24 37 28 Z"
          fill="#251436"
        />
        {/* Subtle unisex hair texture highlights */}
        <path d="M44 19 Q48 16 52 17" stroke="#3D2357" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
};

export const HeightRuler: React.FC<HeightRulerProps> = ({
  value,
  onChange,
  min = MIN_HEIGHT,
  max = MAX_HEIGHT,
}) => {
  // Clamp value strictly within configured bounds
  const currentHeight = Math.min(Math.max(value || 168, min), max);

  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mouse drag state for desktop interaction
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);

  // Interval timer for +/- continuous hold
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Compute imperial conversion: feet & inches
  const totalInches = Math.round(currentHeight / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  // Generate valid heights strictly from min to max (145..205)
  const heights: number[] = [];
  for (let h = min; h <= max; h++) {
    heights.push(h);
  }

  // Scroll to a specific height value
  const scrollToHeight = useCallback(
    (targetHeight: number, smooth = true) => {
      if (!containerRef.current) return;
      const targetIndex = targetHeight - min;
      const targetScrollTop = targetIndex * ITEM_HEIGHT;

      isProgrammaticScroll.current = true;
      containerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: smooth ? 'smooth' : 'auto',
      });

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 250);
    },
    [min]
  );

  // Sync scroll position when prop changes externally
  useEffect(() => {
    if (!isDragging) {
      scrollToHeight(currentHeight, true);
    }
  }, [currentHeight, scrollToHeight, isDragging]);

  // Initial centering on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToHeight(currentHeight, false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll events with snapping detection
  const handleScroll = () => {
    if (!containerRef.current || isProgrammaticScroll.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const computedIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const computedHeight = Math.min(Math.max(min + computedIndex, min), max);

    if (computedHeight !== currentHeight) {
      onChange(computedHeight);
    }

    // Debounced snap check to ensure clean center resting
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      if (!isDragging && containerRef.current) {
        const finalScroll = (computedHeight - min) * ITEM_HEIGHT;
        if (Math.abs(containerRef.current.scrollTop - finalScroll) > 1.5) {
          containerRef.current.scrollTo({
            top: finalScroll,
            behavior: 'smooth',
          });
        }
      }
    }, 120);
  };

  // Direct tap to select any visible height value
  const handleSelectHeight = (h: number) => {
    onChange(h);
    scrollToHeight(h, true);
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
      const computedHeight = Math.min(Math.max(min + computedIndex, min), max);
      onChange(computedHeight);
      scrollToHeight(computedHeight, true);
    }
  };

  // Button +/- handlers with hold support
  const stepHeight = (delta: number) => {
    const nextVal = Math.min(max, Math.max(min, currentHeight + delta));
    onChange(nextVal);
  };

  const startHold = (delta: number) => {
    stepHeight(delta);
    holdTimerRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        stepHeight(delta);
      }, 70);
    }, 300);
  };

  const endHold = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
  };

  return (
    <div className="w-full flex flex-col items-center select-none pt-1">
      {/* 1. Large Synchronized Height Display */}
      <div className="flex flex-col items-center justify-center mb-3">
        <div className="flex items-baseline justify-center gap-1.5">
          <motion.span
            key={currentHeight}
            initial={{ scale: 0.92, y: -3, opacity: 0.85 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className="text-6xl font-black text-[#251436] tracking-tight"
          >
            {currentHeight}
          </motion.span>
          <span className="text-2xl font-black text-[#894EFF] tracking-tight">
            cm
          </span>
        </div>

        {/* Secondary Feet & Inches Display */}
        <span className="text-sm font-extrabold text-[#251436]/60 mt-0.5">
          {feet}&apos;{inches}&quot;
        </span>
      </div>

      {/* 2. Balanced Character + Vertical Height Wheel Composition */}
      <div className="w-full max-w-[340px] flex items-center justify-center gap-6 my-1">
        {/* Gender-Neutral Character Companion (No measurement numbers, no lines through body) */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <NeutralHumanCharacter bounceKey={currentHeight} />
        </div>

        {/* Height Wheel + Secondary +/- Controls Column */}
        <div className="flex flex-col items-center">
          {/* Vertical Wheel Picker Frame (5 visible items, clean rounded box) */}
          <div className="relative w-36 h-[210px] bg-white rounded-2xl border-2 border-[#251436] shadow-[3px_3px_0px_#251436] overflow-hidden">
            {/* Center Selection Capsule (Visual Snapping Target) */}
            <div
              style={{
                top: `${PADDING_Y}px`,
                height: `${ITEM_HEIGHT}px`,
              }}
              className="absolute left-2 right-2 rounded-xl bg-[#894EFF]/10 border-2 border-[#894EFF] pointer-events-none z-0 flex items-center justify-between px-2"
            >
              <div className="w-1.5 h-4 rounded-full bg-[#894EFF]" />
              <div className="w-1.5 h-4 rounded-full bg-[#894EFF]" />
            </div>

            {/* Top Fade Gradient Mask */}
            <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-20" />

            {/* Bottom Fade Gradient Mask */}
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-20" />

            {/* Scrollable Heights Wheel */}
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
              {heights.map((h) => {
                const distance = Math.abs(h - currentHeight);

                let typographyClass = 'text-sm font-semibold text-[#251436]/25';
                let scaleClass = 'scale-85';

                if (distance === 0) {
                  typographyClass = 'text-2xl font-black text-[#251436]';
                  scaleClass = 'scale-110';
                } else if (distance === 1) {
                  typographyClass = 'text-lg font-bold text-[#251436]/60';
                  scaleClass = 'scale-95';
                } else if (distance === 2) {
                  typographyClass = 'text-sm font-semibold text-[#251436]/35';
                  scaleClass = 'scale-85';
                }

                return (
                  <div
                    key={h}
                    style={{ height: `${ITEM_HEIGHT}px` }}
                    onClick={() => handleSelectHeight(h)}
                    className="snap-center w-full flex items-center justify-center cursor-pointer transition-all duration-150"
                  >
                    <div
                      className={`flex items-center justify-center transition-transform duration-150 ${scaleClass}`}
                    >
                      <span className={`tracking-tight select-none ${typographyClass}`}>
                        {h}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Small Tactile Secondary [ - ] and [ + ] Controls (NO '1 CM' label) */}
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              id="height-decrease-btn"
              onPointerDown={() => startHold(-1)}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              className="w-11 h-9 bg-[#D4CEEF] border-2 border-[#251436] rounded-xl font-black text-lg text-[#251436] shadow-[2px_2px_0px_#251436] active:translate-y-0.5 active:shadow-none hover:bg-white transition-all flex items-center justify-center cursor-pointer"
              aria-label="Decrease height"
            >
              <Minus size={17} strokeWidth={3} />
            </button>

            <button
              type="button"
              id="height-increase-btn"
              onPointerDown={() => startHold(1)}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              className="w-11 h-9 bg-[#D4CEEF] border-2 border-[#251436] rounded-xl font-black text-lg text-[#251436] shadow-[2px_2px_0px_#251436] active:translate-y-0.5 active:shadow-none hover:bg-white transition-all flex items-center justify-center cursor-pointer"
              aria-label="Increase height"
            >
              <Plus size={17} strokeWidth={3} />
            </button>
          </div>

          {/* 4. Subtle Micro-Copy */}
          <span className="text-[11px] font-semibold text-[#251436]/50 mt-2">
            Swipe or tap to choose
          </span>
        </div>
      </div>
    </div>
  );
};
