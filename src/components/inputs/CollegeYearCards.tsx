import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

interface CollegeYearCardsProps {
  value: string;
  onChange: (val: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | 'PG') => void;
}

// =========================================================================
// CUSTOM STRINGX VECTOR MICRO-ILLUSTRATIONS
// Intentionally designed vector assets for each campus stage (No native emojis)
// =========================================================================

/**
 * 1st Year: Sprout / New Beginning Illustration
 * Two playful leaves, curved stem, subtle green, yellow, and purple accents.
 */
const SproutIllustration: React.FC<{ isSelected: boolean }> = ({ isSelected }) => {
  const stroke = isSelected ? '#FFFFFF' : '#251436';
  const leaf1Fill = isSelected ? '#FFC928' : '#22C55E';
  const leaf2Fill = isSelected ? '#FFFFFF' : '#A7F3D0';
  const baseFill = isSelected ? '#FFFFFF' : '#894EFF';

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      {/* Ground mound curve */}
      <path
        d="M8 20.5C9 19.5 11 19 12 19C13 19 15 19.5 16 20.5"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Curved growth stem */}
      <path
        d="M12 20V12C12 9.5 13.5 8 16 7.5"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Left sprout leaf */}
      <path
        d="M12 13C9 13 6.5 11 6 7.5C9.5 7.5 12 9.5 12 13Z"
        fill={leaf2Fill}
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Right growth leaf */}
      <path
        d="M12.5 10.5C14.5 7 18 6.5 20.5 7C20.5 10 18 13 13.5 12.5"
        fill={leaf1Fill}
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Seed core pip */}
      <circle cx="12" cy="19" r="1.5" fill={baseFill} stroke={stroke} strokeWidth="1" />
    </svg>
  );
};

/**
 * 2nd Year: Flame / Momentum Illustration
 * Stylized energetic flame with layered core and warm pink + yellow accents.
 */
const FlameIllustration: React.FC<{ isSelected: boolean }> = ({ isSelected }) => {
  const stroke = isSelected ? '#FFFFFF' : '#251436';
  const outerFill = isSelected ? '#FF5C93' : '#FF4D6D';
  const innerFill = isSelected ? '#FFC928' : '#FFC928';
  const sparkFill = isSelected ? '#FFFFFF' : '#894EFF';

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      {/* Outer dynamic flame silhouette */}
      <path
        d="M12 3C12.8 5.5 14 7.2 16 8.5C18.2 9.9 19.5 12 19 14.8C18.4 18.2 15.6 21 12 21C8.4 21 5.6 18.2 5 14.8C4.5 12 5.8 9.5 8 8C8.5 10 9.5 11 11 11C11 8.5 11.5 5.5 12 3Z"
        fill={outerFill}
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Inner flame energy heart */}
      <path
        d="M12 11.5C13 13 14.5 14 14.5 16C14.5 17.5 13.4 18.8 12 18.8C10.6 18.8 9.5 17.5 9.5 16C9.5 14.5 10.5 13 12 11.5Z"
        fill={innerFill}
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      {/* Top floating energy ember */}
      <circle cx="17.5" cy="4.5" r="1.5" fill={sparkFill} stroke={stroke} strokeWidth="1" />
    </svg>
  );
};

/**
 * 3rd Year: Sparkle / Peak Era Illustration
 * Layered asymmetrical starburst with vibrant yellow, pink, and purple accents.
 */
const SparkleIllustration: React.FC<{ isSelected: boolean }> = ({ isSelected }) => {
  const stroke = isSelected ? '#FFFFFF' : '#251436';
  const primaryFill = isSelected ? '#FFC928' : '#FFC928';
  const secondaryFill = isSelected ? '#FFFFFF' : '#FF5C93';
  const accentPip = isSelected ? '#FFC928' : '#894EFF';

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      {/* Secondary offset diamond spark */}
      <path
        d="M6 14C6 16 4.5 17 3 17C4.5 17 6 18 6 20C6 18 7.5 17 9 17C7.5 17 6 16 6 14Z"
        fill={secondaryFill}
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      {/* Primary bold dynamic starburst */}
      <path
        d="M14.5 2C14.5 6 17.5 8.5 21.5 8.5C17.5 8.5 14.5 11 14.5 15C14.5 11 11.5 8.5 7.5 8.5C11.5 8.5 14.5 6 14.5 2Z"
        fill={primaryFill}
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Center core accent pip */}
      <circle cx="14.5" cy="8.5" r="1.5" fill={isSelected ? '#FFFFFF' : '#894EFF'} />
      {/* Floating micro-spark satellite */}
      <circle cx="19.5" cy="18" r="1.5" fill={accentPip} stroke={stroke} strokeWidth="1" />
    </svg>
  );
};

