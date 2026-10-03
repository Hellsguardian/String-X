import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Minus, Plus } from 'lucide-react';

interface WeightDialCircleProps {
  value: number; // in kg (0 - 90)
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export const WeightDialCircle: React.FC<WeightDialCircleProps> = ({
  value,
  onChange,
  min = 0,
  max = 90,
}) => {
  const dialRef = useRef<HTMLDivElement>(null);
  const meterContainerRef = useRef<HTMLDivElement>(null);
  const [meterSize, setMeterSize] = useState<number | null>(null);
  const [activeButton, setActiveButton] = useState<'plus' | 'minus' | null>(null);
  const [isInteractingDial, setIsInteractingDial] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // References for hold acceleration & dial rotation physics
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonHoldTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentValueRef = useRef<number>(value);
  const isDraggingDial = useRef(false);
  const lastAngleRef = useRef<number>(0);
  const dragAccumulatorRef = useRef<number>(0);
  const lastTouchPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Tap vs Drag detection for circular meter
  const [isTapPulsing, setIsTapPulsing] = useState(false);
  const tapPulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dialDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dialDownTimeRef = useRef<number>(0);
  const hasMovedDialRef = useRef<boolean>(false);
  const lastMeterTapHandledAtRef = useRef<number>(0);

  // Keep ref synchronized with prop
  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  // Dynamically calculate optimal meter size based on available container dimensions
  useEffect(() => {
    const updateSize = () => {
      if (!meterContainerRef.current) return;
      const { clientWidth, clientHeight } = meterContainerRef.current;
      if (!clientWidth || !clientHeight) return;

      // Available space with safe margins:
      // Leave at least 20px horizontal clearance and 16px vertical clearance from heading and controls
      const availableSpace = Math.min(clientWidth - 20, clientHeight - 16);

      // Dynamic responsiveness:
      // Minimum 168px (for very short screens) up to 268px (iPhone 14, iQOO Z5, taller devices)
      const targetSize = Math.max(168, Math.min(Math.floor(availableSpace), 268));
      setMeterSize(targetSize);
    };

    updateSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && meterContainerRef.current) {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(meterContainerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Safety: Ensure isDragging and isHolding clear if pointerup occurs outside component
  useEffect(() => {
    if (!isDragging) return;
    const handleGlobalPointerUp = () => {
      isDraggingDial.current = false;
      setIsDragging(false);
      setIsHolding(false);
      stopHold();
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [isDragging]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      stopHold();
      stopButtonHold();
      if (tapPulseTimerRef.current) clearTimeout(tapPulseTimerRef.current);
    };
  }, []);

  const triggerHaptic = (ms = 6) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  };

  const triggerTapPulse = () => {
    setIsTapPulsing(true);
    if (tapPulseTimerRef.current) clearTimeout(tapPulseTimerRef.current);
    tapPulseTimerRef.current = setTimeout(() => {
      setIsTapPulsing(false);
    }, 200);
  };

  // Step function with clamping between min and max kg
  const stepWeight = (delta: number) => {
    const nextVal = Math.max(min, Math.min(max, currentValueRef.current + delta));
    if (nextVal !== currentValueRef.current) {
      currentValueRef.current = nextVal;
      onChange(nextVal);
      triggerHaptic(5);
    }
    return nextVal;
  };

  /**
   * Weight progressive speed curves as specified:
   * 0 → 30 KG: very fast (40ms)
   * 30 → 40 KG: fast (65ms)
   * 40 → 50 KG: normal (95ms)
   * 50 → 60 KG: slower (130ms)
   * 60 → 70 KG: slower (160ms)
   * 70 → 100 KG: very slow (200ms)
   */
  const getHoldInterval = (val: number): number => {
    if (val < 30) return 40;
    if (val < 40) return 65;
    if (val < 50) return 95;
    if (val < 60) return 130;
    if (val < 70) return 160;
    return 200;
  };

  /**
   * Start button tap & press-and-hold interaction:
   * - SINGLE TAP: Immediate +1 kg (or -1 kg). When released before 340ms, timer never starts continuous hold.
   * - HOLD: Immediate +1 kg, then after 340ms continuous acceleration kicks in until released.
   */
  const startButtonHold = (delta: number, source: 'plus' | 'minus', e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    stopButtonHold();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    setActiveButton(source);
    // 1. Immediate step for tap responsiveness (0 -> 1 -> 2 -> 3...)
    stepWeight(delta);

    // 2. Schedule continuous hold acceleration only after 340ms of sustained press
    let holdCount = 0;
    buttonHoldTimeoutRef.current = setTimeout(() => {
      setIsHolding(true);
      const runTick = () => {
        if (delta > 0 && currentValueRef.current >= max) {
          stopButtonHold();
          return;
        }
        if (delta < 0 && currentValueRef.current <= min) {
          stopButtonHold();
          return;
        }

        stepWeight(delta);
        holdCount++;

        // Gradually accelerate rate based on weight range & hold duration
        const baseInterval = getHoldInterval(currentValueRef.current);
        const accelerationDiscount = Math.min(65, holdCount * 7);
        const nextInterval = Math.max(35, baseInterval - accelerationDiscount);

        buttonHoldTimerRef.current = setTimeout(runTick, nextInterval);
      };

      runTick();
    }, 340);
  };

  const stopButtonHold = () => {
    if (buttonHoldTimerRef.current) {
      clearTimeout(buttonHoldTimerRef.current);
      buttonHoldTimerRef.current = null;
    }
    if (buttonHoldTimeoutRef.current) {
      clearTimeout(buttonHoldTimeoutRef.current);
      buttonHoldTimeoutRef.current = null;
    }
    setActiveButton(null);
    setIsHolding(false);
  };

  const handleButtonPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    stopButtonHold();
  };

  const stopHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    stopButtonHold();
    setIsInteractingDial(false);
    setIsDragging(false);
    setIsHolding(false);
  };

  // Convert kg to lbs for secondary reference
  const weightLbs = Math.round(value * 2.20462);

  // Dial percentage: 0 to 90 kg -> 0 to 1
  const progressRatio = Math.max(0, Math.min(1, value / 90));

  // Gauge calculations (270 degrees sweep: from -135deg to +135deg)
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const strokeOffset = arcLength * (1 - progressRatio);
  const beadAngle = -135 + progressRatio * 270;

  const isInteracting = isInteractingDial || activeButton !== null;

  // DIAL CIRCULAR TOUCH & ROTARY GESTURE HANDLERS
  const handleDialPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    isDraggingDial.current = true;
    setIsDragging(true);
    hasMovedDialRef.current = false;
    dialDownPosRef.current = { x: e.clientX, y: e.clientY };
    dialDownTimeRef.current = performance.now();
    setIsInteractingDial(true);
    lastAngleRef.current = Math.atan2(dy, dx);
    dragAccumulatorRef.current = 0;
    lastTouchPosRef.current = { x: e.clientX, y: e.clientY };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Fallback hold: if user presses dial and holds without rotating, step up after sustained hold
    holdTimeoutRef.current = setTimeout(() => {
      if (isDraggingDial.current) {
        hasMovedDialRef.current = true; // sustained hold counts as hold, not single tap
        setIsHolding(true);
        stepWeight(1);
        const runDialHold = () => {
          if (!isDraggingDial.current || currentValueRef.current >= max) {
            stopHold();
            return;
          }
          stepWeight(1);
          const nextInterval = getHoldInterval(currentValueRef.current);
          holdTimerRef.current = setTimeout(runDialHold, nextInterval);
        };
        holdTimerRef.current = setTimeout(runDialHold, getHoldInterval(currentValueRef.current));
      }
    }, 340);
  };

