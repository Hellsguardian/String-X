# STRING X — Production Architecture Refactor Plan

## 1. Executive Summary & Current Architecture Audit

STRING X is a high-energy, university campus social & matchmaking application (featuring the Navratri 2026 event experience, face verification, partner preferences, and real-time vibe compatibility).

### Current Codebase Anatomy
- **Framework & Bundler:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Motion (Framer Motion v12).
- **Core Orchestrator (`App.tsx`):**
  - Manages global `ScreenState` (`'landing' | 'phone-signup' | 'onboarding' | 'home' | 'profile' | 'success' | 'countdown'`).
  - Holds `UserProfile` in a single local `useState` initialized from `INITIAL_USER_PROFILE`.
  - Holds `onboardingStep` as an arbitrary integer `0..17`.
  - Bridges the desktop development navigation rail (`DevScreenRail.tsx`) which translates steps 1–24 into screen + step combinations via manual integer offsets (`stepIndex - 3`, `stepIndex - 4`).
- **Onboarding Flow (`OnboardingFlow.tsx`):**
  - Monolithic component (~713 lines) containing 18 distinct screens (steps 0 to 17) split across two conceptually different domains:
    1. *Student Identity & Campus Onboarding* (Steps 0–8: Name, Gender, Campus & Hostel, Age, Photos, Height & Weight, Home State, Academic Year, Department/Course, Face Verification).
    2. *Event / Navratri Vibe Registration* (Steps 9–17: Partner Preference, Campus Interests, Evening Spot, Navratri Excitement, Garba Skill Level, Navratri Vibes, Personality Prompts 1 & 2, Instagram ID).
- **Authentication & Backend:**
  - Mocked entirely in the frontend. `PhoneNumberSignUpScreen` simulates a 6-digit OTP verification with timer and confetti.
  - No connection to Supabase Auth, PostgreSQL, or Storage.
- **Events & Discovery Subsystem (`src/components/events/`):**
  - Contains full implementations for `EventDiscoveryFeed`, `EventIntroScreen`, `EventQuestionnaireScreen`, `EventMatchingTransition`, `EventMatchesScreen`, and `MainAppLayout`, which are decoupled from `App.tsx`.

---

## 2. Problems & Anti-Patterns Identified

1. **Monolithic Files & Mixed Responsibilities:**
   - `OnboardingFlow.tsx` renders 18 step views, validates each step with an ad-hoc switch statement (`canContinue`), manages auto-advance timers, and directly formats strings.
   - `App.tsx` orchestrates all screens, dev jumps, and global profile mutations in one file.
2. **Fragile Number-Based Routing:**
   - The user flow relies on hardcoded numeric step indices (`step === 8`, `step === 9`, `targetStep = stepIndex - 3`). Adding or reordering a step will silently break subsequent steps and the `DevScreenRail`.
3. **Absence of a Service & Data Access Layer:**
   - No abstraction over database operations, session persistence, or image storage.
   - If Supabase calls were directly embedded into UI components, replacing or updating queries would require touching UI presentation code.
4. **No Centralized Auth State Machine:**
   - Authentication status is not distinguished between:
     - Unknown / initializing
     - Logged out
     - Logged in without profile (needs core onboarding)
     - Logged in with profile (ready for Home / Event discovery)
5. **No Domain Type Separation:**
   - `src/types.ts` defines a flat `UserProfile` mixing account info, physical stats, event answers, and transient flags with no distinction between Database records and UI view models.
6. **No Clean Error Handling & Loading Boundary:**
   - Async calls (OTP, photo uploads, profile updates) have no standardized result wrapper (`Result<T, E>`), loading state lifecycle, or retry mechanisms.

---

## 3. Proposed Target Architecture

The refactored architecture enforces strict uni-directional dependencies:

```
UI LAYER:
  App
   ↓
  AppProviders (AuthProvider, OnboardingProvider, ToastProvider)
   ↓
  Routes / Guards (AuthGuard, OnboardingGuard, PublicOnlyGuard)
   ↓
  Pages (Landing, Auth, Onboarding, Home, Profile, Matchmaking, Events)
   ↓
  Feature Components (presentation-only, reusable domain widgets)
   ↓
DOMAIN / STATE LAYER:
  Hooks (useAuth, useOnboarding, useProfile, useEvents, useMatchmaking)
   ↓
SERVICE LAYER:
  Services (authService, profileService, onboardingService, storageService, eventService, matchmakingService)
   ↓
INFRASTRUCTURE LAYER:
  Supabase Client Singleton (`src/lib/supabase/client.ts`)
   ↓
  Supabase Auth, PostgreSQL & Storage
```

