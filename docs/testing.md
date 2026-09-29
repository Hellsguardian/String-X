# STRING X — Quality Assurance & Testing Guide

## 1. Testing Pyramid

STRING X uses a multi-layered testing strategy combining compile-time type verification, build-time asset verification, service integration tests, and manual mobile UX testing.

```
       ▲
      / \     Manual Mobile Device Verification (iOS Safari, Android Chrome)
     /   \
    /     \   Automated Browser Subagent / End-to-End User Flow Tests
   /       \
  /         \ Service & Domain Unit Checks (Input validation, Mappers)
 /           \
/─────────────\ TypeScript Static Analysis (`npm run lint` / `tsc --noEmit`)
```

---

## 2. Automated Static Checks

### 2.1 TypeScript Typecheck
Run the strict TypeScript compiler:
```bash
npm run lint
```
- Validates all component props, context values, service return types, and route parameters.
- **Pass Criteria:** Exits with code 0 and zero TS errors.

### 2.2 Production Build Verification
```bash
npm run build
```
- Validates Rollup chunking, asset bundling, CSS compilation, and dead code elimination.
- **Pass Criteria:** Generates production bundle in `dist/` without errors.

---

## 3. Critical Test Scenarios & Test Matrix

### Scenario 1: New Student Registration (Happy Path)
1. Start at `http://localhost:3000/`.
2. Verify full-bleed illustration, STRING X title, and "Get Started" button appear.
3. Click "Get Started" $\to$ Screen 02 (Phone sign-up).
4. Enter 10 digits (`9825144321`) $\to$ Click "Send OTP".
5. Verify bottom sheet slides up, first digit is auto-focused, and 30s resend timer ticks down.
6. Enter `123456` $\to$ verify confetti fires and screen advances to Step 01 (Name & Gender).
7. Complete Steps 01 to 08.
8. On Step 09 (Face Verification): allow camera permissions, center face in oval, hold steady for 1.25s.
9. Verify celebration overlay displays "You're officially in" $\to$ transitions to Screen 12 (Home).

### Scenario 2: Existing Student Login (Session Bypass)
1. Open fresh session at `http://localhost:3000/`.
2. Enter previously registered phone number in Screen 02.
3. Verify OTP.
4. Verify application detects existing completed profile and **immediately jumps to Screen 12**, bypassing Steps 03 to 11.

### Scenario 3: DevScreenRail Desktop Navigation
1. On desktop viewport ($\ge 1280px$), verify the vertical DEV rail is visible on the right.
2. Click button **01** $\to$ Screen 01 loads.
3. Click button **12** $\to$ Screen 12 loads.
4. Click button **22** $\to$ Screen 22 (Radar Scanner) loads with randomized candidate dots.
5. Click button **23** $\to$ Screen 23 (Countdown) loads with active ticking timer.
6. Click button **24** $\to$ Screen 24 (Profile & Settings) loads.
7. Click top arrow icon on rail $\to$ rail flips from right side to left side of screen.

### Scenario 4: Step Auto-Advance Timers
1. On Step 06 (College Year), tap "2nd Year".
2. Verify card highlights and screen automatically advances after 240ms without requiring a manual "Continue" click.
3. On Step 15 (Prompt 1), tap an option card $\to$ auto-advances after 260ms.

---

## 4. Mobile Device Testing Guidelines

When testing on physical iOS and Android smartphones:
- **iOS Safari:**
  - Verify bottom address bar does not overlap the "Continue" CTA button (`pb-[max(12px,env(safe-area-inset-bottom,0px))]`).
  - Verify rubber-band overscroll does not reveal empty white space behind the `#E3E0F5` background canvas.
- **Android Chrome:**
  - When virtual keyboard opens on Step 0 (Name input) and Step 17 (Instagram input), verify viewport resizes smoothly (`100dvh`) without clipping inputs.
