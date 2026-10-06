import React from 'react';

/**
 * CampusNightChatBackground
 * 
 * Evening campus environment for STRING X chat screen (Page 25):
 * - Layer 1: Deep plum dark purple night sky (#251436)
 * - Layer 2: Atmospheric clouds, pale glowing moon, and sparse 4-point stars
 * - Layer 3: Refined assets/buildings.svg skyline:
 *   • Controlled horizontal crop (narrower central composition) making skyscrapers feel taller & denser
 *   • Proportional scaling with zero distortion
 *   • Subtly reduced opacity (~0.8) and upper atmospheric gradient fade into the night sky
 *   • Soft blending into the deep plum background while keeping warm yellow windows crisp & subtle
 * - Layer 4: Chat input bar and conversation UI sitting on top
 */
export const CampusNightChatBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 bg-[#251436]">
      {/* 1. Page 25 dark purple background & atmospheric elements */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 360 640"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sky-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#251436" />
            <stop offset="50%" stopColor="#210F33" />
            <stop offset="100%" stopColor="#180728" />
          </linearGradient>
        </defs>

        {/* Sky Background Base */}
        <rect width="360" height="640" fill="url(#sky-gradient)" />

        {/* Atmospheric Upper Clouds */}
        <g id="sky-clouds" opacity="0.38">
          <path
            d="M 28 85 C 28 78 33 73 40 73 C 44 73 48 75 50 78 C 53 75 58 73 63 73 C 70 73 76 78 76 85 Z"
            fill="#3B185A"
          />
          <path
            d="M 230 92 C 230 86 235 81 241 81 C 245 81 248 83 250 86 C 253 83 257 82 261 82 C 267 82 272 86 272 92 Z"
            fill="#351652"
          />
          <path
            d="M 85 125 C 85 120 89 116 95 116 C 98 116 101 118 103 120 C 105 117 109 116 113 116 C 118 116 123 120 123 125 Z"
            fill="#3F1B60"
            opacity="0.6"
          />
          <path
            d="M 285 142 C 285 138 288 135 293 135 C 296 135 298 136 300 138 C 302 136 305 135 308 135 C 313 135 317 138 317 142 Z"
            fill="#381756"
            opacity="0.5"
          />
        </g>

        {/* Pale Glowing Moon on Upper-Right */}
        <g id="sky-moon">
          <circle cx="295" cy="355" r="23" fill="#FFF2D6" opacity="0.12" />
          <circle cx="295" cy="355" r="19" fill="#FFF2D6" opacity="0.18" />
          <circle cx="295" cy="355" r="15" fill="#FFF2D6" />
        </g>

        {/* Sparse Tiny 4-Point Stars & Dots */}
        <g id="sky-stars">
          <path
            d="M 166 312 L 167.5 315.5 L 171 317 L 167.5 318.5 L 166 322 L 164.5 318.5 L 161 317 L 164.5 315.5 Z"
            fill="#E3E0F5"
            opacity="0.65"
          />
          <path
            d="M 252 352 L 253.5 355.5 L 257 357 L 253.5 358.5 L 252 362 L 250.5 358.5 L 247 357 L 250.5 355.5 Z"
            fill="#FFF2D6"
            opacity="0.75"
          />
          <path
            d="M 64 330 L 65.5 333.5 L 69 335 L 65.5 336.5 L 64 340 L 62.5 336.5 L 59 335 L 62.5 333.5 Z"
            fill="#E3E0F5"
            opacity="0.6"
          />
          <path
            d="M 312 322 L 313 325 L 316 326 L 313 327 L 312 330 L 311 327 L 308 326 L 311 325 Z"
            fill="#E3E0F5"
            opacity="0.5"
          />
          <circle cx="25" cy="360" r="1" fill="#E3E0F5" opacity="0.55" />
          <circle cx="106" cy="318" r="1.2" fill="#E3E0F5" opacity="0.6" />
          <circle cx="138" cy="342" r="1" fill="#E3E0F5" opacity="0.5" />
          <circle cx="226" cy="358" r="1.2" fill="#E3E0F5" opacity="0.65" />
          <circle cx="334" cy="376" r="1" fill="#E3E0F5" opacity="0.45" />
        </g>
      </svg>

      {/* 2. City Skyline Asset: assets/buildings.svg */}
      <div
        className="absolute bottom-0 inset-x-0 overflow-hidden pointer-events-none select-none z-0"
        style={{
          height: '46%',
          minHeight: '270px',
          maxHeight: '380px',
          opacity: 0.8,
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 7%, rgba(0,0,0,0.9) 18%, black 30%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 7%, rgba(0,0,0,0.9) 18%, black 30%, black 100%)',
        }}
      >
        <img
          src="/assets/buildings.svg"
          alt="City buildings"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none select-none max-w-none"
          style={{
            width: '152%',
            height: 'auto',
            minHeight: '100%',
            objectFit: 'cover',
            objectPosition: 'bottom center',
          }}
        />
      </div>

      {/* Subtle grounding fade along the bottom edge behind the input composer */}
      <div
        className="absolute bottom-0 inset-x-0 h-16 pointer-events-none select-none z-0"
        style={{
          background: 'linear-gradient(to top, rgba(37,20,54,0.7) 0%, rgba(37,20,54,0) 100%)',
        }}
      />
    </div>
  );
};
