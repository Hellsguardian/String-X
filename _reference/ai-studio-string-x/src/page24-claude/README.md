# Page24 — STRING X Match Reveal ("Strings attached")

## 1. What Page24 is

Page 24 is the screen a student sees when their Garba partner is revealed. It shows:

- A lavender night sky with a moon and clouds.
- A flat 2D illustration of the Parul University main gate, with campus buildings, a water tower, trees and the paved plaza.
- A twisted neon rope with a light spark travelling along it.
- Two polaroids hanging from the rope on yellow clothespins and swinging gently. The left one is the current user and the right one is the match, each with a tilted year card.
- A white tilted card that says "STRINGS ATTACHED / You found your Garba partner."
- A "COMMON INTERESTS" row with up to three chips.
- A primary "Say Kem Cho to …" button.

This folder is a straight port of the finalized design source. The SVG artwork is the original markup, moved into `assets/` unchanged apart from renamed ids and the font name. All CSS values are copied 1:1 from the source. A pixel comparison against the original design at 390 × 844 (2× DPR) differed on about 0.01% of pixels, all of them anti-aliasing at the edges of rotated or blurred shapes.

## 2. Entry component

`Page24` (default and named export of `Page24/index.ts`).

```tsx
import { Page24 } from './Page24';
```

`Page24View` is also exported. It is the bare fixed 390 × 844 stage without the viewport fitting, for advanced use only.

## 3. Props

| Prop | Type | Required | Notes |
|---|---|---|---|
| `currentUser` | `{ name, photoUrl?, year, yearBadge?, course?, interests? }` | yes | Left polaroid. Only the first word of `name` is shown. |
| `matchedUser` | `{ name, age?, photoUrl?, year, yearBadge?, course?, interests? }` | yes | Right polaroid, card subtitle and CTA. |
| `commonInterests` | `string[]` | no | Chips (max 3). If omitted, the page uses the intersection of both users' `interests`, falling back to `matchedUser.interests`. The section is hidden if the list is empty. |
| `copy` | `Partial<Page24Copy>` | no | Override any visible text (see `types.ts`). |
| `layout` | `'fullscreen' \| 'fill'` | no | `'fullscreen'` (default) sizes to the viewport using `100dvh`. `'fill'` fills the parent box. |
| `className` | `string` | no | Added to the outermost element. |

`year` can be `1`–`5` (shown as "1st"…"5th" with the caption "YEAR"), `'PG'`, or any string, which is shown as-is. `yearBadge: { value, caption }` overrides the card completely.

`photoUrl` can be missing or fail to load. In that case the design's gradient silhouette is shown instead, so the layout never breaks.

## 4. Callbacks

| Callback | Fired by |
|---|---|
| `onBack()` | The white back button in the header. |
| `onMessage()` | The purple "Say Kem Cho to …" button. |

The design has only these two actions. There is no router inside Page24; the host app decides where each one navigates.

## 5. Dependencies

The only external package is `react` (with `react-dom` in the host), version 18 or 19.

The page also relies on two things a standard **Vite** setup already provides:

- CSS imports from TypeScript, with `url()` font files resolved and bundled.
- `?raw` imports of `.svg` files. Types for these ship in `page24-env.d.ts`.

## 6. Assets (`assets/`)

| File | What it is |
|---|---|
| `sky.svg` | Sky gradient, moon glow and moon, clouds. |
| `campus-gate.svg` | Parul University main gate, colonnades, campus buildings, water tower, trees, plaza, sculpture. |
| `rope.svg` | Twisted neon rope: shadow, glow, outline, body, twist strands, highlight and the animated spark (`.p24-rope-flow`). |
| `photo-placeholder-current.svg` | Violet silhouette shown when the current user has no photo. |
| `photo-placeholder-match.svg` | Pink silhouette shown when the match has no photo. |
| `icon-back.svg` | Back arrow (uses `currentColor`). |
| `icon-arrow-right.svg` | CTA arrow (uses `currentColor`). |

All of these are rendered inline, not as `<img>`, for three reasons: CSS animation can reach the rope spark, the gate lettering can use the bundled Cinzel font, and the icons can inherit their colour.

## 7. Fonts (`fonts/`, declared in `styles/fonts.css`)

All three are self-hosted, under the SIL Open Font License; the licence files are included. Each font is registered under a `P24 …` family name so it can never clash with the host app's fonts.

| Family | Files | Weights | Used for |
|---|---|---|---|
| `P24 Plus Jakarta Sans` | `plus-jakarta-sans-latin-400-800.woff2`, `plus-jakarta-sans-latin-ext-400-800.woff2` (variable) | 400–800 (uses 600, 700, 800) | All UI text |
| `P24 JetBrains Mono` | `jetbrains-mono-latin-variable.woff2`, `jetbrains-mono-latin-ext-variable.woff2` (variable) | 500, 700 (uses 700) | "YEAR" captions and the "COMMON INTERESTS" label |
| `P24 Cinzel` | `cinzel-latin-700.woff2`, `cinzel-latin-ext-700.woff2` | 700 | "PARUL" and "UNIVERSITY" on the gate |

## 8. Importing into another React/Vite project

1. Copy the whole `Page24/` folder into the project's `src/`.
2. `import { Page24 } from './Page24';` (adjust the relative path).
3. Render `<Page24 currentUser={…} matchedUser={…} onBack={…} onMessage={…} />`.

That's all. No global CSS, wrapper, provider or router is needed. See `INTEGRATION.md` for the full step-by-step guide.

## How it adapts to every phone

The design is a fixed 390 × 844 stage. `Page24` measures the space available inside the device safe areas (notch and home bar) and scales the whole stage uniformly to fit. On taller phones the extra space at the top shows sky lavender and the extra space at the bottom shows night purple, so the page always looks edge to edge. Positions and proportions never shift, because everything scales together.

It re-measures on resize, on rotation and when the mobile browser toolbar or Android WebView viewport changes. The polaroid swing and the rope spark are switched off when the device has "reduce motion" enabled.

## Folder tree

```
Page24/
├── index.ts                 public exports
├── Page24.tsx               entry: props → view model, viewport fit, CSS imports
├── Page24View.tsx           the fixed 390×844 stage (layer order)
├── types.ts                 public prop types
├── page24-env.d.ts          types for `*.svg?raw`
├── README.md
├── INTEGRATION.md
├── components/
│   ├── InlineSvg.tsx        inline renderer for the local SVG assets
│   ├── SkyLayer.tsx
│   ├── CampusGate.tsx
│   ├── RopeString.tsx
│   ├── Header.tsx
│   ├── HangingPolaroid.tsx
│   ├── PolaroidPhoto.tsx
│   ├── YearBadge.tsx
│   ├── Clothespin.tsx
│   ├── MatchSticker.tsx
│   ├── CommonInterests.tsx
│   └── MessageButton.tsx
├── hooks/
│   └── useStageScale.ts
├── utils/
│   └── format.ts
├── styles/
│   ├── Page24.css           all layout/visual styles, scoped to .p24-*
│   └── fonts.css            @font-face rules
├── assets/                  7 SVG files (see above)
└── fonts/                   6 .woff2 files + 3 OFL licence files
```
