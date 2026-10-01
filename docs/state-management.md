# STRING X — State Management Architecture

> **Version:** 3.0.0  
> **Status:** APPROVED ARCHITECTURAL SPECIFICATION (STATE SCOPES & DEDUPLICATION)  

---

## 1. State Classification Matrix

STRING X follows a strict rule on state scope: **Keep state as local as possible, and elevate only when multiple unrelated domains require access.**

```mermaid
flowchart TD
    subgraph Server_State ["1. Server State (Supabase PostgreSQL / Storage)"]
        DB_User["auth.users (OAuth Session, Email, User ID)"]
        DB_Profile["profiles (Name, Gender, Height, Weight, Verification Status)"]
        DB_Verif["verification (DP/Face Verification Attempts & Geolocation)"]
        DB_Event["events, event_registrations & event_preferences"]
        DB_Matches["matches (Canonical A < B Pairs, Status, Reveal)"]
        DB_Stats["platform_statistics (Global Realtime Profile Count)"]
    end

    subgraph Global_Context ["2. Global Application State (React Context)"]
        AuthContext["AuthContext: user, session, profile, status, profileLoading, authError"]
        OnboardingContext["OnboardingContext: active step, timer, draft"]
        NavContext["useAppNavigation: current screen, onboardingStep, overlays"]
    end

    subgraph Local_Component_State ["3. Local UI State (useState / useRef)"]
        UI_Inputs["Input buffers, search queries, active tabs"]
        UI_Camera["Webcam streams, video refs, Pico detection memory"]
        UI_Animation["Timer countdowns, confetti triggers, sheet open flags"]
        UI_Modals["MatchRevealModal, reverificationMode ('dp' | 'face')"]
    end

    Server_State <-->|Async Services & Triggers| Global_Context
    Global_Context <--> Local_Component_State
```

---

## 2. What Belongs Where?

### 2.1 What Belongs in Server State (Supabase)?
- Anything that must survive device restarts or session re-logins:
  - Account email, Parul University enrollment number, and Supabase user UUID.
  - Profile identity: Full name, campus, hostel, department, year, age, home state.
  - Physical stats: Height (cm) and weight (kg).
  - Security & verification artifacts: Verification attempts in `public.verification`, photo paths, geolocation telemetry, and verification states (`pending`, `verified`, `rejected`).
  - Questionnaire answers: `event_preferences` (partner gender preference, excitement vibes, garba energy, prompts, Instagram ID).
  - Match pairings and connections (`public.matches`, `public.connections`).
  - Aggregate counter in `public.platform_statistics`.

### 2.2 What Belongs in Global React State?
- User authentication status (`'loading' | 'authenticated' | 'unauthenticated'`).
- The active in-memory `UserProfile` object to avoid repeated database refetches on every step transition.
- In-flight promise deduplication cache (`inFlightProfilePromiseRef`) in `AuthContext` to prevent redundant parallel profile loads.
- Global error notices (`authError`: title, message).
- Route controller state (`screen`, `onboardingStep`, `isShowingVerifiedTransition`).

### 2.3 What Belongs in Local Component State?
- **Temporary Text Buffers:** While typing in a search bar or Instagram handle field before blur/submit.
- **Re-Verification Modes:** `reverificationMode` (`'dp' | 'face' | null`) tracking when a user from Home is updating their rejected asset.
- **Micro-Animations & UI Toggles:**
  - Active tab selection in campus filters (`selectedCategory`).
  - Active rotating dial angle in `WeightDialCircle`.
  - Confetti blast triggers.
- **Hardware & Media State:**
  - WebRTC video stream tracks and canvas analysis frames in `FaceVerificationCamera`.
  - Auto-advance timeout timer handles (`advanceTimerRef`).

### 2.4 What Must NEVER Be Global?
- **Step auto-advance timers:** Must remain local to the step runner with clean unmount effect hooks.
- **Camera video frames:** Storing image buffers in global state causes massive React re-render lag.
- **Temporary modal visibilities:** Modal state should reside within the page or component triggering it.

---

## 3. State Synchronization Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant UI as User Input (e.g. AgeSelector)
    participant Local as Local Component State
    participant Context as AuthContext (React)
    participant Service as profileService
    participant Supabase as Supabase Database

    UI->>Local: User selects age 21
    Local->>Context: updateProfile({ age: 21 })
    Context->>Context: Immediate optimistic update (UI re-renders smoothly)
    Context->>Service: saveProfile(userId, { age: 21 }, latestProfile, step)
    Service->>Supabase: Supabase UPDATE profiles query
    Supabase-->>Service: Success response
```

1. **Optimistic Local Response:** When a user selects an option (e.g. college year), `updateProfile` immediately applies the change to memory so the UI remains fluid.
2. **Background Persistence:** The service layer asynchronously synchronizes the field to Supabase PostgreSQL or local draft storage.
3. **Draft Recovery:** If a user accidentally closes their browser tab mid-onboarding, `onboardingService.getDraft()` restores uncommitted values upon re-opening.