/**
 * 4th Year: Crown / Seniority & Milestone Illustration
 * Chunky geometric crown with StringX yellow body, base band, and jewel finials.
 */
const CrownIllustration: React.FC<{ isSelected: boolean }> = ({ isSelected }) => {
  const stroke = isSelected ? '#FFFFFF' : '#251436';
  const crownFill = isSelected ? '#FFC928' : '#FFC928';
  const bandFill = isSelected ? '#FFFFFF' : '#894EFF';
  const jewelColor = isSelected ? '#FF5C93' : '#FF5C93';

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      {/* Crown body */}
      <path
        d="M4 17L3 7.5L8 11.5L12 5L16 11.5L21 7.5L20 17H4Z"
        fill={crownFill}
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lower base band */}
      <rect
        x="4"
        y="17"
        width="16"
        height="3.5"
        rx="1.5"
        fill={bandFill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      {/* Center jewel pip on band */}
      <circle cx="12" cy="18.75" r="1" fill={jewelColor} />
      {/* Three peak spheres */}
      <circle cx="3" cy="6.5" r="1.25" fill={isSelected ? '#FFFFFF' : stroke} />
      <circle cx="12" cy="4" r="1.5" fill={isSelected ? '#FFFFFF' : stroke} />
      <circle cx="21" cy="6.5" r="1.25" fill={isSelected ? '#FFFFFF' : stroke} />
    </svg>
  );
};

/**
 * Postgraduate: Academic Graduation Cap Illustration
 * Dimensional mortarboard cap with skullcap band and yellow-accented tassel.
 */
const GraduationCapIllustration: React.FC<{ isSelected: boolean }> = ({ isSelected }) => {
  const stroke = isSelected ? '#FFFFFF' : '#251436';
  const capTopFill = isSelected ? '#251436' : '#251436';
  const capBandFill = isSelected ? '#FFFFFF' : '#894EFF';
  const tasselFill = isSelected ? '#FFC928' : '#FFC928';

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      {/* Lower skullcap band */}
      <path
        d="M6.5 11.5V15.5C6.5 17 9 18.5 12 18.5C15 18.5 17.5 17 17.5 15.5V11.5"
        fill={capBandFill}
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Mortarboard Diamond Top */}
      <path
        d="M2.5 9L12 4.5L21.5 9L12 13.5L2.5 9Z"
        fill={capTopFill}
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Mortarboard Center Button */}
      <circle cx="12" cy="9" r="1.5" fill={tasselFill} stroke={stroke} strokeWidth="1" />
      {/* Hanging Tassel */}
      <path
        d="M13.5 9.2L19.5 10.5V16.5"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Tassel fringe pompom */}
      <rect
        x="18.25"
        y="16.5"
        width="2.5"
        height="3"
        rx="1"
        fill={tasselFill}
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  );
};

// =========================================================================
// DATA SPECIFICATION FOR CARDS
// =========================================================================

interface YearCardData {
  id: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  number: string;
  title: string;
  descriptor: string;
  illustration: React.FC<{ isSelected: boolean }>;
}

const YEAR_CARDS: YearCardData[] = [
  {
    id: '1st Year',
    number: '1st',
    title: '1st Year',
    descriptor: 'Ready to explore',
    illustration: SproutIllustration,
  },
  {
    id: '2nd Year',
    number: '2nd',
    title: '2nd Year',
    descriptor: 'Knows all the spots',
    illustration: FlameIllustration,
  },
  {
    id: '3rd Year',
    number: '3rd',
    title: '3rd Year',
    descriptor: 'Peak campus era',
    illustration: SparkleIllustration,
  },
  {
    id: '4th Year',
    number: '4th',
    title: '4th Year',
    descriptor: 'Almost out',
    illustration: CrownIllustration,
  },
];

const PG_CARD = {
  id: 'PG' as const,
  badge: 'PG',
  title: 'POSTGRADUATE',
  descriptor: 'Still on campus',
  illustration: GraduationCapIllustration,
};

// =========================================================================
// COMPONENT
// =========================================================================

