import React from 'react';

/**
 * CampusNightChatBackground
 * 
 * High-craftsmanship 2D metropolitan skyline for the STRING X chat screen:
 * - Solid dark purple night sky (#251436)
 * - Simple flat rounded clouds at the top (preserved exactly)
 * - Open, spacious central corridor for conversation readability
 * - 3-tier architectural skyscraper skyline (approx. 10-12 distinct towers):
 *   • Background layer: 6 slender distant megatowers & spires with low-contrast silhouettes
 *   • Middle layer: 5 prominent skyscrapers with stepped setbacks, ribbon windows,
 *     vertical mullions, and antenna masts
 *   • Foreground layer: 4 large, detailed modern high-rises with rooftop pergolas,
 *     asymmetric terraces, horizontal copings, and crisp Warm Yellow (#FFC928) windows
 * - Strictly 2D/flat-vector: no 3D, no glow, no bloom, no neon, no photorealism.
 */
export const CampusNightChatBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 bg-[#251436]">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 360 640"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ========================================================== */}
        {/* 1. TOP CLOUDS: Preserved exactly as requested             */}
        {/* ========================================================== */}
        <g id="top-clouds">
          {/* Cloud 1 - Top Left */}
          <path
            d="M 32 78 C 32 71 37 66 44 66 C 48 66 52 68 54 71 C 57 68 62 66 67 66 C 74 66 80 71 80 78 Z"
            fill="#3C1E5E"
            opacity="0.45"
          />

          {/* Cloud 2 - Top Right */}
          <path
            d="M 238 88 C 238 82 243 77 249 77 C 253 77 256 79 258 82 C 261 79 265 78 269 78 C 275 78 280 82 280 88 Z"
            fill="#381B58"
            opacity="0.4"
          />

          {/* Cloud 3 - Mid-Left lower puff */}
          <path
            d="M 88 116 C 88 111 92 107 98 107 C 101 107 104 109 106 111 C 108 108 112 107 116 107 C 121 107 126 111 126 116 Z"
            fill="#42279C"
            opacity="0.25"
          />

          {/* Cloud 4 - Far-Right lower puff */}
          <path
            d="M 288 132 C 288 128 291 125 296 125 C 299 125 301 126 303 128 C 305 126 308 125 311 125 C 316 125 320 128 320 132 Z"
            fill="#371B55"
            opacity="0.3"
          />
        </g>

        {/* ========================================================== */}
        {/* 2. CENTER AREA: Kept completely empty for chat readability */}
        {/* ========================================================== */}

        {/* ========================================================== */}
        {/* 3. METROPOLITAN SKYLINE (Layered Architectural Towers)     */}
        {/* ========================================================== */}
        <g id="metropolitan-skyline">
          {/* -------------------------------------------------------- */}
          {/* 3A. BACKGROUND LAYER: Slender Distant Megatowers & Spires*/}
          {/* -------------------------------------------------------- */}
          <g id="skyline-background-layer" fill="#1A0826">
            {/* BG Tower 1 (Far Left Needle Spire Tower) - Spire reaches y:342 */}
            <g id="bg-tower-1">
              <line x1="21" y1="342" x2="21" y2="366" stroke="#E3E0F5" strokeWidth="1" opacity="0.35" />
              <rect x="16" y="366" width="10" height="14" />
              <rect x="12" y="380" width="18" height="20" />
              <rect x="8" y="400" width="26" height="240" />
              {/* Slender vertical window slits */}
              <rect x="14" y="412" width="3.5" height="7" fill="#FFC928" opacity="0.35" />
              <rect x="22" y="412" width="3.5" height="7" fill="#FFC928" opacity="0.35" />
              <rect x="14" y="428" width="3.5" height="7" fill="#FFC928" opacity="0.3" />
            </g>

            {/* BG Tower 2 (Left-Mid Glass High-Rise with Angled Roof Crest) */}
            <g id="bg-tower-2">
              <polygon points="46,396 82,382 82,640 46,640" />
              <line x1="64" y1="389" x2="64" y2="580" stroke="#E3E0F5" strokeWidth="0.8" opacity="0.18" />
              <rect x="52" y="405" width="4" height="6" fill="#FFC928" opacity="0.35" />
              <rect x="70" y="405" width="4" height="6" fill="#FFC928" opacity="0.35" />
              <rect x="52" y="422" width="4" height="6" fill="#FFC928" opacity="0.3" />
            </g>

            {/* BG Tower 3 (Center-Left Pencil Tower) */}
            <g id="bg-tower-3">
              <line x1="117" y1="372" x2="117" y2="388" stroke="#E3E0F5" strokeWidth="0.8" opacity="0.3" />
              <rect x="105" y="388" width="24" height="252" />
              <rect x="111" y="400" width="4" height="6" fill="#FFC928" opacity="0.35" />
              <rect x="111" y="414" width="4" height="6" fill="#FFC928" opacity="0.3" />
              <rect x="111" y="428" width="4" height="6" fill="#FFC928" opacity="0.35" />
            </g>

            {/* BG Tower 4 (Center Art-Deco Spire Landmark) - Spire reaches y:348 */}
            <g id="bg-tower-4">
              <line x1="189" y1="348" x2="189" y2="370" stroke="#E3E0F5" strokeWidth="1" opacity="0.35" />
              <rect x="183" y="370" width="12" height="14" />
              <rect x="177" y="384" width="24" height="18" />
              <rect x="172" y="402" width="34" height="238" />
              <rect x="178" y="414" width="4" height="6" fill="#FFC928" opacity="0.35" />
              <rect x="188" y="414" width="4" height="6" fill="#FFC928" opacity="0.35" />
              <rect x="198" y="414" width="4" height="6" fill="#FFC928" opacity="0.35" />
            </g>

            {/* BG Tower 5 (Center-Right High-Rise with Dual Masts) */}
            <g id="bg-tower-5">
              <line x1="238" y1="365" x2="238" y2="386" stroke="#E3E0F5" strokeWidth="0.8" opacity="0.3" />
              <line x1="252" y1="372" x2="252" y2="386" stroke="#E3E0F5" strokeWidth="0.8" opacity="0.3" />
              <rect x="232" y="386" width="30" height="254" />
              <rect x="238" y="398" width="4" height="6" fill="#FFC928" opacity="0.35" />
              <rect x="250" y="398" width="4" height="6" fill="#FFC928" opacity="0.35" />
              <rect x="238" y="414" width="4" height="6" fill="#FFC928" opacity="0.3" />
            </g>

            {/* BG Tower 6 (Far Right Slender High-Rise) */}
            <g id="bg-tower-6">
              <line x1="328" y1="362" x2="328" y2="376" stroke="#E3E0F5" strokeWidth="0.8" opacity="0.3" />
              <rect x="314" y="376" width="28" height="264" />
              <rect x="320" y="388" width="4" height="6" fill="#FFC928" opacity="0.35" />
              <rect x="330" y="388" width="4" height="6" fill="#FFC928" opacity="0.35" />
            </g>
          </g>

          {/* -------------------------------------------------------- */}
          {/* 3B. MIDDLE LAYER: 5 Recognizable Skyscraper Silhouettes   */}
          {/* -------------------------------------------------------- */}
          <g id="skyline-middle-layer" fill="#280F3B">
            {/* MID TOWER 1 (Far Left Modern High-Rise with Horizontal Ribbon Windows) */}
            <g id="mid-tower-1">
              {/* Stepped crown */}
              <rect x="-4" y="412" width="38" height="6" fill="#35144C" />
              <rect x="-6" y="418" width="42" height="222" />
              {/* Horizontal glass ribbon bands */}
              <rect x="0" y="430" width="28" height="4.5" rx="0.5" fill="#FFC928" opacity="0.85" />
              <rect x="0" y="445" width="28" height="4.5" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="0" y="460" width="28" height="4.5" rx="0.5" fill="#FFC928" opacity="0.8" />
              <rect x="0" y="478" width="28" height="4.5" rx="0.5" fill="#FFC928" opacity="0.85" />
              <rect x="0" y="502" width="28" height="4.5" rx="0.5" fill="#FFC928" opacity="0.75" />
            </g>

            {/* MID TOWER 2 (Left Landmark Skyscraper with Multi-Tier Setbacks & Vertical Columns) */}
            <g id="mid-tower-2">
              {/* Slender antenna mast */}
              <line x1="81" y1="376" x2="81" y2="396" stroke="#E3E0F5" strokeWidth="1.2" opacity="0.45" />
              {/* Setback Tier 1 */}
              <rect x="73" y="396" width="16" height="16" fill="#331448" />
              {/* Setback Tier 2 */}
              <rect x="63" y="412" width="36" height="18" fill="#301244" />
              {/* Main Shaft */}
              <rect x="54" y="430" width="54" height="210" />
              {/* Vertical facade mullion lines */}
              <line x1="72" y1="430" x2="72" y2="580" stroke="#E3E0F5" strokeWidth="0.8" opacity="0.14" />
              <line x1="90" y1="430" x2="90" y2="580" stroke="#E3E0F5" strokeWidth="0.8" opacity="0.14" />
              {/* 3 Columns of windows with authentic high-rise density */}
              <rect x="60" y="442" width="5.5" height="9" rx="0.5" fill="#FFC928" opacity="0.9" />
              <rect x="78" y="442" width="5.5" height="9" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="96" y="442" width="5.5" height="9" rx="0.5" fill="#FFC928" opacity="0.85" />

              <rect x="60" y="460" width="5.5" height="9" rx="0.5" fill="#FFC928" opacity="0.8" />
              <rect x="96" y="460" width="5.5" height="9" rx="0.5" fill="#FFC928" opacity="0.8" />

              <rect x="60" y="478" width="5.5" height="9" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="78" y="478" width="5.5" height="9" rx="0.5" fill="#FFC928" opacity="0.9" />
              <rect x="96" y="478" width="5.5" height="9" rx="0.5" fill="#FFC928" opacity="0.85" />

              <rect x="60" y="504" width="5.5" height="9" rx="0.5" fill="#FFC928" opacity="0.85" />
              <rect x="96" y="504" width="5.5" height="9" rx="0.5" fill="#FFC928" opacity="0.7" />
            </g>

            {/* MID TOWER 3 (Mid-Left Narrow Glass Tower with Rooftop Mechanical Box) */}
            <g id="mid-tower-3">
              {/* Mechanical box with louver frame */}
              <rect x="122" y="428" width="18" height="10" fill="#321348" />
              <rect x="114" y="438" width="34" height="202" />
              {/* Vertical facade slit */}
              <line x1="131" y1="438" x2="131" y2="580" stroke="#E3E0F5" strokeWidth="0.8" opacity="0.12" />
              {/* Windows */}
              <rect x="120" y="450" width="5" height="8" rx="0.5" fill="#FFC928" opacity="0.85" />
              <rect x="135" y="450" width="5" height="8" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="120" y="472" width="5" height="8" rx="0.5" fill="#FFC928" opacity="0.7" />
              <rect x="135" y="492" width="5" height="8" rx="0.5" fill="#FFC928" opacity="0.85" />
              <rect x="120" y="516" width="5" height="8" rx="0.5" fill="#FFC928" opacity="0.8" />
            </g>

            {/* MID TOWER 4 (Center-Right Modern Corporate High-Rise) */}
            <g id="mid-tower-4">
              {/* Rooftop communication mast */}
              <line x1="234" y1="396" x2="234" y2="414" stroke="#E3E0F5" strokeWidth="1" opacity="0.4" />
              {/* Stepped crown */}
              <rect x="222" y="414" width="24" height="10" fill="#331448" />
              <rect x="212" y="424" width="46" height="216" />
              {/* Horizontal floor demarcation */}
              <line x1="212" y1="472" x2="258" y2="472" stroke="#E3E0F5" strokeWidth="0.8" opacity="0.12" />
              {/* Window grid */}
              <rect x="220" y="434" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.9" />
              <rect x="232" y="434" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.8" />
              <rect x="244" y="434" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.85" />

              <rect x="220" y="450" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="244" y="450" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.8" />

              <rect x="220" y="486" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.85" />
              <rect x="232" y="486" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.7" />
              <rect x="244" y="486" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.9" />

              <rect x="220" y="512" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="244" y="512" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.8" />
            </g>

            {/* MID TOWER 5 (Far Right Stepped Corporate Tower) */}
            <g id="mid-tower-5">
              <rect x="294" y="408" width="36" height="10" fill="#321348" />
              <rect x="284" y="418" width="76" height="222" />
              {/* Windows */}
              <rect x="298" y="430" width="6" height="9" rx="0.5" fill="#FFC928" opacity="0.85" />
              <rect x="312" y="430" width="6" height="9" rx="0.5" fill="#FFC928" opacity="0.8" />
              <rect x="328" y="430" width="6" height="9" rx="0.5" fill="#FFC928" opacity="0.75" />

              <rect x="298" y="452" width="6" height="9" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="328" y="452" width="6" height="9" rx="0.5" fill="#FFC928" opacity="0.85" />

              <rect x="298" y="482" width="6" height="9" rx="0.5" fill="#FFC928" opacity="0.9" />
              <rect x="312" y="482" width="6" height="9" rx="0.5" fill="#FFC928" opacity="0.7" />
              <rect x="328" y="482" width="6" height="9" rx="0.5" fill="#FFC928" opacity="0.8" />
            </g>
          </g>

          {/* -------------------------------------------------------- */}
          {/* 3C. FOREGROUND LAYER: 4 Detailed Large High-Rises        */}
          {/* -------------------------------------------------------- */}
          <g id="skyline-foreground-layer" fill="#351752">
            {/* FG BUILDING 1 (Left High-Rise with Open Rooftop Pergola & Facade Mullions) */}
            <g id="fg-building-1">
              {/* Rooftop architectural open frame pergola */}
              <rect x="20" y="440" width="38" height="8" fill="none" stroke="#481F6E" strokeWidth="1.5" />
              <line x1="32" y1="440" x2="32" y2="448" stroke="#481F6E" strokeWidth="1.2" />
              <line x1="44" y1="440" x2="44" y2="448" stroke="#481F6E" strokeWidth="1.2" />

              {/* Main building block */}
              <rect x="16" y="448" width="48" height="192" fill="#371754" />
              {/* Roof ledge coping */}
              <rect x="14" y="446" width="52" height="2.5" fill="#4B2072" />
              {/* Vertical facade stripe */}
              <line x1="40" y1="448" x2="40" y2="600" stroke="#E3E0F5" strokeWidth="0.8" opacity="0.15" />
              {/* Crisp vertical window pairs */}
              <rect x="25" y="462" width="6.5" height="9.5" rx="0.5" fill="#FFC928" opacity="0.9" />
              <rect x="49" y="462" width="6.5" height="9.5" rx="0.5" fill="#FFC928" opacity="0.8" />
              <rect x="25" y="486" width="6.5" height="9.5" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="49" y="486" width="6.5" height="9.5" rx="0.5" fill="#FFC928" opacity="0.85" />
              <rect x="25" y="518" width="6.5" height="9.5" rx="0.5" fill="#FFC928" opacity="0.8" />
            </g>

            {/* FG BUILDING 2 (Low-Profile Center Podium - Keeps Conversation Space Clean) */}
            <g id="fg-podium-center">
              <rect x="134" y="486" width="68" height="154" fill="#2E1246" />
              {/* Sleek horizontal coping */}
              <rect x="132" y="484" width="72" height="2.5" fill="#401A61" />
              {/* Row of glowing corporate windows */}
              <rect x="144" y="498" width="6.5" height="8" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="160" y="498" width="6.5" height="8" rx="0.5" fill="#FFC928" opacity="0.85" />
              <rect x="176" y="498" width="6.5" height="8" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="192" y="498" width="6.5" height="8" rx="0.5" fill="#FFC928" opacity="0.7" />
              <rect x="144" y="522" width="6.5" height="8" rx="0.5" fill="#FFC928" opacity="0.8" />
              <rect x="176" y="522" width="6.5" height="8" rx="0.5" fill="#FFC928" opacity="0.85" />
            </g>

            {/* FG BUILDING 3 (Right High-Rise with Asymmetric Notch Setback) */}
            <g id="fg-building-3">
              {/* Asymmetric setback tier */}
              <rect x="254" y="432" width="24" height="14" fill="#2F1347" />
              <rect x="242" y="446" width="58" height="194" fill="#371754" />
              <rect x="240" y="444" width="62" height="2.5" fill="#4B2072" />
              {/* Facade line */}
              <line x1="272" y1="446" x2="272" y2="600" stroke="#E3E0F5" strokeWidth="0.8" opacity="0.14" />
              {/* Windows */}
              <rect x="252" y="460" width="6.5" height="9.5" rx="0.5" fill="#FFC928" opacity="0.85" />
              <rect x="276" y="460" width="6.5" height="9.5" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="252" y="484" width="6.5" height="9.5" rx="0.5" fill="#FFC928" opacity="0.8" />
              <rect x="276" y="484" width="6.5" height="9.5" rx="0.5" fill="#FFC928" opacity="0.9" />
              <rect x="276" y="514" width="6.5" height="9.5" rx="0.5" fill="#FFC928" opacity="0.75" />
            </g>

            {/* FG BUILDING 4 (Far Right Overlapping High-Rise) */}
            <g id="fg-building-4">
              <rect x="318" y="456" width="46" height="184" fill="#2B1042" />
              <rect x="316" y="454" width="50" height="2.5" fill="#3D175C" />
              {/* Windows */}
              <rect x="328" y="470" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.85" />
              <rect x="342" y="470" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="328" y="494" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.75" />
              <rect x="342" y="494" width="6" height="8" rx="0.5" fill="#FFC928" opacity="0.85" />
            </g>

            {/* Solid Grounding Base Footer (Anchored behind message composer) */}
            <rect x="-10" y="586" width="380" height="56" fill="#14051F" />
          </g>
        </g>
      </svg>
    </div>
  );
};
