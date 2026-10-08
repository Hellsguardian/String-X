# Integrating Page 25 into the existing String X project (Google AI Studio)

This guide adds the redesigned chat screen to the existing String X React/Vite app **without changing routing, `App.tsx`, global CSS, Tailwind, the database or any other page**.

---

## 1. Copy the folder

Copy the whole folder into the project's `src/`, as-is:

```
src/page25-claude/
├── index.ts
├── Page25.tsx
├── Page25View.tsx
├── types.ts
├── README.md
├── INTEGRATION.md
├── styles/   Page25.css, fonts.css
├── components/   ChatHeader, MatchContextBanner, IcebreakerCard, MessageBubble,
│                 TypingIndicator, QuickReplies, Composer (.tsx)
├── hooks/    useStickToBottom.ts, useVisibleViewportHeight.ts
├── utils/    formatTime.ts, text.ts, demoData.ts
├── assets/   city-skyline.svg, clouds.svg, icons/*.svg (11 icons)
└── fonts/    PlusJakartaSans-Variable-latin.woff2, JetBrainsMono-Bold-latin.woff2, OFL-*.txt
```

**Copy everything listed above.** Keep the relative structure: the CSS points at `../assets/...` and `../fonts/...`.

**Do NOT copy anything else.** There is no `package.json`, `vite.config`, `tsconfig`, `index.html`, `App.tsx`, global stylesheet or Tailwind config in this package, and none should be added or replaced. Keep `README.md`, `INTEGRATION.md` and the `OFL-*.txt` font licenses; they are documentation and licensing only.

No npm install is needed. The package only imports `react`, and requires React 18 or newer.

---

## 2. Which file imports Page 25

Do **not** edit `App.tsx` or the router. Instead, open the file that **currently renders Page 25**: the existing chat screen component that the app already shows for page 25. Replace only its returned JSX with the new component, keeping that file's name, export and props unchanged so every existing import site keeps working.

```tsx
// <existing Page 25 file>.tsx — keep the same export name/signature as today
import Page25 from '../page25-claude';            // adjust the relative path
import type { Page25Message } from '../page25-claude';

export default function ExistingPage25Screen(/* existing props, unchanged */) {
  // 1) Keep using the data/hooks this screen already uses today, e.g.:
  //    const { user, match, messages, isMatchOnline, isMatchTyping,
  //            sendMessage, goBack, openMenu } = <existing hooks/props>;

  return (
    <Page25
      currentUser={{ id: user.id, firstName: user.firstName, avatarUrl: user.photoUrl }}
      matchedUser={{
        id: match.id,
        name: match.firstName,
        avatarUrl: match.photoUrl,
        isOnline: isMatchOnline,
      }}
      messages={messages.map(toPage25Message)}
      quickReplies={['8 baje, Gate 2?', 'Outfit match karein?', { label: 'Chai after Garba', message: 'Garba ke baad chai pakka' }]}
      matchContext={{
        badge: 'STRINGS ATTACHED · NAVRATRI NIGHT 1',
        sharedInterests: sharedInterestsOf(user, match),   // e.g. ['Garba', 'Late Night Chai', 'Music']
      }}
      isMatchTyping={isMatchTyping}
      onBack={goBack}
      onSendMessage={(text) => sendMessage(text)}          // existing send function
      onMenuClick={(anchor) => openMenu?.(anchor)}         // optional
    />
  );
}

// Adapter: map your existing message records → Page25Message. No schema change needed.
function toPage25Message(m: ExistingMessage): Page25Message {
  return {
    id: String(m.id),
    senderId: String(m.senderId),
    text: m.text,
    createdAt: m.createdAt,          // ISO string, epoch ms or Date
    status: m.readAt ? 'seen' : m.deliveredAt ? 'delivered' : m.pending ? 'sending' : 'sent',
  };
}
```

`ExistingMessage`, `sharedInterestsOf`, `sendMessage`, `goBack` and similar names above stand for **whatever the current Page 25 already uses**. Map from those; do not create new APIs, tables, auth or routes.

---

## 3. Props to map

