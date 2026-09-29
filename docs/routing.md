# STRING X — Routing & Navigation Architecture

## 1. Routing Model

STRING X utilizes a **declarative, centralized routing model** managed by `useAppNavigation` (`src/features/navigation/hooks/useAppNavigation.ts`) and orchestrated in `AppShell` (`src/app/AppShell.tsx`).

### Why Page Numbers Are NOT the Source of Truth
In prototype implementations, screens were represented as arbitrary numbers (`1..24` or `step === 8`). 
Relying on numbers causes critical architectural brittleness:
1. Re-ordering steps or inserting "Step 04B" shifts all subsequent numbers, causing silent runtime failures.
2. Code coupling: Unrelated pages make assumptions like `if (step === 12) ...`.
3. Lack of semantic meaning: `navigateTo(AppRoute.HOME)` is explicit and type-safe, whereas `setScreen(12)` is opaque.

In STRING X:
- **Routes are named constants (`AppRoute`)**.
- **Page numbers are purely presentation metadata** displayed in header badges (`HeaderNav.tsx`) or desktop dev rails (`DevScreenRail.tsx`).
- Business logic never branches on raw page numbers.

---

## 2. Route Directory & Access Matrix

| Route Key (`AppRoute`) | Screen # | Component | Purpose | Access Level | Previous Route | Next Route |
|---|---|---|---|---|---|---|
| `landing` | `01` | `LandingPage` | Welcome screen, brand artwork, and CTA | Public | None | `phone-signup` |
| `phone-signup` | `02` | `PhoneNumberSignUpPage` | 10-digit phone entry and 6-digit OTP modal | Public | `landing` | `onboarding` or `home` (if existing) |
| `onboarding` (step 0) | `03` | `Step01NameGender` | Full name and gender identity | Authenticated | `phone-signup` | Step 1 (`04`) |
| `onboarding` (step 1) | `04` | `Step02CampusHostel` | University and campus hostel selection | Authenticated | Step 0 (`03`) | Step 2 (`05`) |
| `onboarding` (step 2) | `05` | `Step03Age` | Student age selector (15–28) | Authenticated | Step 1 (`04`) | Step 3 (`06`) |
| `onboarding` (step 3) | `06` | `Step04Photo` | Festive photo upload or avatar preset | Authenticated | Step 2 (`05`) | Step 4 (`07`) |
| `onboarding` (step 4) | `07` | `Step05HeightWeight` | Combined height ruler & weight dial | Authenticated | Step 3 (`06`) | Step 5 (`08`) |
| `onboarding` (step 5) | `08` | `Step06HomeState` | Indian state / UT picker | Authenticated | Step 4 (`07`) | Step 6 (`09`) |
| `onboarding` (step 6) | `09` | `Step07CollegeYear` | Academic year (1st, 2nd, 3rd, 4th, PG) | Authenticated | Step 5 (`08`) | Step 7 (`10`) |
| `onboarding` (step 7) | `10` | `Step08Course` | Department and degree course | Authenticated | Step 6 (`09`) | Step 8 (`11`) |
| `onboarding` (step 8) | `11` | `Step09FaceVerification`| Live selfie capture & Pico face detection | Authenticated | Step 7 (`10`) | Verified Transition |
| `home` | `12` | `HomePage` | Campus events feed & Navratri 2026 banner | Authenticated + Core Complete | None / Back from Profile | Navratri flow or `profile` |
| `onboarding` (step 9) | `13` | `NavratriStep01Partner` | Match partner gender preference | Authenticated | `home` (`12`) | Step 10 (`14`) |
| `onboarding` (step 10)| `14` | `NavratriStep02Interests`| Campus interest tags | Authenticated | Step 9 (`13`) | Step 11 (`15`) |
| `onboarding` (step 11)| `15` | `NavratriStep03EveningSpot`| Preferred evening spot at university | Authenticated | Step 10 (`14`) | Step 12 (`16`) |
| `onboarding` (step 12)| `16` | `NavratriStep04Excitement`| Navratri excitement slider (0–100) | Authenticated | Step 11 (`15`) | Step 13 (`17`) |
| `onboarding` (step 13)| `17` | `NavratriStep05GarbaLevel`| Garba dancing skill level | Authenticated | Step 12 (`16`) | Step 14 (`18`) |
| `onboarding` (step 14)| `18` | `NavratriStep06Vibes` | Top 3 Navratri excitement vibes | Authenticated | Step 13 (`17`) | Step 15 (`19`) |
| `onboarding` (step 15)| `19` | `NavratriStep07Prompt1` | Stay or Slay personality prompt | Authenticated | Step 14 (`18`) | Step 16 (`20`) |
| `onboarding` (step 16)| `20` | `NavratriStep08Prompt2` | Vibe check personality prompt | Authenticated | Step 15 (`19`) | Step 17 (`21`) |
| `onboarding` (step 17)| `21` | `NavratriStep09Instagram`| Social handle for partner reveal | Authenticated | Step 16 (`20`) | `success` (`22`) |
| `success` | `22` | `SubmissionSuccessPage` | Radar signal animation scanning campus | Authenticated + Registered | `home` | `countdown` (`23`) |
| `countdown` | `23` | `CountdownPage` | Live festival countdown & reveal modal | Authenticated + Registered | `home` | `profile` (`24`) |
| `profile` | `24` | `ProfileSettingsPage` | User card, settings, and sign-out | Authenticated | `home` (`12`) | `landing` (`01`) on logout |

---

## 3. Desktop DevScreenRail Integration

To facilitate testing and inspection during development without manual multi-step form entry, the desktop canvas includes `DevScreenRail.tsx` (`src/components/dev/DevScreenRail.tsx`).

The rail is driven by `DEV_SCREEN_MAP` in `src/constants/routes.ts`:

```typescript
export const DEV_SCREEN_MAP: DevScreenMapping[] = [
  { stepIndex: 1, screen: AppRoute.LANDING, label: 'Landing Screen' },
  { stepIndex: 2, screen: AppRoute.PHONE_SIGNUP, label: 'Phone Sign-Up' },
  { stepIndex: 3, screen: AppRoute.ONBOARDING, onboardingStep: 0, label: 'Name & Gender' },
  // ... steps 4 to 23
  { stepIndex: 24, screen: AppRoute.PROFILE, label: 'My Profile & Settings' },
];
```

Clicking button **`12`** directly invokes `navigateByStepIndex(12)`, which:
1. Resets transition overlays.
2. Sets `screen = 'home'`.
3. Renders `HomePage.tsx` with all live data bindings.
