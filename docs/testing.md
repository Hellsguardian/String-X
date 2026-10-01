# STRING X — Quality Assurance & Testing Guide

> **Version:** 3.0.0  
> **Status:** APPROVED ARCHITECTURAL SPECIFICATION (QA PROTOCOLS & TEST MATRIX)  

---

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

### Scenario 1: New Student Google OAuth Sign-In & Core Onboarding
1. Start at `http://localhost:3000/`.
2. Verify full-bleed illustration, STRING X title, and "Continue with Google" button appear.
3. Click "Continue with Google" $\to$ authenticate with Parul University student account.
4. Verify application advances to Step 01 (Name & Gender, Screen 03).
5. Complete Steps 01 to 08.
6. On Step 09 (Face Verification): allow camera and location permissions, center face in oval, hold steady for 1.25s.
7. Verify celebration overlay displays "You're officially in" $\to$ transitions to Screen 12 (Home).

### Scenario 2: Unauthorized Non-University Email Rejection
1. Click "Continue with Google" and authenticate with a non-university personal email (e.g. `user@gmail.com`).
2. Verify application intercepts the redirect, signs out, and displays error modal: *"Parul University Account Required"*.

### Scenario 3: Returning Completed Student (Direct Home Navigation)
1. Open fresh session at `http://localhost:3000/`.
2. Authenticate with previously completed account.
3. Verify application detects existing completed profile and **immediately opens Screen 12 (Home)**, bypassing Steps 03 to 11.

### Scenario 4: "Find My Match" Event Registration & Waiting Radar
1. From Screen 12 (Home), click "Find My Match".
2. If first time: complete 9-step Navratri questionnaire (Steps 13 to 21) $\to$ verify transition to Screen 22 (Radar).
3. If already registered with `matched_with = NULL` $\to$ directly enters Screen 22 (Radar).
4. If `matched_with` is assigned $\to$ directly enters Screen 23 (Countdown).

### Scenario 5: DevScreenRail Desktop Navigation
1. On desktop viewport ($\ge 1280px$), verify the vertical DEV rail is visible on the right.
2. Click button **01** $\to$ Screen 01 loads.
3. Click button **12** $\to$ Screen 12 loads.
4. Click button **22** $\to$ Screen 22 (Radar Scanner) loads with randomized candidate dots.
5. Click button **23** $\to$ Screen 23 (Countdown) loads with active ticking timer.
6. Click button **24** $\to$ Screen 24 (Profile & Settings) loads.
7. Click top arrow icon on rail $\to$ rail flips from right side to left side of screen.

---

## 4. Mobile Device Testing Guidelines

When testing on physical iOS and Android smartphones:
- **iOS Safari:**
  - Verify bottom address bar does not overlap the "Continue" CTA button (`pb-[max(12px,env(safe-area-inset-bottom,0px))]`).
  - Verify rubber-band overscroll does not reveal empty white space behind the `#E3E0F5` background canvas.
- **Android Chrome:**
  - When virtual keyboard opens on Step 0 (Name input) and Step 17 (Instagram input), verify viewport resizes smoothly (`100dvh`) without clipping inputs.
