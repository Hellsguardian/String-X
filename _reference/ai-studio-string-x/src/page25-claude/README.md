# Page 25 — Garba partner chat (`src/page25-claude/`)

A self-contained React + TypeScript + CSS implementation of the redesigned String X Page 25 chat screen. It covers:

- **Header:** dark header with back button, ringed avatar, name, "Your Garba partner · Online" status and three-dot menu.
- **Background:** lavender-to-purple sky with clouds, and the city/building illustration anchored above the dark ground.
- **Conversation:** match context pills, the icebreaker carousel, and incoming/outgoing bubbles with timestamps and delivery ticks.
- **Typing:** a typing indicator.
- **Bottom bar:** horizontally scrolling quick-reply chips and the message composer with the violet send button.

Everything this page needs lives in this folder. It does not touch routing, global CSS, Tailwind, the database or any other page.

---

## 1. Production entry

| File | Role |
|---|---|
| **`Page25.tsx`** | **Import this.** Loads the fonts and CSS, handles viewport sizing (dvh + visualViewport + safe areas), applies defaults, runs the send logic and preview mode. |
| `index.ts` | Barrel: `export { Page25, default }` plus all public types and `formatPage25Time`. |
| `Page25View.tsx` | Pure visual composition. It is not a standalone entry, because it relies on `Page25.tsx` for CSS, fonts and state. |

```tsx
import Page25 from './page25-claude';            // default export
// or
import { Page25, type Page25Message } from './page25-claude';
```

## 2. Dependency tree

```
Page25.tsx  (production entry)
 ├─ styles/fonts.css
 │    ├─ fonts/PlusJakartaSans-Variable-latin.woff2   → family "P25 Plus Jakarta Sans" (200–800)
 │    └─ fonts/JetBrainsMono-Bold-latin.woff2         → family "P25 JetBrains Mono" (700)
 ├─ styles/Page25.css
 │    ├─ assets/clouds.svg
 │    ├─ assets/city-skyline.svg
 │    └─ assets/icons/
 │         back.svg · more.svg · send.svg · send-outline.svg
 │         chevron-left.svg · chevron-right.svg
 │         tick-seen.svg · tick-delivered.svg · tick-sent.svg · clock.svg · alert.svg
 ├─ hooks/useVisibleViewportHeight.ts
 ├─ utils/formatTime.ts
 ├─ utils/text.ts
 ├─ utils/demoData.ts            (preview-only defaults)
 ├─ types.ts
 └─ Page25View.tsx
      ├─ hooks/useStickToBottom.ts
      ├─ components/ChatHeader.tsx
      ├─ components/MatchContextBanner.tsx   → utils/text.ts
      ├─ components/IcebreakerCard.tsx
      ├─ components/MessageBubble.tsx
      ├─ components/TypingIndicator.tsx
      ├─ components/QuickReplies.tsx         → utils/text.ts (type)
      └─ components/Composer.tsx
```

The only external import is `react`.

## 3. Required assets (`assets/`)

| Asset | Used for |
|---|---|
| `city-skyline.svg` | Building illustration, two layers of towers with lit windows, ledge and ground strip. Anchored to the bottom of the conversation area. |
| `clouds.svg` | Two soft cloud groups in the sky. |
| `icons/back.svg`, `icons/more.svg` | Header back arrow and three-dot menu. |
| `icons/send.svg` | Filled paper plane in the send button. |
| `icons/send-outline.svg` | Paper plane on the icebreaker prompt. |
| `icons/chevron-left.svg`, `icons/chevron-right.svg` | Icebreaker previous and next. |
| `icons/tick-seen.svg` (teal double), `tick-delivered.svg` (grey double), `tick-sent.svg` (single), `clock.svg` (sending), `alert.svg` (failed) | Outgoing message status. |

All assets are referenced from CSS with relative `url()`, so Vite fingerprints or inlines them automatically. No TypeScript asset declarations are needed.

## 4. Required fonts (`fonts/`)

| File | Family name (Page25-only) | Weights |
|---|---|---|
| `PlusJakartaSans-Variable-latin.woff2` | `P25 Plus Jakarta Sans` | 200–800 (variable) |
| `JetBrainsMono-Bold-latin.woff2` | `P25 JetBrains Mono` | 700 |

Both fonts are under the SIL Open Font License 1.1; the license texts are in `fonts/OFL-*.txt` and must stay alongside the files. They contain the Latin subset, which covers English and Hinglish copy. The `P25` prefix means no other page's typography can change.

