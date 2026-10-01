# STRING X — Routing & Navigation Architecture

> **Version:** 3.0.0  
> **Status:** APPROVED ARCHITECTURAL SPECIFICATION (CENTRALIZED ROUTING & FIND MY MATCH STATE MACHINE)  
> **Router Controller:** `useAppNavigation` (`src/features/navigation/hooks/useAppNavigation.ts`)  
> **App Shell & Guard:** `AppShell` (`src/app/AppShell.tsx`)  

---

## 1. Routing Model & Design Philosophy

STRING X utilizes a **declarative, centralized routing model** managed by `useAppNavigation` and orchestrated in `AppShell`.

### Why Page Numbers Are NOT the Source of Truth
In prototype implementations, screens were represented as arbitrary numbers (`1..24` or `step === 8`). 
Relying on numbers causes critical architectural brittleness:
1. Re-ordering steps or inserting steps shifts all subsequent numbers, causing silent runtime failures.
2. Code coupling: Unrelated pages make assumptions like `if (step === 12) ...`.
3. Lack of semantic meaning: `navigateTo(AppRoute.HOME)` is explicit and type-safe, whereas `setScreen(12)` is opaque.

In STRING X:
- **Routes are named constants (`AppRoute`)**.
- **Page numbers are purely presentation metadata** displayed in header badges (`HeaderNav.tsx`) or desktop dev rails (`DevScreenRail.tsx`).
- Business logic branches strictly on semantic route constants and verified application/database states.

---

## 2. Route Directory & Access Matrix

| Route Key (`AppRoute`) | Screen # | Component | Purpose | Access Level | Previous Route | Next Route |
|---|---|---|---|---|---|---|
| `landing` | `01` | `LandingPage` | Welcome screen, Google OAuth sign-in, and brand artwork | Public | None | `onboarding` or `home` (via Google OAuth) |
| `phone-signup` | `02` | `PhoneNumberSignUpPage` | Phone OTP entry *(Historical prototype; locked in UI)* | Public | `landing` | `onboarding` or `home` (if existing) |
| `onboarding` (step 0) | `03` | `Step01NameGender` | Full name and gender identity | Authenticated | `landing` | Step 1 (`04`) |
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

## 3. Authoritative "Find My Match" State Machine

A student must **NEVER** reach the waiting radar (`AppRoute.SUCCESS`) or countdown (`AppRoute.COUNTDOWN`) simply because browser storage contains stale mock data. The authoritative event registration status is queried directly from Supabase:

```
                            Student clicks "Find My Match"
                                          ↓
                         Check Profile Verification Status
                                          ↓
                         is verification_status rejected?
                        ├── YES → Route to Re-Verification (Step 03 or Step 08)
                        └── NO
                                          ↓
                         Query Database Event Registration
                                          ↓
                         Has completed event registration?
                        ├── NO  → Route to Step 9 (NavratriStep01Partner)
                        └── YES
                                          ↓
                         Is matched_with assigned?
                        ├── NO  (NULL)     → Route to Page 22 (Radar / AppRoute.SUCCESS)
                        └── YES (Assigned) → Route to Page 23 (Countdown / AppRoute.COUNTDOWN)
```

---

## 4. Verification-Based Access Gating

STRING X maintains a strict distinction between **General Application Access** and **Matchmaking Eligibility**:

1. **General Application Access:** A user with `verification_status = 'rejected'` can still log in, browse the Home feed, view campus events, edit their profile, and adjust account settings. Account access is never locked.
2. **Matchmaking Actions Blocked:** Attempting to click "Find My Match", submit festival questionnaire answers, or enter the Radar scanner when `verification_status = 'rejected'` intercepts navigation:
   - If DP is rejected $\to$ routes to Step 03 (`Step04Photo`) in re-verification mode.
   - If Face selfie is rejected $\to$ routes to Step 08 (`Step09FaceVerification`) in re-verification mode.
3. **Restoration:** Once an updated photo or selfie is submitted, the new attempt is created in `public.verification` with status `'pending'`, immediately unblocking the user.

---

## 5. Match Reveal & Countdown Modal Navigation

On the Countdown screen (`AppRoute.COUNTDOWN`, Screen 23):
- While `is_revealed = false`, the student sees a ticking countdown timer toward the festival reveal moment with an animated card.
- When `is_revealed = true` (triggered by active premium status on either partner, admin override, or countdown reaching zero), clicking "View Match" or "Reveal Sneak Peek" opens `MatchRevealModal`.
- The modal reveals the partner's verified display name, college, hostel, course, mutual compatibility score, shared vibe tags, and their Instagram handle.

---

## 6. Desktop DevScreenRail Integration

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

Clicking button **`12`** directly invokes `navigateByStepIndex(12)`, which resets transition overlays, sets `screen = AppRoute.HOME`, and renders `HomePage.tsx` with live data bindings.
