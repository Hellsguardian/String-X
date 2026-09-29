import React from 'react';
import { motion } from 'motion/react';

// Festive Dandiya Sticks Crossed
export const DandiyaSticksIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Left Stick */}
    <rect x="14" y="8" width="8" height="48" rx="4" transform="rotate(-30 14 8)" fill="#894EFF" />
    <rect x="16" y="16" width="8" height="6" rx="1" transform="rotate(-30 16 16)" fill="#FFC928" />
    <rect x="22" y="28" width="8" height="6" rx="1" transform="rotate(-30 22 28)" fill="#F02A8A" />
    <circle cx="16" cy="10" r="3" fill="#FFFFFF" />
    
    {/* Right Stick */}
    <rect x="44" y="4" width="8" height="48" rx="4" transform="rotate(30 44 4)" fill="#F02A8A" />
    <rect x="38" y="16" width="8" height="6" rx="1" transform="rotate(30 38 16)" fill="#08A98D" />
    <rect x="32" y="28" width="8" height="6" rx="1" transform="rotate(30 32 28)" fill="#FFC928" />
    <circle cx="48" cy="8" r="3" fill="#FFFFFF" />

    {/* Sparkles */}
    <circle cx="32" cy="18" r="2.5" fill="#FFC928" />
    <path d="M32 10 L33.5 13 L36.5 14 L33.5 15 L32 18 L30.5 15 L27.5 14 L30.5 13 Z" fill="#FFC928" />
  </svg>
);

// STRING X Connected Logo / Wordmark
export const StringXLogo: React.FC<{ size?: 'sm' | 'md' | 'lg'; light?: boolean }> = ({ size = 'md', light = false }) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div className="inline-flex items-center gap-1.5 select-none">
      <div className={`relative flex items-center justify-center font-extrabold tracking-tight ${
        isSm ? 'text-lg' : isLg ? 'text-3xl' : 'text-xl'
      } ${light ? 'text-[#FFFFFF]' : 'text-[#251436]'}`}>
        <span>STRING</span>
        <span className="mx-1" />
        <span className="text-[#F02A8A] relative">
          X
          {/* Subtle curved string under X */}
          <svg className="absolute -bottom-1 left-0 w-full h-2 overflow-visible" viewBox="0 0 20 6" fill="none">
            <path d="M1 1C5 5 15 5 19 1" stroke="#FFC928" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </div>
  );
};

// Playful Tilted Badge
export const PlayfulBadge: React.FC<{
  text: string;
  color?: 'yellow' | 'pink' | 'purple' | 'teal' | 'cream';
  tilt?: 'left' | 'right' | 'none';
  className?: string;
}> = ({ text, color = 'yellow', tilt = 'left', className = '' }) => {
  const colorMap = {
    yellow: 'bg-[#FFC928] text-[#251436] border-[#251436]',
    pink: 'bg-[#F02A8A] text-white border-[#251436]',
    purple: 'bg-[#894EFF] text-white border-[#251436]',
    teal: 'bg-[#08A98D] text-white border-[#251436]',
    cream: 'bg-[#E3E0F5] text-[#251436] border-[#251436]'
  };

  const tiltClass = tilt === 'left' ? '-rotate-2' : tilt === 'right' ? 'rotate-2' : '';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 rounded-lg shadow-[2px_2px_0px_#251436] ${colorMap[color]} ${tiltClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {text}
    </div>
  );
};

