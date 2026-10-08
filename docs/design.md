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
| **Hot Pink** | `--sx-pink` | `#F02A8A` | Signature STRING X string, dancer silhouettes, playful badges, alert accents |
| **Festive Yellow**| `--sx-yellow` | `#FFC928` | Event highlight tags, celebration sparkles, pending verification status |
| **Emerald Teal** | `--sx-teal` | `#08A98D` | Verification badges, safety assurances, verified student checkmarks |
| **Alert Maroon** | — | `#800020` | Rejection banner headlines and critical error alerts |
| **Alert Pink Soft**| — | `#FFF0F3` | Rejection banner container background with `#FF4F81` border |
| **Track Lavender**| `--sx-track` | `#D4CEEF` | Inactive sliders, progress tracks, disabled button backgrounds |
| **Muted Border** | `--sx-muted-border` | `#B8B0C5` | Subtle dividers and hairline card borders |
| **Pure White** | `--sx-white` | `#FFFFFF` | Input backgrounds, modal cards, pill buttons |
| **Gradient Accent**| — | `#894EFF` $\to$ `#F02A8A` $\to$ `#FFC928` | Multi-stop connecting progress bar |

---

## 3. Verification State Semantic Visual Treatment

The verification subsystem renders explicit visual cues across three authoritative states:

| Verification State | Visual Indicators | UI Component Treatment | Matchmaking Access |
|---|---|---|---|
| **`pending`** | Amber / Yellow (`#FFC928`) | Default state upon onboarding submission; displays pending badges and allows continued exploration. | Allowed to participate in event registration |
| **`verified`** | Emerald Teal (`#08A98D`) | Green verification check beside user name in profile and home; verified student trust badge active. | Full matchmaking participation unlocked |
| **`rejected`** | Alert Pink (`#FFF0F3` bg, `#800020` text, `#F02A8A` badge) | Dynamic rejection alert card at top of `/home`; shows specific reason and targeted action buttons (`Update Profile Photo` / `Re-verify Face`). | **LOCKED** (CTA redirects to correction flow) |

---

## 4. Typography

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

## 5. Neo-Brutalist Border & Shadow System

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

## 6. Animation Conventions (`motion/react`)

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

## 7. Viewport & Mobile Responsive Rules

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

---

## 8. Match Reveal & Messaging Visual Aesthetic

### Screen 24: Match Reveal ("It's a Match!")
- **Aesthetic Theme:** Atmospheric night celebration with festive ambient gradients on dark plum surface (`#160624`).
- **Dual Photo Frames:** Side-by-side or overlapping card portraits with rounded frames, high-contrast borders, and glowing pink connecting string elements.
- **Badges & Vibe Tags:** Floating compatibility percentage badge and chip tags for mutual college, department, and festival interests.
- **Primary Action CTA:** Full-width tactile electric purple button (`#894EFF`) labeled "Send a Message" with active mechanical offset shadow feedback.

### Screen 25: 1-to-1 Campus Chat
- **Atmospheric Background:** Custom illustrated `<CampusNightChatBackground />` representing campus architecture under evening festival lights.
- **Frosted Header Bar:** Deep plum translucent navigation header (`bg-[#251436]/90 backdrop-blur-md`) with subtle border, back button, partner avatar with emerald active dot (`#08A98D`), and partner metadata.
- **Message Bubble System:**
  - **User Bubbles:** Electric purple (`bg-[#894EFF]`), crisp white text, timestamp, and green double-check icon (`#08A98D`). Rounded corners with `rounded-br-xs`.
  - **Partner Bubbles:** Deep plum (`bg-[#1B0B2A]` with `border border-[#894EFF]/30`), soft lavender text, and timestamp. Rounded corners with `rounded-bl-xs`.
- **Suggested Starter Chips:** Tactile icebreaker chips shown in empty conversations for quick conversation kickoff.
- **Message Composer:** Bottom-anchored frosted bar with rounded pill input and circular purple send button.
