# Integrating Page24 into the STRING X app (Google AI Studio, React + Vite)

Follow these steps exactly. Do not recreate, restyle or "simplify" anything inside `Page24/`. The folder is the finished implementation.

---

## STEP 1: Where to copy the folder

Copy the entire `Page24/` folder, unchanged, into your source directory:

```
src/
└── Page24/        ← paste here (keep every file and sub-folder)
```

If your project has no `src/` folder (some AI Studio projects keep components at the root), put it next to your other page components, for example `components/Page24/` or `pages/Page24/`. Only the import path in STEP 3 changes.

## STEP 2: Which component to import

Import `Page24` from the folder's `index.ts`.

## STEP 3: Exact import statement

```tsx
import { Page24 } from './Page24';            // from a file inside src/
// or, from src/pages/SomePage.tsx:
import { Page24 } from '../Page24';
```

Optional type imports:

```tsx
import type { Page24Props, Page24CurrentUser, Page24MatchedUser } from './Page24';
```

## STEP 4: Example usage

```tsx
<Page24
  currentUser={{
    name: 'Dev Patel',
    photoUrl: 'https://…/dev.jpg',
    year: 3,
    interests: ['Garba', 'Music', 'Late Night Chai', 'Coding'],
  }}
  matchedUser={{
    name: 'Aanya Shah',
    age: 20,
    photoUrl: 'https://…/aanya.jpg',
    year: 2,
    course: 'B.Tech',
    interests: ['Garba', 'Late Night Chai', 'Music', 'Reels'],
  }}
  onBack={() => goToPreviousPage()}
  onMessage={() => openChatWith(match.id)}
/>
```

This renders exactly the finalized design:

- Polaroid labels: "Dev" and "Aanya, 20".
- Year cards: "3rd YEAR" and "2nd YEAR".
- Card subtitle: "Aanya · B.Tech 2nd Year".
- Chips: Garba, Late Night Chai, Music.
- Button: "Say Kem Cho to Aanya".

Render it as the **whole screen** for this step of the flow, not inside a padded card. It sizes itself to the viewport.

## STEP 5: Mapping the current STRING X user

Map from whatever the onboarding stores. Screen numbers refer to the 22 onboarding screens.

| Page24 field | Comes from | Notes |
|---|---|---|
| `currentUser.name` | "What's your name?" (step 3) | Full name is fine; only the first word is shown. |
| `currentUser.photoUrl` | Profile photo URL | Omit or `null` to show the violet silhouette. |
| `currentUser.year` | "Which year are you surviving?" (step 9) | `1`, `2`, `3`, `4`, or `'PG'`. |
| `currentUser.course` | "What's your course?" (step 10) | Optional; not displayed for the current user. |
| `currentUser.interests` | "What are you into?" (step 14) | Used to compute common interests. |

## STEP 6: Mapping the matched user

| Page24 field | Comes from | Notes |
|---|---|---|
| `matchedUser.name` | Match's name | First word is shown on the polaroid, card subtitle and CTA. |
| `matchedUser.age` | From the match's birth year (step 5): `currentYear - birthYear` | Optional. Omit it and the label shows just the first name. |
| `matchedUser.photoUrl` | Match's photo URL | Omit or `null` to show the pink silhouette. |
| `matchedUser.year` | Match's year | `1`–`4` or `'PG'`. |
| `matchedUser.course` | Match's course | Shown in the subtitle: "Aanya · **B.Tech** 2nd Year". |
| `matchedUser.interests` | Match's interests | Intersected with the current user's interests to get the chips. |
| `commonInterests` (top level) | Optional | Pass it if your backend already computes shared interests. At most 3 are shown. |

Text can be overridden without touching the design, for example a Hinglish CTA:

```tsx
copy={{ ctaLabel: `${firstName} ko Kem Cho bolo` }}
```

All keys are listed in `types.ts` → `Page24Copy`.

## STEP 7: Connecting Back

```tsx
onBack={() => setStep(23)}          // state-based flow
// or
onBack={() => navigate(-1)}         // if the host uses React Router
// or
onBack={() => history.back()}
```

Page24 never navigates by itself.

## STEP 8: Connecting the CTA ("Say Kem Cho to …")

```tsx
onMessage={() => setStep('messages')}
// or
onMessage={() => navigate(`/chat/${match.id}`)}
```

This is the only forward action on the page. There is no separate "continue".

## STEP 9: npm dependencies

| PACKAGE | VERSION | USED FOR |
|---|---|---|
| `react` | 18.x or 19.x (already in the project) | Components and hooks (`useState`, `useEffect`, `useLayoutEffect`, `useMemo`, `useRef`) |
| `react-dom` | same as `react` (already in the project) | Rendering (host) |
| `vite` | 4.x or newer (already in the project) | Bundles the CSS imports, the `.woff2` font files and the `?raw` SVG imports |

**Nothing needs to be installed.** Page24 uses no animation, icon, styling or router library.

## STEP 10: CSS and font setup

None. `Page24.tsx` imports its own `styles/fonts.css` and `styles/Page24.css`, and Vite bundles the font files automatically.

- Do **not** add Google Fonts links for these fonts. They are bundled under `P24 …` family names.
- `index.html` should keep the standard mobile viewport tag. For edge-to-edge on notched phones and in Android WebView, include `viewport-fit=cover`:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  ```
  Without `viewport-fit=cover` the page still works; the safe areas are simply 0.
- If the page must live inside a container rather than the full screen, use `layout="fill"` and give the parent a definite height:
  ```css
  .your-container { height: 100dvh; }   /* or any fixed height */
  ```

## STEP 11: What must NOT be changed

In the host application:

1. Do not wrap Page24 in elements with padding, `transform`, `zoom` or `overflow: auto`. Render it directly as the screen.
2. Do not add global CSS that targets `.p24-*` classes or the `P24 …` font families.
3. Do not rename the `assets/`, `fonts/` or `styles/` folders, and do not move files out of `Page24/`. Imports are relative.
4. Do not convert the SVG imports from `?raw` to `<img src>`. The gate lettering would lose its font and the rope spark would stop animating.

Inside `Page24/`:

5. Do not edit `styles/Page24.css`, the SVG files or the component markup. Pixel values are tuned 1:1 to the finalized design.
6. Change content only through props and `copy`.

## Verification checklist after integrating

- [ ] Header shows a white back button and "STRING X" with a pink X.
- [ ] Two polaroids swing gently from yellow clothespins on a pink twisted rope, with a light spark running along it.
- [ ] The gate reads "PARUL" and "UNIVERSITY" in serif capitals, with nothing overflowing.
- [ ] Year cards read "3rd YEAR" and "2nd YEAR" for the example data.
- [ ] The white tilted card shows the pink "STRINGS ATTACHED" tag.
- [ ] "COMMON INTERESTS" sits above three chips.
- [ ] The purple CTA fires `onMessage`, and the back button fires `onBack`.
- [ ] On a tall phone, sky lavender fills above the page and night purple fills below it, with no white gaps.