// Main Landing Garba Scene Illustration
export const LandingGarbaIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full max-w-[340px] mx-auto aspect-[16/11] select-none ${className}`}>
      <svg viewBox="0 0 380 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
        {/* Soft Background Cloud & Moon */}
        <circle cx="190" cy="130" r="105" fill="#E3E0F5" fillOpacity="0.4" />
        <circle cx="295" cy="55" r="24" fill="#FFC928" />
        <circle cx="304" cy="50" r="22" fill="#251436" fillOpacity="0.8" />

        {/* Festive Fairy Lights Hanging Wire */}
        <path d="M10 25 Q100 50 190 28 T370 25" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="65" cy="36" r="5" fill="#FFC928" />
        <circle cx="120" cy="40" r="5" fill="#F02A8A" />
        <circle cx="190" cy="28" r="5" fill="#894EFF" />
        <circle cx="260" cy="38" r="5" fill="#08A98D" />
        <circle cx="320" cy="32" r="5" fill="#FFC928" />

        {/* The Magic Connecting String (from left dancer's hand to right dancer's hand) */}
        <motion.path
          d="M130 135 C160 175 220 175 250 135"
          stroke="#F02A8A"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: [0, -32] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        <circle cx="190" cy="162" r="7" fill="#894EFF" />
        <circle cx="190" cy="162" r="3.5" fill="#FFFFFF" />

        {/* Character 1 (Left: Girl in contemporary festive Chaniya Choli) */}
        <g transform="translate(60, 50)">
          {/* Hair Bun with Gajra / flowers */}
          <circle cx="60" cy="42" r="18" fill="#180C24" />
          <circle cx="60" cy="30" r="8" fill="#FFC928" />
          
          {/* Face */}
          <circle cx="60" cy="50" r="14" fill="#F5CBA7" />
          {/* Glasses / earrings */}
          <circle cx="50" cy="52" r="3" fill="#F02A8A" />
          <circle cx="56" cy="48" r="1.5" fill="#251436" />
          <circle cx="64" cy="48" r="1.5" fill="#251436" />
          <path d="M57 55 Q60 58 63 55" stroke="#251436" strokeWidth="1.5" strokeLinecap="round" />

          {/* Festive Top (Choli) */}
          <path d="M48 64 L72 64 L68 88 L52 88 Z" fill="#894EFF" />
          <circle cx="60" cy="74" r="3" fill="#FFC928" />

          {/* Dancing Arms holding Dandiya */}
          <path d="M48 68 L32 50 L25 40" stroke="#F5CBA7" strokeWidth="5" strokeLinecap="round" />
          <line x1="20" y1="30" x2="35" y2="60" stroke="#08A98D" strokeWidth="4" strokeLinecap="round" />
          
          {/* Right Arm pointing towards center */}
          <path d="M70 70 L95 85 L115 85" stroke="#F5CBA7" strokeWidth="5" strokeLinecap="round" />
          <line x1="108" y1="72" x2="122" y2="98" stroke="#FFC928" strokeWidth="4" strokeLinecap="round" />

          {/* Flared Lehenga / Skirt */}
          <path d="M52 88 L68 88 L95 155 L25 155 Z" fill="#F02A8A" />
          {/* Skirt border patterns */}
          <path d="M25 146 L95 146" stroke="#FFC928" strokeWidth="4" />
          <path d="M30 138 L90 138" stroke="#251436" strokeWidth="2" strokeDasharray="3 3" />
          
          {/* Chunky Sneakers under skirt */}
          <rect x="38" y="153" width="16" height="8" rx="4" fill="#FFFFFF" stroke="#251436" strokeWidth="1.5" />
          <rect x="66" y="153" width="16" height="8" rx="4" fill="#FFFFFF" stroke="#251436" strokeWidth="1.5" />
        </g>

        {/* Character 2 (Right: Guy in cool embroidered Kurta + Sneakers) */}
        <g transform="translate(195, 52)">
          {/* Cool Modern Hair */}
          <path d="M45 42 C45 30 65 24 75 32 C82 38 78 48 78 48 Z" fill="#180C24" />
          
          {/* Face */}
          <circle cx="60" cy="50" r="14" fill="#EDBB99" />
          <circle cx="56" cy="48" r="1.5" fill="#251436" />
          <circle cx="64" cy="48" r="1.5" fill="#251436" />
          <path d="M58 55 Q60 58 63 55" stroke="#251436" strokeWidth="1.5" strokeLinecap="round" />

          {/* Cool Kurta */}
          <path d="M46 64 L74 64 L72 118 L48 118 Z" fill="#08A98D" />
          {/* Mirrorwork / embroidery stripe */}
          <line x1="60" y1="64" x2="60" y2="100" stroke="#FFC928" strokeWidth="3" />
          <circle cx="60" cy="74" r="2" fill="#FFFFFF" />
          <circle cx="60" cy="84" r="2" fill="#FFFFFF" />

          {/* Left Arm holding Dandiya inwards */}
          <path d="M50 70 L30 84 L10 84" stroke="#EDBB99" strokeWidth="5" strokeLinecap="round" />
          <line x1="18" y1="72" x2="2" y2="98" stroke="#F02A8A" strokeWidth="4" strokeLinecap="round" />

          {/* Right Arm raised up dancing */}
          <path d="M72 68 L88 52 L98 42" stroke="#EDBB99" strokeWidth="5" strokeLinecap="round" />
          <line x1="90" y1="32" x2="105" y2="60" stroke="#894EFF" strokeWidth="4" strokeLinecap="round" />

          {/* Festive Pajama / Dhoti pants */}
          <path d="M49 118 L58 152 L48 152 Z" fill="#E3E0F5" stroke="#251436" strokeWidth="1" />
          <path d="M71 118 L62 152 L72 152 Z" fill="#E3E0F5" stroke="#251436" strokeWidth="1" />

          {/* Sneakers */}
          <rect x="42" y="151" width="16" height="8" rx="4" fill="#894EFF" stroke="#251436" strokeWidth="1.5" />
          <rect x="64" y="151" width="16" height="8" rx="4" fill="#894EFF" stroke="#251436" strokeWidth="1.5" />
        </g>

        {/* Decorative Stars & Confetti in the Air */}
        <path d="M50 110 L52 114 L56 115 L52 117 L50 121 L48 117 L44 115 L48 114 Z" fill="#FFC928" />
        <path d="M330 110 L332 114 L336 115 L332 117 L330 121 L328 117 L324 115 L328 114 Z" fill="#894EFF" />
        <circle cx="190" cy="80" r="3" fill="#F02A8A" />
      </svg>
    </div>
  );
};

// Height Dynamic Character (Scales with cm)
export const DynamicHeightFigure: React.FC<{ heightCm: number }> = ({ heightCm }) => {
  // Height ranges typically from 145cm to 200cm
  const scaleRatio = Math.max(0.75, Math.min(1.2, (heightCm - 120) / 70));

  return (
    <div className="relative flex flex-col items-center justify-end h-52 w-28 mx-auto">
      {/* Visual Height Indicator Tag */}
      <motion.div 
        key={heightCm}
        initial={{ scale: 0.9, y: 4 }}
        animate={{ scale: 1, y: 0 }}
        className="absolute -top-3 z-10 bg-[#251436] text-[#FFFFFF] text-xs font-bold px-2 py-0.5 rounded-full shadow"
      >
        {heightCm} cm
      </motion.div>

      {/* Scalable Vector Figure */}
      <motion.div 
        className="origin-bottom"
        animate={{ scaleY: scaleRatio, scaleX: Math.min(1.05, Math.max(0.9, scaleRatio * 0.95)) }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <svg width="80" height="180" viewBox="0 0 80 180" fill="none">
          {/* Head & festive hair */}
          <circle cx="40" cy="24" r="16" fill="#251436" />
          <circle cx="40" cy="28" r="12" fill="#F5CBA7" />
          {/* Happy smile */}
          <path d="M37 32 Q40 35 43 32" stroke="#251436" strokeWidth="1.5" strokeLinecap="round" />
          {/* Traditional earrings */}
          <circle cx="26" cy="30" r="2.5" fill="#FFC928" />
          <circle cx="54" cy="30" r="2.5" fill="#FFC928" />

          {/* Stylish Kurta / Top with festive mirror pattern */}
          <path d="M25 44 L55 44 L52 100 L28 100 Z" fill="#894EFF" rx="4" />
          <line x1="40" y1="44" x2="40" y2="85" stroke="#FFC928" strokeWidth="2" />
          <circle cx="40" cy="55" r="2" fill="#FFFFFF" />
          <circle cx="40" cy="67" r="2" fill="#FFFFFF" />

          {/* Dandiya in hand */}
          <line x1="18" y1="55" x2="10" y2="85" stroke="#F02A8A" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="62" y1="55" x2="70" y2="85" stroke="#08A98D" strokeWidth="3.5" strokeLinecap="round" />

          {/* Pants */}
          <rect x="30" y="100" width="8" height="55" rx="3" fill="#251436" />
          <rect x="42" y="100" width="8" height="55" rx="3" fill="#251436" />

          {/* Sneakers */}
          <rect x="25" y="155" width="15" height="9" rx="4" fill="#FFC928" />
          <rect x="40" y="155" width="15" height="9" rx="4" fill="#FFC928" />
        </svg>
      </motion.div>
    </div>
  );
};

// Connected Group Illustration for Final Reveal / Success
export const ConnectedNetworkIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-full max-w-[320px] mx-auto aspect-[16/10] select-none ${className}`}>
    <svg viewBox="0 0 340 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background Soft Glow */}
      <circle cx="170" cy="110" r="90" fill="#894EFF" fillOpacity="0.15" />

      {/* Glowing Connecting Strings Between All 4 Avatars */}
      <motion.path
        d="M60 70 Q170 30 280 70"
        stroke="#894EFF"
        strokeWidth="3"
        strokeDasharray="4 4"
        strokeLinecap="round"
        animate={{ strokeDashoffset: [0, -24] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
      />
      <motion.path
        d="M60 70 Q170 170 280 70"
        stroke="#F02A8A"
        strokeWidth="3"
        strokeDasharray="4 4"
        strokeLinecap="round"
        animate={{ strokeDashoffset: [0, 24] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
      />
      <motion.path
        d="M170 40 L170 170"
        stroke="#08A98D"
        strokeWidth="2.5"
        strokeDasharray="3 3"
        strokeLinecap="round"
        animate={{ strokeDashoffset: [0, -18] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
      />

      {/* Central Sparkle Star */}
      <g transform="translate(170, 110)">
        <circle cx="0" cy="0" r="14" fill="#FFC928" />
        <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
      </g>

      {/* Avatar Node 1 (Top Left) */}
      <g transform="translate(35, 45)">
        <circle cx="25" cy="25" r="22" fill="#894EFF" />
        <text x="25" y="32" textAnchor="middle" fontSize="18">💃</text>
        <rect x="4" y="44" width="42" height="14" rx="4" fill="#251436" />
        <text x="25" y="54" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">DANCE BEAST</text>
      </g>

      {/* Avatar Node 2 (Top Right) */}
      <g transform="translate(255, 45)">
        <circle cx="25" cy="25" r="22" fill="#F02A8A" />
        <text x="25" y="32" textAnchor="middle" fontSize="18">🕺</text>
        <rect x="6" y="44" width="38" height="14" rx="4" fill="#251436" />
        <text x="25" y="54" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">3-TAALI PRO</text>
      </g>

      {/* Avatar Node 3 (Bottom Center) */}
      <g transform="translate(145, 140)">
        <circle cx="25" cy="25" r="22" fill="#08A98D" />
        <text x="25" y="32" textAnchor="middle" fontSize="18">🍜</text>
        <rect x="4" y="44" width="42" height="14" rx="4" fill="#251436" />
        <text x="25" y="54" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">CHAI & CHILL</text>
      </g>

      {/* Avatar Node 4 (Top Center) */}
      <g transform="translate(145, 10)">
        <circle cx="25" cy="20" r="16" fill="#FFC928" />
        <text x="25" y="26" textAnchor="middle" fontSize="14">✨</text>
      </g>
    </svg>
  </div>
);
