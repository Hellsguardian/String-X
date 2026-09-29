# STRING X — Design System & Visual Aesthetics

## 1. Design Language Overview

STRING X features a distinctive **Neo-Brutalist Festive** design system combining vibrant Indian festival aesthetics with high-contrast graphic borders, deep plum typography, bold offset drop-shadows, and playful micro-animations.

---

## 2. Color Palette (Extracted Tokens)

Defined in `src/index.css` and applied across components:

| Color Name | Token / Utility | HEX Value | Usage in STRING X |
|---|---|---|---|
| **Deep Plum** | `--sx-bg-dark`, `--sx-text`, `--sx-border` | `#251436` | Primary text, borders, dark cards, countdown background |
| **Canvas Lavender** | `--sx-bg-light` | `#E3E0F5` | Main application background, light surface |
| **Vibrant Purple** | `--sx-purple` | `#894EFF` | Primary action buttons, brand accents, glowing indicators |
| **Hot Pink** | `--sx-pink` | `#F02A8A` | Signature STRING X string, dancer silhouettes, playful badges |
| **Festive Yellow**| `--sx-yellow` | `#FFC928` | Event highlight tags, celebration sparkles, secondary buttons |
| **Emerald Teal** | `--sx-teal` | `#08A98D` | Verification badges, safety assurances, success confirmations |
| **Track Lavender**| `--sx-track` | `#D4CEEF` | Inactive sliders, progress tracks, disabled button backgrounds |
| **Muted Border** | `--sx-muted-border` | `#B8B0C5` | Subtle dividers and hairline card borders |
| **Pure White** | `--sx-white` | `#FFFFFF` | Input backgrounds, modal cards, pill buttons |
| **Gradient Accent**| — | `#894EFF` $\to$ `#F02A8A` $\to$ `#FFC928` | Multi-stop connecting progress bar |

---

## 3. Typography

- **Primary Font Family:** `'Plus Jakarta Sans', sans-serif` (Imported via Google Fonts in `index.html`).
- **Heading Styles:**
  - **Screen Titles (H1/H2):** `font-black text-2xl sm:text-3xl text-[#251436] tracking-tight leading-tight`.
  - **Banner Titles:** `font-black text-[22px] sm:text-[28px] uppercase tracking-tight text-white`.
  - **Section Badges:** `font-black text-[10px] sm:text-xs tracking-wider uppercase`.
- **Body & Subtitles:**
  - **Subtext:** `font-semibold text-xs sm:text-[13px] text-[#251436]/70 leading-snug`.
  - **Field Labels:** `font-bold text-xs uppercase tracking-wider text-[#251436]/70 mb-1.5`.
- **Button Typography:** `font-extrabold text-sm sm:text-base`.

---

## 4. Neo-Brutalist Border & Shadow System

STRING X relies on sharp, high-contrast borders and solid offset drop shadows rather than blurry elevation:

- **Borders:**
  - Thin: `border-2 border-[#251436]` (Chips, pills, headers).
  - Thick / Primary: `border-3 border-[#251436]` (Inputs, primary buttons, modal cards).
  - Heavy: `border-4 border-[#251436]` (Desktop phone frame, verification badge).
- **Hard Drop Shadows:**
  - Small: `shadow-[1.5px_1.5px_0px_#251436]` (Header counters, tags).
  - Medium: `shadow-[3px_3px_0px_#251436]` (Inputs, secondary cards).
  - Large / Buttons: `shadow-[4px_4px_0px_#251436]` (Primary buttons).
  - Frame / Dialogs: `shadow-[8px_8px_0px_#251436]` to `shadow-[10px_10px_0px_#251436]`.
- **Press State Interaction:**
  - On tap: `active:translate-y-1 active:shadow-[1px_1px_0px_#251436]`. Creates an authentic mechanical tactile button press.

---

## 5. Animation Conventions (`motion/react`)

1. **Step Page Transitions:**
   ```tsx
   <motion.div
     key={step}
     initial={{ opacity: 0, x: 25 }}
     animate={{ opacity: 1, x: 0 }}
     exit={{ opacity: 0, x: -25 }}
     transition={{ duration: 0.22, ease: 'easeInOut' }}
   />
   ```
2. **Modal Dialogs:**
   ```tsx
   transition={{ type: "spring", stiffness: 350, damping: 25 }}
   ```
3. **Connecting Pink String:**
   - Path length oscillating from 0.3 to 1 with an infinite reverse loop:
   ```tsx
   animate={{ pathLength: 1, opacity: 1 }}
   transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
   ```

---

## 6. Viewport & Mobile Responsive Rules

- **Mobile Viewport (< 640px / sm):**
  - Full viewport bleed (`w-full h-full min-h-[100dvh] max-h-[100dvh]`).
  - Safe-area insets: `pt-[max(14px,env(safe-area-inset-top,0px))]` and `pb-[max(12px,env(safe-area-inset-bottom,0px))]`.
  - Zero outer frames, zero margins, native app feel.
- **Desktop Viewport ($\ge$ 640px / sm):**
  - Centered preview container (`max-w-[400px]`, `h-[844px]`).
  - Rounded phone frame (`rounded-[44px]`, `border-4 border-[#251436]`).
  - Phone speaker notch simulated at top.
  - Floating background stickers and statement text rendered on large monitors ($\ge$ 1280px / xl).
- **Scrollbar Elimination:** Custom `.no-scrollbar` utility prevents unsightly desktop and mobile scrollbars from breaking card layouts.
