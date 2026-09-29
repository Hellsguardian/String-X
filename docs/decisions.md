# STRING X — Architecture Decision Records (ADRs)

This document records the foundational architectural decisions made for the STRING X codebase.

---

## ADR 01: React 19 + TypeScript + Vite 8 Toolchain
- **Context:** The application requires high performance, fast HMR, instant component feedback, and strong type safety across 24 screens.
- **Decision:** Use React 19 with Vite 8 and TypeScript 5.8+.
- **Reason:** Vite provides near-instant cold starts (<400ms) and sub-second builds. TypeScript guarantees compile-time verification across domain entities and database rows.
- **Alternatives Considered:** Next.js (unnecessary server-side rendering complexity for a client-side campus web app).
- **Consequences:** Code runs as a high-performance Single Page Application (SPA) requiring static hosting with an index fallback.

---

## ADR 02: Supabase as Unified Backend
- **Context:** STRING X needs user authentication (SMS OTP), relational data (profiles, events, questionnaires), and binary media storage (profile photos).
- **Decision:** Adopt Supabase as the unified backend (Supabase Auth, PostgreSQL, and Storage).
- **Reason:** Consolidates auth, relational schema, and S3-compatible storage under a single client SDK with native Row Level Security (RLS).
- **Alternatives Considered:** Firebase (poor relational query support for complex matchmaking), custom Express/Node API (higher maintenance overhead).
- **Consequences:** Backend logic is driven directly through PostgreSQL RLS and client-safe queries.

---

## ADR 03: Service Layer Abstraction over Raw Supabase Queries
- **Context:** Early UI prototypes frequently embed database queries (`supabase.from('profiles').select(...)`) directly inside button click handlers, creating severe coupling.
- **Decision:** Enforce a strict Service Layer (`src/services/`) returning `ServiceResult<T>`.
- **Reason:** Prevents UI components from having any knowledge of SQL column names, table structures, or SDK methods. Allows testing UI components in complete isolation.
- **Alternatives Considered:** Calling Supabase directly in components or custom hooks.
- **Consequences:** Adding or modifying a database column only requires updating the mapper function in `profileService.ts`.

---

## ADR 04: Decomposition of Monolithic `OnboardingFlow.tsx`
- **Context:** The original `OnboardingFlow.tsx` was 713 lines long, managing 18 distinct step screens with an internal switch statement. A bug in Step 3 could accidentally break Step 16.
- **Decision:** Decompose each step into an isolated component under `src/pages/onboarding/steps/` and `src/pages/events/navratri/steps/`.
- **Reason:** Ensures independent maintainability. Adding Step 19 or reordering steps does not require modifying unrelated step files.
- **Alternatives Considered:** Keeping a single monolithic file with inline render functions.
- **Consequences:** 18 clean, single-responsibility files; each step can be reviewed and edited in isolation.

---

## ADR 05: Centralized AuthProvider with Session Source of Truth
- **Context:** Multiple screens previously maintained independent checks for whether a user was logged in, leading to out-of-sync navigation loops.
- **Decision:** Create a centralized `AuthProvider` (`src/features/auth/context/AuthContext.tsx`) that subscribes to Supabase auth events.
- **Reason:** Provides a single source of truth for the session, user profile, and onboarding completion status across the entire application lifecycle.
- **Alternatives Considered:** Checking `localStorage` directly in each page.
- **Consequences:** Consistent session restoration, unified sign-out, and zero duplicate profiles.

---

## ADR 06: Semantic Route Keys vs. Arbitrary Page Numbers
- **Context:** Prototype navigation relied on numbers (`stepIndex: 1..24`). Changing one step shifted indices and broke routing math (`stepIndex - 3`).
- **Decision:** Use strongly-typed enum constants (`AppRoute`) as the primary routing keys, and treat numbers as secondary display metadata.
- **Reason:** Code becomes self-documenting (`navigateTo(AppRoute.HOME)` vs `setScreen(12)`).
- **Alternatives Considered:** Storing numeric step offsets.
- **Consequences:** Routes can be rearranged or expanded without breaking navigation logic.

---

## ADR 07: Client-Side Pico.js Face Detection
- **Context:** The app requires real-time facial verification to ensure students submit authentic selfies.
- **Decision:** Run the lightweight Pico.js cascade model locally in the browser (`/models/facefinder`) rather than sending video streams to an external AI server.
- **Reason:** Zero server bandwidth costs, instant 60fps local frame analysis, and privacy preservation (video never leaves the device until the user confirms the photo).
- **Alternatives Considered:** Streaming video to a cloud vision API.
- **Consequences:** Camera analysis runs client-side with minimal CPU footprint.

---

## ADR 08: Offline / Smart Fallback Engine
- **Context:** Developers and preview environments frequently run without live Supabase credentials configured.
- **Decision:** Implement automatic local mock storage fallback in the service layer when `VITE_SUPABASE_URL` is unconfigured.
- **Reason:** Guarantees the application always runs out-of-the-box in local development, continuous integration, and demo previews without throwing unhandled exceptions.
- **Alternatives Considered:** Throwing fatal errors on missing `.env` keys.
- **Consequences:** Flawless development experience and seamless transition to production once keys are added.

---