### Dependency Rules:
- **Pages & Components:** Import only hooks, UI primitives, and domain types. Must NEVER import `supabase` or write direct queries.
- **Hooks:** Coordinate domain services, local cache/state, and validation.
- **Services:** Pure async modules returning typed responses `{ data, error }`. Encapsulate all database tables, RPCs, and storage buckets.
- **Supabase Client:** Isolated in `src/lib/supabase/`. Does not import UI or features.
- **Types:** Centralized in `src/types/`. Separates Database schemas from Application domain entities.

---

## 4. Target Folder Structure

```
src/
├── app/
│   ├── App.tsx                      # Root shell & device frame
│   ├── routes.ts                    # Central route definitions & route constants
│   ├── providers/
│   │   ├── AppProviders.tsx         # Composite provider root
│   │   └── AuthProvider.tsx        # Central Supabase Auth state provider
│   └── guards/
│       ├── AuthGuard.tsx            # Protected route boundary
│       └── OnboardingGuard.tsx      # Incomplete onboarding redirect boundary
│
├── pages/
│   ├── landing/
│   │   └── LandingPage.tsx          # Screen 01: Landing hero
│   ├── auth/
│   │   └── PhoneNumberSignUpPage.tsx# Screen 02: Mobile OTP verification
│   ├── onboarding/
│   │   ├── OnboardingContainerPage.tsx # Shell with header progress
│   │   ├── steps/
│   │   │   ├── Step01NameGenderPage.tsx      # Screen 03
│   │   │   ├── Step02CampusHostelPage.tsx    # Screen 04
│   │   │   ├── Step03AgePage.tsx             # Screen 05
│   │   │   ├── Step04PhotoPage.tsx           # Screen 06
│   │   │   ├── Step05HeightWeightPage.tsx    # Screen 07
│   │   │   ├── Step06HomeStatePage.tsx       # Screen 08
│   │   │   ├── Step07CollegeYearPage.tsx     # Screen 09
│   │   │   ├── Step08CoursePage.tsx          # Screen 10
│   │   │   └── Step09FaceVerificationPage.tsx# Screen 11
│   │   └── FaceVerifiedTransitionPage.tsx    # Transition overlay
│   ├── home/
│   │   └── HomePage.tsx             # Screen 12: STRING X Home & Events feed
│   ├── events/
│   │   ├── navratri/
│   │   │   ├── NavratriRegistrationPage.tsx  # Event questionnaire shell
│   │   │   └── steps/
│   │   │       ├── NavratriStep01PartnerPage.tsx   # Screen 13
│   │   │       ├── NavratriStep02InterestsPage.tsx # Screen 14
│   │   │       ├── NavratriStep03EveningSpotPage.tsx# Screen 15
│   │   │       ├── NavratriStep04ExcitementPage.tsx # Screen 16
│   │   │       ├── NavratriStep05GarbaLevelPage.tsx # Screen 17
│   │   │       ├── NavratriStep06VibesPage.tsx      # Screen 18
│   │   │       ├── NavratriStep07Prompt1Page.tsx    # Screen 19
│   │   │       ├── NavratriStep08Prompt2Page.tsx    # Screen 20
│   │   │       └── NavratriStep09InstagramPage.tsx  # Screen 21
│   │   └── EventDiscoveryPage.tsx
│   ├── matchmaking/
│   │   ├── SubmissionSuccessPage.tsx # Screen 22: Radar scanning
│   │   ├── CountdownPage.tsx         # Screen 23: Navratri countdown
│   │   └── MatchRevealModal.tsx      # Sneak peek partner reveal
│   └── profile/
│       └── ProfileSettingsPage.tsx   # Screen 24: Profile & settings
│
├── features/
│   ├── auth/
│   │   ├── hooks/useAuth.ts
│   │   └── types.ts
│   ├── onboarding/
│   │   ├── context/OnboardingContext.tsx
│   │   ├── hooks/useOnboarding.ts
│   │   ├── validation.ts
│   │   └── types.ts
│   ├── profile/
│   │   ├── hooks/useProfile.ts
│   │   └── types.ts
│   ├── events/
│   │   ├── hooks/useEvents.ts
│   │   └── types.ts
│   └── matchmaking/
│       ├── hooks/useMatchmaking.ts
│       └── types.ts
│
├── components/
│   ├── ui/
│   │   ├── DeviceFrame.tsx
│   │   ├── HeaderNav.tsx
│   │   └── PrimaryButton.tsx
│   ├── inputs/                      # All 20 modular input components
│   ├── illustrations/               # GarbaIllustrations, Badges, Logos
│   └── dev/
│       └── DevScreenRail.tsx        # Preserved 24-screen development rail
│
├── services/
│   ├── authService.ts               # OTP send, OTP verify, signOut, getSession
│   ├── profileService.ts            # Fetch profile, upsert profile, completion status
│   ├── onboardingService.ts         # Step cache, draft save, finalize
│   ├── storageService.ts            # Supabase Storage profile picture upload & URL
│   ├── eventService.ts              # Fetch events, submit answers, registration
│   └── matchmakingService.ts        # Fetch matches, match compatibility
│
├── lib/
│   └── supabase/
│       ├── client.ts                # Supabase client singleton with fallback mock mode
│       ├── types.ts                 # Database schema types (profiles, events, etc.)
│       └── env.ts                   # Supabase environment variables & configuration
│
├── types/
│   ├── index.ts                     # Re-export all domain types
│   ├── user.ts                      # UserProfile, UserAccount, Identity
│   ├── events.ts                    # EventDefinition, EventQuestion, EventMatch
│   ├── navigation.ts                # ScreenState, AppRoute, StepRoute
│   └── api.ts                       # ServiceResult<T>, ApiError
│
├── constants/
│   ├── routes.ts                    # Route path constants & metadata
│   └── mockData.ts                  # Preserved mock datasets & initial profiles
│
└── utils/
    ├── faceValidation.ts
    └── pico.ts
```

