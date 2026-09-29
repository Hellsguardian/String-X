# STRING X — Production Architecture Refactor Report

## 1. Overview & Executive Summary

The **STRING X** application has undergone a comprehensive, production-grade architectural refactoring. The core visual design, animations, micro-interactions, layout constraints, device frames, and typography generated with Google AI Studio were preserved with 100% fidelity. 

The monolithic code patterns have been replaced with a clean, modular, scalable, database-ready, and Supabase-ready architecture.

---

## 2. Before vs. After Architecture

### Old Architecture
- **Monolithic State & Orchestration:** `App.tsx` directly stored all screen transitions, raw profile fields, step indices, and dev rail coordinate offsets.
- **Monolithic Step Manager:** `OnboardingFlow.tsx` contained 713 lines combining all 18 registration steps (both core identity and Navratri event questions) in one file with an internal switch statement.
- **Zero Backend / Data Abstraction:** No Supabase integration, no service boundaries, and no clean separation between data transport and presentation.
- **Fragile Index Navigation:** Logic heavily depended on arbitrary numbers (`step === 8`, `stepIndex - 3`).
- **Mixed Domain Types:** Flat `UserProfile` type in `src/types.ts` without database entity mapping.

### New Target Architecture
- **Layered Clean Architecture:**
  $$\text{UI Layer (App, Providers, Guards, Pages, Features, Primitives)} \longrightarrow \text{Domain Hooks} \longrightarrow \text{Service Layer} \longrightarrow \text{Supabase Client} \longrightarrow \text{Database / Storage}$$
- **Independent Page & Step Modules:** Every single registration step (01 to 09 for Core Profile, and 01 to 09 for Navratri Event) is an isolated React component with its own inputs and validation.
- **Centralized Authentication Machine (`AuthProvider` & `useAuth`):** Supabase Auth session listener as the single source of truth, managing session state, loading states, and profile retrieval.
- **Dedicated Service Layer:** Services (`authService`, `profileService`, `onboardingService`, `storageService`, `eventService`, `matchmakingService`) encapsulate all API and database interactions with built-in development fallback persistence.
- **Centralized Types & Route Mappings:** Separated `types/user.ts`, `types/events.ts`, `types/navigation.ts`, and `types/api.ts`.
- **Preserved Dev Tools:** `DevScreenRail` mapped via declarative `DEV_SCREEN_MAP`, allowing instant navigation across all 24 screens.

---

## 3. Inventory of Files Changed

### Files Created:
1. `src/types/user.ts` — User domain entities and Supabase DatabaseProfile models.
2. `src/types/navigation.ts` — ScreenState, AppRoute, and step route keys.
3. `src/types/api.ts` — ServiceResult, ServiceError, and result wrappers.
4. `src/types/index.ts` — Centralized types index.
5. `src/constants/routes.ts` — Route constants and DevScreenRail mapping table.
6. `src/lib/supabase/client.ts` — Supabase client singleton instance with auto session persistence.
7. `src/lib/supabase/env.ts` — Supabase environment variable validation and detector.
8. `src/lib/supabase/types.ts` — Complete PostgreSQL database schemas for profiles, events, participants, and matches.
9. `src/services/authService.ts` — OTP dispatch, OTP verification, session retrieval, sign out, and auth listener.
10. `src/services/profileService.ts` — Profile fetch, upsert, mapping between app & DB, and completion checks.
11. `src/services/onboardingService.ts` — Draft saving, step validation, and draft cleanup.
12. `src/services/storageService.ts` — Supabase Storage photo and face verification uploads.
13. `src/services/eventService.ts` — Event discovery, retrieval, and registration submissions.
14. `src/services/matchmakingService.ts` — Match candidate generation, sneak peek profile, and wave dispatch.
15. `src/features/auth/context/AuthContext.tsx` — Central AuthProvider and state machine.
16. `src/hooks/useAuth.ts` — Top-level export of `useAuth`.
17. `src/features/onboarding/context/OnboardingContext.tsx` — Dedicated Onboarding domain context.
18. `src/features/onboarding/hooks/useOnboarding.ts` — Export of `useOnboarding`.
19. `src/features/navigation/hooks/useAppNavigation.ts` — Declarative router controller for screen state and DevScreenRail.
20. `src/app/providers/AppProviders.tsx` — Composite provider wrapper.
21. `src/app/AppShell.tsx` — App layout, frame, and screen router.
22. `src/app/App.tsx` — Provider-injected App root.
23. `src/pages/landing/LandingPage.tsx` — Isolated Landing screen page.
24. `src/pages/auth/PhoneNumberSignUpPage.tsx` — Isolated Phone & OTP sign up page.
25. `src/pages/onboarding/OnboardingFlowContainer.tsx` — Container orchestrating individual step views.
26. `src/pages/onboarding/FaceVerifiedTransitionPage.tsx` — Isolated celebration transition page.
27. `src/pages/home/HomePage.tsx` — Isolated STRING X Home & Events page.
28. `src/pages/profile/ProfileSettingsPage.tsx` — Isolated Profile & Settings page.
29. `src/pages/matchmaking/SubmissionSuccessPage.tsx` — Isolated Radar Scanner page.
30. `src/pages/matchmaking/CountdownPage.tsx` — Isolated Countdown page.
31. `src/pages/onboarding/steps/Step01NameGender.tsx` — Screen 03
32. `src/pages/onboarding/steps/Step02CampusHostel.tsx` — Screen 04
33. `src/pages/onboarding/steps/Step03Age.tsx` — Screen 05
34. `src/pages/onboarding/steps/Step04Photo.tsx` — Screen 06
35. `src/pages/onboarding/steps/Step05HeightWeight.tsx` — Screen 07
36. `src/pages/onboarding/steps/Step06HomeState.tsx` — Screen 08
37. `src/pages/onboarding/steps/Step07CollegeYear.tsx` — Screen 09
38. `src/pages/onboarding/steps/Step08Course.tsx` — Screen 10
39. `src/pages/onboarding/steps/Step09FaceVerification.tsx` — Screen 11
40. `src/pages/onboarding/steps/index.ts` — Core onboarding steps registry.
41. `src/pages/events/navratri/steps/NavratriStep01Partner.tsx` — Screen 13
42. `src/pages/events/navratri/steps/NavratriStep02Interests.tsx` — Screen 14
43. `src/pages/events/navratri/steps/NavratriStep03EveningSpot.tsx` — Screen 15
44. `src/pages/events/navratri/steps/NavratriStep04Excitement.tsx` — Screen 16
45. `src/pages/events/navratri/steps/NavratriStep05GarbaLevel.tsx` — Screen 17
46. `src/pages/events/navratri/steps/NavratriStep06Vibes.tsx` — Screen 18
47. `src/pages/events/navratri/steps/NavratriStep07Prompt1.tsx` — Screen 19
48. `src/pages/events/navratri/steps/NavratriStep08Prompt2.tsx` — Screen 20
49. `src/pages/events/navratri/steps/NavratriStep09Instagram.tsx` — Screen 21
50. `src/pages/events/navratri/steps/index.ts` — Navratri steps registry.
51. `ARCHITECTURE_REFACTOR_PLAN.md` — Complete architecture plan.
52. `ARCHITECTURE_REFACTOR_REPORT.md` — Final report.