  const handleDialPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingDial.current || !dialRef.current) return;

    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

    // Cancel static hold timeout on significant movement
    const moveDistFromStart = Math.hypot(e.clientX - dialDownPosRef.current.x, e.clientY - dialDownPosRef.current.y);
    if (moveDistFromStart > 6) {
      hasMovedDialRef.current = true;
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
      setIsHolding(false);
    }

    // 1. Rotary Angular Dragging (ideal when touching around the dial)
    const currentAngle = Math.atan2(dy, dx);
    let deltaAngle = currentAngle - lastAngleRef.current;

    // Handle wrapping around -PI to +PI
    while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
    while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

    lastAngleRef.current = currentAngle;

    // 2. Linear swipe component for users dragging through the center
    const deltaY = lastTouchPosRef.current.y - e.clientY; // upward = positive
    const deltaX = e.clientX - lastTouchPosRef.current.x; // rightward = positive
    lastTouchPosRef.current = { x: e.clientX, y: e.clientY };

    let effectiveChange = 0;

    if (distanceFromCenter > 35) {
      // Rotary mode around circumference
      // 270 deg = 1.5 * PI = 90 kg -> ~0.052 rad per kg
      dragAccumulatorRef.current += deltaAngle;
      const ROTARY_SENSITIVITY = 0.052;
      if (Math.abs(dragAccumulatorRef.current) >= ROTARY_SENSITIVITY) {
        effectiveChange = Math.trunc(dragAccumulatorRef.current / ROTARY_SENSITIVITY);
        dragAccumulatorRef.current -= effectiveChange * ROTARY_SENSITIVITY;
      }
    } else {
      // Center swipe mode (vertical / horizontal)
      const linearDelta = deltaY + deltaX * 0.5;
      dragAccumulatorRef.current += linearDelta;
      const LINEAR_SENSITIVITY = 14;
      if (Math.abs(dragAccumulatorRef.current) >= LINEAR_SENSITIVITY) {
        effectiveChange = Math.trunc(dragAccumulatorRef.current / LINEAR_SENSITIVITY);
        dragAccumulatorRef.current -= effectiveChange * LINEAR_SENSITIVITY;
      }
    }

    if (effectiveChange !== 0) {
      hasMovedDialRef.current = true;
      stepWeight(effectiveChange);
    }
  };

  const handleDialPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingDial.current) return;
    isDraggingDial.current = false;
    setIsDragging(false);
    setIsHolding(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    const moveDistFromStart = Math.hypot(e.clientX - dialDownPosRef.current.x, e.clientY - dialDownPosRef.current.y);
    const elapsed = performance.now() - dialDownTimeRef.current;

    // SINGLE TAP ON THE METER:
    // If movement was minimal (<8px) and released within normal tap timeframe (<400ms) without triggering hold acceleration,
    // this is a genuine single tap -> increase weight by exactly +1 KG.
    if (!hasMovedDialRef.current && moveDistFromStart < 8 && elapsed < 400) {
      stepWeight(1);
      triggerTapPulse();
      lastMeterTapHandledAtRef.current = performance.now();
    }

    stopHold();
  };

  const handleDialClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Guard against duplicate click events after pointerup
    if (performance.now() - lastMeterTapHandledAtRef.current < 400) {
      return;
    }
    stepWeight(1);
    triggerTapPulse();
  };

  // Generate radial gauge tick marks (0 to 90 kg, every 5 kg)
  const ticks = Array.from({ length: 19 }, (_, i) => {
    const tickKg = i * 5;
    const isMajor = tickKg % 10 === 0;
    const tickRatio = tickKg / 90;
    const angleDeg = -135 + tickRatio * 270;
    const angleRad = (angleDeg - 90) * (Math.PI / 180);

    const rInner = isMajor ? 78 : 80;
    const rOuter = 85;

    const x1 = 115 + rInner * Math.cos(angleRad);
    const y1 = 115 + rInner * Math.sin(angleRad);
    const x2 = 115 + rOuter * Math.cos(angleRad);
    const y2 = 115 + rOuter * Math.sin(angleRad);

    const diff = Math.abs(tickKg - value);
    const isNearby = diff <= 5;

    return {
      kg: tickKg,
      x1,
      y1,
      x2,
      y2,
      isMajor,
      isNearby,
      color: isNearby ? '#894EFF' : '#251436',
      opacity: isNearby ? 0.75 : isMajor ? 0.35 : 0.18,
      width: isMajor ? 2 : 1.2,
    };
  });

  return (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-between select-none min-h-0">
      {/* 1. HERO CIRCULAR WEIGHT METER DIAL (flex: 1, centered horizontally + vertically) */}
      <div
        ref={meterContainerRef}
        className="flex-1 w-full min-h-0 flex items-center justify-center relative weight-meter-area my-auto"
      >
        {/* TRUE CIRCULAR RADIAL FLOW: Rotating circular energy aura along circumference during hold */}
        <div
          className={`absolute rounded-full pointer-events-none transition-opacity duration-200 overflow-hidden ${
            isHolding
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          }`}
          style={{
            width: meterSize ? `${meterSize + 16}px` : 'clamp(184px, 32dvh, 284px)',
            height: meterSize ? `${meterSize + 16}px` : 'clamp(184px, 32dvh, 284px)',
            maxWidth: '100%',
            maxHeight: '100%',
            maskImage: 'radial-gradient(circle, transparent 66%, black 78%, black 95%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 66%, black 78%, black 95%, transparent 100%)',
            filter: 'blur(3px)',
          }}
        >
          <div
            className="w-full h-full rounded-full animate-circular-energy"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, rgba(137,78,255,0.1) 40deg, rgba(137,78,255,0.85) 140deg, rgba(240,42,138,0.95) 210deg, rgba(137,78,255,0.65) 280deg, transparent 340deg, transparent 360deg)',
            }}
          />
        </div>

        {/* Subtle circular pulse on tap */}
        <div
          className={`absolute rounded-full pointer-events-none transition-all duration-200 ${
            isTapPulsing
              ? 'opacity-60 scale-105 bg-[#894EFF]/20'
              : 'opacity-0 scale-100 bg-transparent'
          }`}
          style={{
            width: meterSize ? `${meterSize + 8}px` : 'clamp(176px, 31dvh, 276px)',
            height: meterSize ? `${meterSize + 8}px` : 'clamp(176px, 31dvh, 276px)',
          }}
        />

        {/* 
          MULTI-LAYER PHYSICAL CIRCULAR DIAL:
          - Deep Plum outer border with 6px offset shadow
          - Soft white/lavender tactile surface with inner depth shadow
          - Rotatable touch surface
        */}
        <div
          ref={dialRef}
          id="hero-weight-machine"
          onPointerDown={handleDialPointerDown}
          onPointerMove={handleDialPointerMove}
          onPointerUp={handleDialPointerUp}
          onPointerCancel={handleDialPointerUp}
          onClick={handleDialClick}
          className={`relative rounded-full cursor-grab active:cursor-grabbing flex flex-col items-center justify-center border-4 border-[#251436] transition-all duration-150 overflow-hidden select-none touch-none aspect-square ${
            isInteracting || isTapPulsing
              ? 'bg-[#FAF8FE] shadow-[3px_3px_0px_#251436] translate-y-0.5 scale-[0.985]'
              : 'bg-[#FFFFFF] shadow-[6px_6px_0px_#251436] hover:bg-[#FAF9FF] scale-100'
          }`}
          style={{
            width: meterSize ? `${meterSize}px` : 'clamp(168px, 30.5dvh, 268px)',
            height: meterSize ? `${meterSize}px` : 'clamp(168px, 30.5dvh, 268px)',
            maxWidth: 'calc(100% - 16px)',
            maxHeight: 'calc(100% - 12px)',
            touchAction: 'none',
          }}
          title="Tap to increase +1 kg, or rotate the dial"
        >
          {/* Subtle physical inner shadow vignette */}
          <div className="absolute inset-0 rounded-full pointer-events-none shadow-[inset_0px_3px_8px_rgba(37,20,54,0.08)] z-0" />

          {/* Internal Circular Energy Flow Stream (strictly clipped inside circular meter) */}
          <div
            className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-200 overflow-hidden z-1 ${
              isHolding ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              maskImage: 'radial-gradient(circle, transparent 72%, black 79%, black 98%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 72%, black 79%, black 98%, transparent 100%)',
            }}
          >
            <div
              className="w-full h-full rounded-full animate-circular-energy"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, rgba(137,78,255,0.15) 45deg, rgba(137,78,255,0.75) 150deg, rgba(240,42,138,0.9) 210deg, rgba(137,78,255,0.55) 270deg, transparent 330deg, transparent 360deg)',
              }}
            />
          </div>

          {/* SVG Progress Gauge Arc, Ticks & Secondary Ring */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none -rotate-90 transform z-0"
            viewBox="0 0 230 230"
          >
            {/* Subtle Ticks around the 270-degree circumference */}
            {ticks.map((t) => (
              <line
                key={t.kg}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.color}
                strokeWidth={t.width}
                strokeOpacity={t.opacity}
                strokeLinecap="round"
                className={isDragging ? 'transition-none' : 'transition-all duration-75'}
              />
            ))}

            {/* Secondary Track Ring */}
            <circle
              cx="115"
              cy="115"
              r={radius}
              fill="transparent"
              stroke="#251436"
              strokeOpacity="0.08"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset="0"
              transform="rotate(135 115 115)"
            />

            {/* Active Vibrant Electric Purple Progress Ring */}
            <circle
              cx="115"
              cy="115"
              r={radius}
              fill="transparent"
              stroke={value > 0 ? '#894EFF' : 'transparent'}
              strokeWidth={isHolding ? 10 : isTapPulsing ? 10 : 8.5}
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeOffset}
              transform="rotate(135 115 115)"
              className={isDragging ? 'transition-none' : 'transition-all duration-75 ease-out'}
              style={{
                filter: isHolding
                  ? 'drop-shadow(0 0 10px rgba(137,78,255,0.85))'
                  : (isInteracting || isTapPulsing) && value > 0
                  ? 'drop-shadow(0 0 6px rgba(137,78,255,0.6))'
                  : 'none',
              }}
            />
          </svg>

          {/* Dial Marker Knob (Electric Purple & Hot Pink jewel indicator rotating along perimeter) */}
          <div
            style={{
              transform: `rotate(${beadAngle}deg)`,
            }}
            className={`absolute inset-0 pointer-events-none flex justify-center z-20 ${
              isDragging ? 'transition-none' : 'transition-transform duration-75 ease-out'
            }`}
          >
            <div
              className={`w-[18px] h-[18px] rounded-full bg-white border-2.5 border-[#251436] shadow-[0px_2px_4px_rgba(37,20,54,0.25)] -mt-2.5 flex items-center justify-center ${
                isDragging ? 'transition-none' : 'transition-all duration-150'
              } ${
                isInteracting || isTapPulsing ? 'scale-120 border-[#894EFF]' : 'scale-100'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isDragging ? 'transition-none' : 'transition-colors duration-150'
                } ${
                  isInteracting || isTapPulsing ? 'bg-[#F02A8A]' : 'bg-[#894EFF]'
                }`}
              />
            </div>
          </div>

          {/* Top Dial Center Marker Notch */}
          <div className="absolute top-2 w-3 h-2 bg-[#F02A8A] rounded-b-md border border-[#251436] shadow-[0.5px_0.5px_0px_#251436] z-10 pointer-events-none" />

          {/* Raised Center Platter / Plinth with Clear Visual Hierarchy */}
          <div className="relative w-[76%] h-[76%] rounded-full bg-white/95 border border-[#251436]/10 shadow-[0_2px_12px_rgba(37,20,54,0.06)] flex flex-col items-center justify-center pointer-events-none z-10 px-2 text-center">
            {/* Bold Center Weight Number with instant sync during dragging */}
            <div className="relative flex items-center justify-center">
              {isDragging ? (
                <span className="text-[clamp(44px,6.2vh,64px)] font-black text-[#251436] tracking-tight leading-none select-none">
                  {value}
                </span>
              ) : (
                <motion.span
                  key={value}
                  initial={{ scale: 1.05, opacity: 0.9 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  className="text-[clamp(44px,6.2vh,64px)] font-black text-[#251436] tracking-tight leading-none select-none"
                >
                  {value}
                </motion.span>
              )}
            </div>

            {/* Refined Warm Yellow KG Pill */}
            <div className="flex items-center justify-center mt-1">
              <span className="px-3.5 py-0.5 rounded-full text-[clamp(10.5px,1.4vh,13px)] font-black bg-[#FFC928] text-[#251436] border-2 border-[#251436] shadow-[1.5px_1.5px_0px_#251436] tracking-wider uppercase select-none">
                KG
              </span>
            </div>

            {/* Secondary Pounds Display */}
            {value === 0 ? (
              <span className="text-[11px] sm:text-[12px] font-bold text-[#894EFF] mt-1 tracking-tight select-none">
                Tap or rotate to set
              </span>
            ) : (
              <span className="text-[11px] sm:text-xs font-semibold text-[#251436]/55 mt-1 tracking-tight select-none">
                ({weightLbs} lbs)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. TACTILE ACTION CONTROLS [ − ] and [ + ]: Anchored toward bottom */}
      <div className="shrink-0 flex flex-col items-center justify-center w-full pt-1 pb-0.5 weight-controls">
        <div className="flex items-center justify-center gap-4 sm:gap-5 w-full max-w-[280px]">
          {/* Decrease Button [ - ] */}
          <button
            type="button"
            id="decrease-weight-btn"
            disabled={value <= min}
            onPointerDown={(e) => startButtonHold(-1, 'minus', e)}
            onPointerUp={handleButtonPointerUp}
            onPointerLeave={handleButtonPointerUp}
            onPointerCancel={handleButtonPointerUp}
            onClick={(e) => e.preventDefault()}
            className={`w-[clamp(44px,5.6vh,54px)] h-[clamp(44px,5.6vh,54px)] rounded-2xl bg-white border-3 border-[#251436] flex items-center justify-center text-[#251436] transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer ${
              activeButton === 'minus'
                ? 'translate-y-1 shadow-[1px_1px_0px_#251436] bg-[#EAE5F8]'
                : 'shadow-[4px_4px_0px_#251436] hover:bg-[#FAF9FF] active:translate-y-1 active:shadow-[1px_1px_0px_#251436]'
            }`}
            aria-label="Decrease weight"
          >
            <Minus size={20} strokeWidth={3.5} />
          </button>

          {/* Increase Button [ + ] */}
          <button
            type="button"
            id="increase-weight-btn"
            disabled={value >= max}
            onPointerDown={(e) => startButtonHold(1, 'plus', e)}
            onPointerUp={handleButtonPointerUp}
            onPointerLeave={handleButtonPointerUp}
            onPointerCancel={handleButtonPointerUp}
            onClick={(e) => e.preventDefault()}
            className={`w-[clamp(44px,5.6vh,54px)] h-[clamp(44px,5.6vh,54px)] rounded-2xl bg-[#894EFF] border-3 border-[#251436] flex items-center justify-center text-white transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer ${
              activeButton === 'plus'
                ? 'translate-y-1 shadow-[1px_1px_0px_#251436] bg-[#7836F0]'
                : 'shadow-[4px_4px_0px_#251436] hover:bg-[#7D3DF5] active:translate-y-1 active:shadow-[1px_1px_0px_#251436]'
            }`}
            aria-label="Increase weight"
          >
            <Plus size={20} strokeWidth={3.5} />
          </button>
        </div>

        {/* Simplified, elegant microcopy instruction */}
        <p className="text-[10.5px] sm:text-xs font-bold text-[#251436]/60 text-center mt-1 select-none tracking-tight">
          Tap +1 kg • Hold to adjust
        </p>
      </div>
    </div>
  );
};