---

## 5. Authentication Flow & State Model

### State Representation (`useAuth`):
```typescript
interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isProfileComplete: boolean;
  error: string | null;
}
```

### Flow Logic:
1. **Initial Boot:**
   - `authService.getSession()` checks for existing Supabase session.
   - If session exists: fetch profile via `profileService.getProfile(user.id)`.
     - Profile complete? -> Route to **Screen 12 (`/home`)**.
     - Profile incomplete? -> Route to **Screen 03 (`/onboarding`)**.
   - If no session: stay on **Screen 01 (`/landing`)** or allow phone login.
2. **Phone Sign-Up / Login (Screen 02):**
   - User inputs 10-digit phone number.
   - `authService.sendPhoneOtp(phone)` dispatches Supabase OTP (with seamless dev fallback if offline/mock).
   - User inputs 6-digit code.
   - `authService.verifyPhoneOtp(phone, otp)` validates with Supabase Auth.
   - User account is created or authenticated without duplicate profiles.
3. **Sign Out:**
   - `authService.signOut()` clears Supabase session and resets auth state to unauthenticated, smoothly navigating to Landing Page.

---

## 6. Onboarding Architecture (Separating Core vs Event)

### Core Profile Onboarding (Screens 03–11):
- Step 01: Name & Gender
- Step 02: University & Hostel
- Step 03: Age
- Step 04: Profile Photo Upload
- Step 05: Height & Weight
- Step 06: Home State
- Step 07: College Year
- Step 08: Department / Course
- Step 09: Face Verification (Pico ML Detector)
- On Face Verification Complete: Shows `FaceVerifiedTransition` (1.5s celebratory overlay) -> routes directly to `HomePage` (Screen 12).

### Navratri Event Vibe Registration (Screens 13–21):
- Accessible from `HomePage` via "Find My Match" button on Navratri banner.
- Step 01: Partner Gender Preference
- Step 02: Campus Interests
- Step 03: Favourite Evening Spot
- Step 04: Navratri Excitement Level (Slider)
- Step 05: Garba Skill Level
- Step 06: Navratri Vibes Selection
- Step 07: Personality Prompt 01
- Step 08: Personality Prompt 02
- Step 09: Instagram Handle
- On Final Step Complete: Routes to `SubmissionSuccessPage` (Screen 22) -> `CountdownPage` (Screen 23).