export const CollegeYearCards: React.FC<CollegeYearCardsProps> = ({ value, onChange }) => {
  const isPgSelected = value === 'PG';
  const PgIllustration = PG_CARD.illustration;

  return (
    <div className="w-full flex flex-col items-center select-none pt-1">
      {/* 2 × 2 EQUAL RECTANGULAR GRID FOR 1ST–4TH YEAR CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5 w-full">
        {YEAR_CARDS.map((card) => {
          const isSelected = value === card.id;
          const CardIllustration = card.illustration;

          return (
            <motion.button
              key={card.id}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.975, y: 1 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              onClick={() => onChange(card.id)}
              className={`p-3.5 sm:p-4 rounded-2xl border-3 flex flex-col justify-between h-[150px] sm:h-[156px] transition-all duration-150 cursor-pointer select-none text-left shadow-[4px_4px_0px_#251436] active:shadow-[2px_2px_0px_#251436] ${
                isSelected
                  ? 'bg-[#894EFF] text-white border-[#251436]'
                  : 'bg-white text-[#251436] border-[#251436] hover:bg-[#FAF9FF]'
              }`}
            >
              {/* TOP: DOMINANT YEAR NUMBER + CUSTOM VECTOR ILLUSTRATION & CHECK INDICATOR */}
              <div className="flex items-start justify-between w-full">
                <span
                  className={`text-[32px] sm:text-[36px] font-black tracking-tight leading-none transition-colors duration-150 ${
                    isSelected ? 'text-white' : 'text-[#251436]'
                  }`}
                >
                  {card.number}
                </span>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <CardIllustration isSelected={isSelected} />

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                        className="w-5 h-5 rounded-full bg-white text-[#894EFF] border-2 border-[#251436] flex items-center justify-center shadow-[1px_1px_0px_#251436] shrink-0"
                      >
                        <Check size={11} strokeWidth={3.5} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* BOTTOM: BOLD TITLE + COMPACT SUPPORTING DESCRIPTION */}
              <div className="mt-auto">
                <div
                  className={`text-sm sm:text-[15px] font-black tracking-tight leading-tight transition-colors duration-150 ${
                    isSelected ? 'text-white' : 'text-[#251436]'
                  }`}
                >
                  {card.title}
                </div>
                <div
                  className={`text-[11px] sm:text-xs font-semibold mt-0.5 leading-snug transition-colors duration-150 ${
                    isSelected ? 'text-white/85' : 'text-[#251436]/70'
                  }`}
                >
                  {card.descriptor}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* FULL-WIDTH HORIZONTAL POSTGRADUATE CARD */}
      <div className="w-full mt-3 sm:mt-3.5">
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.975, y: 1 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          onClick={() => onChange(PG_CARD.id)}
          className={`w-full h-[68px] sm:h-[72px] px-3.5 sm:px-4 rounded-2xl border-3 flex items-center justify-between transition-all duration-150 cursor-pointer select-none text-left shadow-[4px_4px_0px_#251436] active:shadow-[2px_2px_0px_#251436] ${
            isPgSelected
              ? 'bg-[#894EFF] text-white border-[#251436]'
              : 'bg-white text-[#251436] border-[#251436] hover:bg-[#FAF9FF]'
          }`}
        >
          {/* LEFT: [ PG ] PILL (NEUTRAL WHITE UNSELECTED, STRINGX YELLOW ONLY WHEN SELECTED) + CENTER TEXT */}
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div
              className={`px-2.5 py-1 rounded-xl border-2 border-[#251436] font-black text-xs tracking-wider shrink-0 transition-colors duration-150 shadow-[1.5px_1.5px_0px_#251436] ${
                isPgSelected
                  ? 'bg-[#FFC928] text-[#251436]'
                  : 'bg-white text-[#251436]'
              }`}
            >
              {PG_CARD.badge}
            </div>

            <div className="flex flex-col min-w-0">
              <span
                className={`text-sm sm:text-base font-black tracking-tight leading-tight block transition-colors duration-150 ${
                  isPgSelected ? 'text-white' : 'text-[#251436]'
                }`}
              >
                {PG_CARD.title}
              </span>
              <span
                className={`text-xs font-semibold mt-0.5 leading-snug block transition-colors duration-150 ${
                  isPgSelected ? 'text-white/85' : 'text-[#251436]/70'
                }`}
              >
                {PG_CARD.descriptor}
              </span>
            </div>
          </div>

          {/* RIGHT: CUSTOM GRADUATION CAP ILLUSTRATION + CIRCULAR SELECTION INDICATOR */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <PgIllustration isSelected={isPgSelected} />

            {isPgSelected ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                className="w-5.5 h-5.5 rounded-full bg-white text-[#894EFF] border-2 border-[#251436] flex items-center justify-center shadow-[1px_1px_0px_#251436] shrink-0"
              >
                <Check size={12} strokeWidth={3.5} />
              </motion.div>
            ) : (
              <div className="w-5.5 h-5.5 rounded-full border-2 border-[#251436]/40 bg-white shrink-0" />
            )}
          </div>
        </motion.button>
      </div>
    </div>
  );
};