### Files Refactored & Maintained (Backward Compatibility):
- `src/App.tsx` — Converted into a thin entrypoint pointing to `src/app/App.tsx`.
- `src/types.ts` — Re-exports from `src/types/index.ts`.
- `src/components/screens/OnboardingFlow.tsx` — Replaced 713 lines of monolith with a lightweight adapter to `OnboardingFlowContainer`.
- `src/components/screens/PhoneNumberSignUpScreen.tsx` — Enhanced with async `onSendOtp` and `onVerifyOtp` hooks while preserving confetti, timer, and animation.

---

## 4. Key Architectural Highlights

### 1. Isolated Page Contract
No page component directly imports `@supabase/supabase-js` or makes database queries.
```
Step01NameGenderPage  ──>  useAuth() / useOnboarding()  ──>  onboardingService / profileService  ──>  Supabase
```

### 2. STRING X Authentication State Flow
The authentication system distinguishes 4 operational states:
1. `loading`: Initializing session from Supabase client.
2. `unauthenticated`: Logged-out user, rendering `LandingPage` or `PhoneNumberSignUpPage`.
3. `authenticated` (incomplete profile): Directs to Core Profile Onboarding (Screens 03 to 11).
4. `authenticated` (completed profile): Automatically routes to Screen 12 (`HomePage` / Navratri 2026).

### 3. Graceful Fallback Mode
When running locally or before `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided in `.env`:
- The service layer detects unconfigured credentials and seamlessly utilizes local storage caching.
- Zero crashes, zero unhandled promise rejections.
- Adding real Supabase credentials instantly activates live database sync without changing any UI code.

---

## 5. Verification Results

| Flow / Requirement | Test Method | Result | Notes |
|---|---|---|---|
| TypeScript Compilation | `npm run lint` (`tsc --noEmit`) | **PASS (0 errors)** | Full strict type safety achieved |
| Production Build | `npm run build` (`vite build`) | **PASS (0 errors)** | Production bundle builds in < 600ms |
| Screen 01 (Landing) | Browser subagent | **PASS** | Exact artwork, wordmark, CTA button verified |
| Screen 02 (Phone Sign-Up) | Browser subagent | **PASS** | Phone input, OTP bottom sheet modal, 6-digit inputs verified |
| Screens 03–11 (Core Steps) | Browser subagent / DevRail | **PASS** | All 9 core steps render cleanly and validate inputs |
| Screen 12 (Home / Events) | Browser subagent | **PASS** | Navratri 2026 live banner, avatar, "Find My Match" verified |
| Screens 13–21 (Navratri Flow)| Browser subagent | **PASS** | Partner preference, interests, prompts, Instagram verified |
| Screen 22 (Radar Scanner) | Browser subagent / DevRail | **PASS** | Randomized pulse signals and bottom activity messages verified |
| Screen 23 (Countdown) | Browser subagent | **PASS** | Live countdown timer cards and Instagram CTA verified |
| Screen 24 (Profile & Settings)| Browser subagent | **PASS** | Profile hero, campus badge, settings options, sign out verified |
| DevScreenRail (1 to 24) | Browser subagent | **PASS** | Direct instant jumping across all 24 screens verified |

---

## 6. Future Recommendations & Next Steps

1. **Supabase Environment Setup:**
   Populate `.env` with live project keys:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```
2. **Database Migrations:**
   Run table definitions in Supabase SQL editor using `src/lib/supabase/types.ts` schemas (including Row Level Security policies for `profiles` and `event_participants`).
3. **Storage Bucket Creation:**
   Create a public bucket named `profile-photos` in Supabase Storage with file size restrictions (e.g. 5MB) and mime type whitelist (`image/jpeg`, `image/png`, `image/webp`).