| Page25 prop | Map from existing String X data |
|---|---|
| `currentUser.id` | Signed-in user's id (the same id stored as a message's sender). |
| `currentUser.firstName` | Signed-in user's first name (optional). |
| `matchedUser.name` | Matched partner's first name (shown in header). |
| `matchedUser.avatarUrl` | Partner's profile photo URL, if any (otherwise their initial is shown). |
| `matchedUser.isOnline` | Presence flag, if the app has one (otherwise omit; shows "Offline"). Use `statusText` to show something else, e.g. "Last seen 10:30 PM". |
| `messages` | Existing conversation list, oldest first, through `toPage25Message`. **Always pass an array**, even `[]`. Omitting it switches Page 25 into demo/preview mode. |
| `quickReplies` | Static list above, or your own per-match suggestions. |
| `icebreakers` | Optional. Omit for the 6 built-in prompts, or pass `[]` to hide the card. |
| `matchContext.sharedInterests` | Intersection of both users' onboarding interests (Page "What are you into?"). |
| `matchContext.badge` | Optional label, e.g. the Navratri night of the reveal. |
| `isMatchTyping` | Existing typing signal, if any. |
| `disabled` | `true` if the match is blocked or ended. |

## 4. Callbacks to connect

| Callback | Connect to |
|---|---|
| `onBack` | The existing back/navigation action used by Page 25 today. |
| `onSendMessage(text, { source })` | The existing send function. Append the new message to `messages`; optionally add it immediately with `status: 'sending'`. Return the Promise so a failure restores the typed text. `source` tells you whether it came from the composer, a quick reply or an icebreaker (handy for analytics). |
| `onMenuClick(anchor)` | Existing menu/report/block sheet, if there is one. Otherwise omit. |
| `onDraftChange(text)` | Optional typing-indicator emitter. |

---

## 5. Layout / container

- If Page 25 is shown **full-screen on phones** (normal app and Android WebView), use the default `layout="viewport"`.
- If the app renders pages inside a **device frame or a sized wrapper** (desktop preview), pass `layout="fill"`. Page 25 then fills that wrapper (`height: 100%`). The wrapper must have a definite height.
- Page 25 must not be placed inside a parent that scrolls vertically. It manages its own scrolling inside the conversation area.

**Viewport meta** (`index.html`, usually already present). For the safe-area insets to apply on iPhones, the existing tag should include `viewport-fit=cover`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

If it does not, Page 25 still works; it just won't add extra space for the notch and home indicator.

**Android WebView build:** the activity should use `android:windowSoftInputMode="adjustResize"` (the common default for chat apps) so the composer stays above the keyboard.

---

## 6. CSS and font considerations

- `Page25.tsx` imports `./styles/fonts.css` and `./styles/Page25.css` itself. **Do not** add them to `index.css`, `main.tsx` or Tailwind.
- Every selector is scoped (`.p25-root …`, `.p25-*`). There are no `html`, `body`, `button`, `input`, `h1` or `p` rules, so Pages 1–24 and 26+ are unaffected.
- Fonts register as **`P25 Plus Jakarta Sans`** and **`P25 JetBrains Mono`**, separate names that cannot override the app's existing fonts.
- Tailwind's preflight, if used, does not break Page 25: the component sets its own margins, borders, appearance and font on everything it renders.
- If the host wraps pages in a container with padding or a background, Page 25 still covers it fully (`width: 100%`).

## 7. Asset paths

All assets are loaded from CSS with relative paths:

```
styles/Page25.css → ../assets/city-skyline.svg, ../assets/clouds.svg, ../assets/icons/*.svg
styles/fonts.css  → ../fonts/*.woff2
```

Vite resolves and fingerprints them at build time. **Do not** move the files into `public/` and do not rewrite the paths. Copying the folder intact is enough.

---

## 8. Quick verification after integrating

1. Open Page 25 on a phone: the header is at the top, the composer at the bottom, and the city sits just above the dark ground.
2. Send a message: it appears on the right in violet, and the input clears.
3. Tap a quick-reply chip and an icebreaker: both send.
4. Focus the input on iOS and Android: the composer stays above the keyboard and the page doesn't scroll as a whole.
5. Visit Pages 24 and 26: their fonts and styles are unchanged.