## ADR 09: Removal of Unused Profile Columns & Schema Alignment
- **Context:** The initial prototype schema defined `nickname`, `pronouns`, and `is_day_scholar`. However, the production String X onboarding UX collects legal/display `full_name`, `gender`, `birth_year`, `university_id`, `hostel_id`, `course_id`, `study_year`, `home_state`, `height_cm`, `weight_kg`, and `instagram_id`. No UI gathers nickname, pronouns, or day scholar flags.
- **Decision:** Safely remove `nickname`, `pronouns`, and `is_day_scholar` from `public.profiles` and all dependent projection views (`v_matched_profiles`, `v_admin_users`).
- **Reason:** Eliminates dead schema overhead, prevents client permission confusion, and aligns database column-level grants strictly with active onboarding fields.
- **Alternatives Considered:** Keeping deprecated columns as nullable compatibility stubs.
- **Consequences:** Cleaner schema, zero wasted storage, and zero drift between frontend domain types and the database.

---

## ADR 10: Onboarding Photo Isolation, Resilient University Resolution, and Database Registration Gate
- **Context:** Three auth/onboarding behavioral anomalies were identified: (1) Google OAuth avatars auto-populated the profile photo step instead of requiring intentional user upload, (2) `university_id` intermittently saved as `NULL` when users only modified hostel cards or when lookup timing raced, and (3) returning completed users were routed back into onboarding due to premature client auth checks.
- **Decision:**
  1. Isolate OAuth user metadata: never copy `avatar_url` or `picture` into `profile.photoUrl`.
  2. Implement resilient university resolution with whitespace normalization, case-insensitive comparison, and static seeded fallbacks for known institutions, ensuring all hostel updates and step 1 Continue events explicitly carry `university_id` and block step progression on resolution failure.
  3. Enforce the database as the sole source of truth for completion (`onboarding_status === 'completed' && is_profile_completed === true`), await database profile hydration before marking auth state as `authenticated`, and render a pre-flight loading state in `AppShell` to eliminate onboarding flashing.
- **Reason:** Guarantees data integrity in `public.profiles`, prevents accidental nullification of critical foreign keys, ensures authentic user photo uploads, and gives returning completed users instant direct access to Page 12 (`AppRoute.HOME`).
- **Consequences:** Deterministic database records, resilient multi-step hydration, and seamless returning user UX.

---

## ADR 11: Server-Side Atomic Account Deletion, Active Storage Cleanup & 30-Day Retention Archive
- **Context:** String X users must be able to delete their account directly from Profile Settings. Client-side deletion of `auth.users` is impossible without exposing service-role keys (security breach). Account data must be retained temporarily for legal/compliance reasons (30-day retention) before purging. Additionally, deleted users must be able to re-register later with the same Google/email account without encountering "user already exists" collisions.
- **Decision:**
  1. Create `public.deleted_accounts` table mirroring active `public.profiles` columns with an added metadata column: `deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()`. The table has NO foreign key to `auth.users(id)` so original auth accounts can be removed.
  2. Implement atomic `delete_user_account()` RPC (`SECURITY DEFINER`) that reads the current authenticated user's profile, archives it to `deleted_accounts`, verifies the insertion, and deletes the row from `auth.users`.
  3. Purge user-owned active storage files in `profile-photos` and `verifications` storage buckets upon deletion.
  4. Deleting from `auth.users` automatically cascade-deletes active records in `profiles`, `profile_photos`, `user_interests`, `matches`, and `connections`, completely freeing the Google identity in Supabase Auth.
  5. Provide `purge_expired_deleted_accounts(p_retention_days)` for admin/cron cleanup of archives older than 30 days.
  6. Enforce strict RLS: direct client reads/writes on `deleted_accounts` are completely revoked. Internal archives and retention details are strictly omitted from the user-facing UI; the confirmation modal communicates permanent account, photo, and profile removal from String X.
- **Reason:** Protects service-role keys from browser exposure, enforces strict transactional atomicity (archival succeeds before deletion), guarantees clean same-email re-registration, purges active storage assets, and satisfies compliance retention requirements.
- **Consequences:** Safe, one-tap permanent account deletion from `ProfileSettingsScreen` with zero client-side privilege leaks and seamless future re-registration.

---

## ADR 12: Separation of Main Profile Photo and Face Verification Imagery
- **Context:** Previously, `ProfileSettingsScreen` and `HomeScreen` contained a fallback: `avatarPhoto = profile.photoUrl || profile.faceVerificationPhoto`. When users had not yet uploaded a main photo or upon database rehydration, the private biometric selfie captured during identity verification was rendered as their public avatar.
- **Decision:**
  1. Main profile photo is stored exclusively in the public CDN bucket `profile-photos` and tracked in `public.profile_photos` table with `is_primary = true`.
  2. Face verification selfie is stored exclusively in the private `verifications` bucket and tracked in `profiles.face_verification_path`.
  3. Main DP resolution must **NEVER** fall back to face verification or Google OAuth metadata: `const avatarPhoto = profile.photoUrl;`. If missing, the UI renders the standard initials placeholder.
  4. Onboarding Step 04 uploads the selected photo to `profile-photos` and records it in `profile_photos` table, making main DP storage explicit and distinct from biometric verification.
- **Reason:** Biometric face verification evidence is strictly private and must never be exposed as a public avatar, match photo, or card display.
- **Consequences:** Zero leakage of verification evidence into public visual components.