## 5. Props (`Page25Props`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `currentUser` | `Page25CurrentUser` `{ id, firstName?, avatarUrl? }` | demo user | `id` decides which bubbles are "mine". |
| `matchedUser` | `Page25MatchedUser` `{ id, name, avatarUrl?, isOnline?, relationshipLabel?, statusText? }` | demo match | Avatar falls back to the first letter of `name`. |
| `messages` | `Page25Message[]` `{ id, senderId, text, createdAt, status?, isOwn? }` | **omitted = preview mode** | Oldest first. When provided, the component is fully controlled. |
| `quickReplies` | `Array<string \| { id?, label, message? }>` | preview: 3 demo chips; controlled: none | `message` is what gets sent (defaults to `label`). |
| `icebreakers` | `string[]` | 6 built-in Hinglish prompts | Pass `[]` to hide the card. |
| `matchContext` | `{ badge?, sharedInterests? }` | preview demo; controlled: none | Renders the dark badge pill and "You both picked …". |
| `isMatchTyping` | `boolean` | `false` | Shows the typing bubble and "typing…" status. |
| `layout` | `'viewport' \| 'fill'` | `'viewport'` | See responsive behaviour below. |
| `inputPlaceholder` | `string` | `'Type your message…'` | |
| `maxMessageLength` | `number` | `1000` | |
| `disabled` | `boolean` | `false` | Disables composer, chips and icebreakers (e.g. unmatched or blocked). |
| `formatTime` | `(createdAt) => string` | `07:42 PM` style | |
| `className` | `string` | — | Added to `.p25-root`. |

`createdAt` accepts an ISO string, epoch milliseconds or a `Date`. `status` can be `'sending' | 'sent' | 'delivered' | 'seen' | 'failed'` and is only shown on your own messages.

## 6. Callbacks

| Callback | When |
|---|---|
| `onBack()` | Header back button. |
| `onSendMessage(text, { source })` | Composer submit (button or Enter), quick-reply chip, or icebreaker prompt. `source` is `'composer' \| 'quick-reply' \| 'icebreaker'`. Text is trimmed and capped at `maxMessageLength`. If it throws or returns a rejected Promise, the composer text is restored. |
| `onMenuClick(anchorButton)` | Three-dot button. Receives the button element so the host can open its own menu, sheet or report flow. |
| `onDraftChange(text)` | Every keystroke, for example to send a "typing" signal. |

In controlled mode Page 25 never adds messages itself. The host appends the new message, optimistically with `status: 'sending'` if you like, and updates its status later.

## 7. Responsive behaviour

- **`layout="viewport"` (default):**
  - The root is `100vh → 100svh → 100dvh`. Each declaration overrides the previous one where the browser supports it.
  - On browsers with `window.visualViewport`, it also uses the visible viewport height. This keeps the composer above the on-screen keyboard on iOS Safari and Android WebView.
- **`layout="fill"`:**
  - The root is `height: 100%` of its parent. Use it inside a device frame or any sized container.
  - It never creates its own phone frame or fixed 390 px width.
- **Structure:** header → conversation (the only scrolling area) → quick replies → composer.
  - The root never scrolls.
  - The header and composer are always visible.
  - The conversation shrinks first on short screens.
- **Safe areas:**
  - The header adds `env(safe-area-inset-top)` and the composer adds `env(safe-area-inset-bottom)`.
  - Side padding respects the left and right insets in landscape.
  - For these values to be non-zero on iOS, the host page's viewport meta needs `viewport-fit=cover`.
- **City illustration:**
  - It scales with the width and stays anchored to the bottom.
  - It is capped at 62% of the conversation height, 48% under 640 px tall and 38% under 520 px, and is cropped from the top rather than pushing the layout.
  - Clouds hide under 520 px tall.
- **Chat behaviour:**
  - The chat sticks to the newest message: on first render, when you send, and when new messages arrive while you are near the bottom.
  - It does not jump while you read older messages.
- **Width:**
  - Bubbles are at most 78% of the width, capped at 440 px, so wide desktop previews still read well.
- **Tested in Chromium (mobile emulation):**
  - Phones: 390×844 (iPhone 14), 430×932 (Pro Max), 375×667 (SE), 393×873 (iQOO Z5), 360×740 (narrow Android), 320×568.
  - Short and landscape: 390×480 and 844×390.
  - Desktop device frame: 390×760 inside 1280×800.
  - In every case the composer's bottom edge equalled the viewport bottom and the document did not scroll.

## 8. npm dependencies

None added. Requires **React 18 or newer** (uses `useId`) and a Vite-style bundler that resolves CSS `url()` and `import './x.css'`. String X on AI Studio already uses both.

## 9. Integration

See **`INTEGRATION.md`** for the step-by-step mapping into the existing AI Studio project.

## 10. Assumptions

- **Design source:**
  - The design reference is the "M4 — Your layout: sky / skyscrapers / street" chat board. Visual values are copied from it: colours, radii, borders, shadows and sizes.
  - The composer input text is 16 px instead of 15 px, because iOS Safari zooms the page on focus for inputs under 16 px.
- **Avatar ring:** the matched user's photo appears inside the pink/orange ring when `avatarUrl` is set.
- **Menu:**
  - The three-dot menu has no built-in dropdown. The current String X implementation had no menu contents, so the button exposes `onMenuClick` for the host's own menu.
- **Icebreakers:** the six prompts are sensible defaults. Override them per match with `icebreakers`.
- **Demo data:**
  - `utils/demoData.ts` is only used when `messages` is omitted (standalone preview).
  - Production should always pass real data.
- **Typing indicator:** it is shown only when the host sets `isMatchTyping`. Nothing is simulated in controlled mode.