---

## 7. Supabase Integration Strategy & Fallback Mode

To guarantee that the application continues working 100% out-of-the-box before, during, and after Supabase environment variable configuration:
- `src/lib/supabase/client.ts` initializes the Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- If environment variables are not yet provided (or in local dev preview without active Supabase credentials), the service layer gracefully operates in **Local Mock Fallback Mode** using local persistence (`localStorage`) without breaking the app or throwing uncaught exceptions.
- The UI components remain completely agnostic to whether Supabase is actively online or running mock data.

---

## 8. Migration Phases & Step-by-Step Implementation

- **Phase 1: Foundation & Types Centralization**
  - Create `src/types/` structure: `user.ts`, `events.ts`, `navigation.ts`, `api.ts`.
  - Centralize route constants in `src/constants/routes.ts`.
  - Re-export for seamless backward compatibility.

- **Phase 2: Supabase Infrastructure & Service Layer**
  - Create `src/lib/supabase/client.ts`, `env.ts`, `types.ts`.
  - Implement domain services: `authService.ts`, `profileService.ts`, `onboardingService.ts`, `storageService.ts`, `eventService.ts`, `matchmakingService.ts`.

- **Phase 3: Auth & Onboarding State Domains (Hooks & Providers)**
  - Implement `AuthProvider` and `useAuth` hook.
  - Implement `OnboardingContext` and `useOnboarding` hook with validation helpers.
  - Wrap application in `AppProviders`.

- **Phase 4: Component & Page Modularization**
  - Extract individual step components into dedicated, clean page files under `src/pages/onboarding/steps/` and `src/pages/events/navratri/steps/`.
  - Create `LandingPage`, `PhoneNumberSignUpPage`, `HomePage`, `ProfileSettingsPage`, `SubmissionSuccessPage`, `CountdownPage`.
  - Maintain the exact visual layout, micro-animations, typography, and styling.

- **Phase 5: Route Orchestrator & App.tsx Refactor**
  - Refactor `App.tsx` into a lightweight, declarative router coordinating pages and guards.
  - Update `DevScreenRail.tsx` to drive the declarative router while keeping the exact 24-step numbering intact.

- **Phase 6: Verification & Final Polish**
  - Run `npm run lint` (`tsc --noEmit`) and `npm run build`.
  - Perform step-by-step navigation verification from Screen 01 through Screen 24.
  - Test quick-fill, OTP flow, back navigation, refresh persistence, and dev rail jumps.

---

## 9. Risk Assessment & Mitigation

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| Breaking UI layouts, styling, or animations | High | Refactor pages by moving existing JSX verbatim into dedicated files. Zero CSS or visual changes. |
| Breaking DevScreenRail functionality | High | DevScreenRail remains connected to the central route controller; each index 1..24 maps to an explicit named route. |
| Supabase credential missing in dev | Medium | Built-in smart fallback in the service layer ensures full local functionality even if `.env` is unpopulated. |
| Circular dependencies | Medium | Enforced dependency flow: UI -> Hooks -> Services -> Supabase. UI never imports services directly. |

---

## 10. Verification Checklist

- [ ] All 24 screen views render properly without missing styles or broken assets.
- [ ] Phone sign-up sheet, OTP inputs, countdown timer, and confetti work smoothly.
- [ ] Step 01 to 09 Onboarding flow progresses, validates inputs, and triggers face verification.
- [ ] Face verification camera with Pico cascade runs and completes celebration transition.
- [ ] Screen 12 (Home) correctly navigates to Navratri flow or Profile settings.
- [ ] Navratri steps 13 to 21 progress, validate, and navigate to Radar success screen.
- [ ] Radar scanner procedural dots and Countdown timer operate with sneak peek reveal modal.
- [ ] DevScreenRail jump buttons 1 through 24 navigate to the exact intended screen.
- [ ] TypeScript compiler passes with 0 errors (`npm run lint`).
- [ ] Production build succeeds with 0 errors (`npm run build`).
