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
- **Context:** STRING X needs user authentication (initially prototyped with SMS OTP, later evolved to Google OAuth in ADR 17), relational data (profiles, events, questionnaires), and binary media storage (profile photos).
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

---

## ADR 13: Navratri Event Questionnaire Routing & Completion Guard Isolation
- **Context:** On the Home screen (`AppRoute.HOME`), the Navratri 2026 event card features a "Find My Match →" CTA button designed to launch the 9-step event questionnaire starting at Step 9 (`NavratriStep01Partner`) in `OnboardingFlowContainer`. However, clicking the button had no visible effect. In `AppShell`, a post-authentication `useEffect` checked `if (isOnboardingCompleted)` and automatically redirected any active `screen === AppRoute.ONBOARDING` back to `AppRoute.HOME`, treating all onboarding screens as core registration steps and immediately canceling the navigation.
- **Decision:**
  1. Refine the completion guard in `AppShell` so it strictly bypasses core onboarding steps (`screen === AppRoute.ONBOARDING && onboardingStep < 9`).
  2. Permit completed users to navigate into the Navratri event matching questionnaire when `onboardingStep >= 9`.
  3. Wire the Home screen CTA button (`id="find-my-match-btn"`) to dispatch `navigateTo(AppRoute.ONBOARDING, 9)` and `setOnboardingStep(9)`.
  4. Preserve the entire existing 9-step Navratri questionnaire (`NavratriStep01Partner` through `NavratriStep09Instagram`), `SubmissionSuccessPage` (`AppRoute.SUCCESS`), and `CountdownPage` (`AppRoute.COUNTDOWN`).
- **Reason:** Enables completed users to participate in campus events without re-triggering core registration or being bounced back to Home.
- **Consequences:** Seamless entry into Navratri 2026 matchmaking flow from Home with zero disruption to core auth or profile state.

---

## ADR 14: Matchmaking Waiting Screen Indefinite Search & Real Match Gating
- **Context:** The matchmaking waiting radar screen (`SubmissionSuccessScreen`) previously auto-transitioned to the "Strings Attached" countdown screen after a hardcoded 5-second `setInterval` curve, regardless of whether a partner match actually existed. Screen clicks also triggered immediate fake match transitions.
- **Decision:**
  1. Remove hardcoded timers, progress === 100 auto-navigation, and container click triggers from `SubmissionSuccessScreen`.
  2. Implement an explicit matchmaking state machine (`'searching' | 'evaluating' | 'matched' | 'error'`).
  3. Integrate `matchmakingService.checkActiveMatch()` and `subscribeToMatches()` querying `public.v_my_matches` and `public.matches` where `(user_a_id = auth.uid() OR user_b_id = auth.uid()) AND status = 'active'`.
  4. Keep the user on the matchmaking radar screen indefinitely while searching or evaluating. Progress indicators cycle procedurally across wave steps without misleading users with a permanent 100%.
  5. Only navigate to "Strings Attached" (`AppRoute.COUNTDOWN`) when a genuine match object is confirmed by the backend.
  6. Display an inline retry/error state if network queries fail, maintaining visual radar animations and automatically retrying on the next poll cycle.
- **Reason:** Guarantees honest user experience where the screen only confirms a match when an actual pairing exists in the database.
- **Consequences:** Accurate real-time matchmaking synchronization without synthetic auto-completion.

---

## ADR 15: Phase 1 Database Cleanup — Consolidation of Event Preferences & Telemetry
- **Context:**
  1. `event_vibe_tags` was originally designed as a separate junction table for multi-selected excitement chips. However, the String X flow collects exactly up to 3 choices for "What are you most excited about this Navratri?" (`NavratriStep06Vibes`). Maintaining a separate junction table created unnecessary JOINs, foreign key cascades, and extra RLS policies.
  2. `match_preferences` was originally created as a separate table for partner gender filtering per event (`user_id`, `event_id`, `partner_gender_preference`). Because every festival participant already completes an `event_registrations` -> `event_preferences` questionnaire record, isolating gender preference into a second table added redundant state management.
  3. `event_preferences` carried redundant lifecycle columns (`is_submitted`, `submitted_at`, `updated_at`) that duplicated `event_registrations.status` and `event_registrations.registered_at`.
- **Decision:**
  1. Drop `public.event_vibe_tags`. In-line the 3 selected answers directly into `public.event_preferences` as `most_excited_1`, `most_excited_2`, and `most_excited_3` (`TEXT NULL`), preserving the exact option strings.
  2. Drop `public.match_preferences`. In-line `partner_gender_preference` directly into `public.event_preferences` (`TEXT NOT NULL DEFAULT 'Open to Anyone'` with `CHECK (partner_gender_preference IN ('Girls', 'Guys', 'Open to Anyone'))`).
  3. Drop `is_submitted`, `submitted_at`, and `updated_at` from `public.event_preferences`.
  4. Retain `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` on `event_preferences`.
  5. Retain `public.interests` and `public.user_interests` completely unchanged as the relational many-to-many interest catalog.
- **Reason:** Simplifies the event persistence layer, unifies all questionnaire telemetry into a single upsert, removes unused tables and dead columns, and keeps the database lean without breaking frontend behavior.
- **Consequences:** Event registration telemetry is self-contained in `event_preferences`; zero orphan tables; full compatibility with existing UI steps.

---

## ADR 16: Automated Single-Value Match Assignment (Event Registration Trigger Synchronization)
- **Context:** Previously, manual match assignment required invoking multi-parameter RPCs or writing directly to `public.matches` and `public.connections`. Festival administrators needed a streamlined workflow where setting `matched_with` (e.g. `SX001 -> matched_with = SX005`) on an `event_registrations` row immediately synchronizes the reciprocal registration, safely updates canonical `matches`, and establishes the corresponding `connections` row.
- **Decision:**
  1. Add `matched_with TEXT REFERENCES public.profiles(user_code) ON DELETE SET NULL` to `public.event_registrations`.
  2. Add partial unique index `idx_uq_event_registrations_matched_with` on `(event_id, matched_with) WHERE matched_with IS NOT NULL` preventing multiple registrations from claiming the same partner within the same festival.
  3. Implement `public.sync_event_registration_match()` trigger function with recursion control (`pg_trigger_depth() > 1`) and trigger `trg_sync_event_registration_match` on `BEFORE INSERT OR UPDATE OF matched_with`.
  4. Enforce bidirectional sync: setting `SX001.matched_with = SX005` automatically sets `SX005.matched_with = SX001`.
  5. Canonical match row synchronization: creates or reactivates one canonical `matches` record with `user_a_id = LEAST(u1, u2)` and `user_b_id = GREATEST(u1, u2)`, `match_source = 'manual'`, and `status = 'active'`, respecting `trg_check_single_active_match`.
  6. Connection synchronization: creates or reactivates corresponding `connections` record with `status = 'pending'`, `user_a_revealed = false`, and `user_b_revealed = false`.
  7. Safe reassignment & clearing: setting `SX001.matched_with = NULL` clears the reciprocal registration, sets old match to `'cancelled'`, and connection to `'unmatched'`. Reassigning to a new partner safely retires previous active pairings to `'replaced'` and clears previous partner links.
  8. Validation & Safety: Rejects self-matching (`SX001 -> SX001`), missing partner profiles, and un-enrolled event partners with explicit PostgreSQL exceptions.
  9. Update `public.v_admin_users` to expose `registered_matched_with`.
  10. Implement intelligent "Find My Match" routing in the frontend: checks questionnaire completion first (routes to Step 9 if incomplete), then verifies canonical active match in the database (routes to Page 23 Countdown if active, or Page 22 Waiting Radar if searching).
- **Reason:** Provides atomic, administrative simplicity with zero race conditions, guarantees canonical relational integrity, and keeps client security strictly contained.
- **Consequences:** Administrators can execute match assignments via single-field edits; frontend waiting radar and countdown pages synchronize automatically.

---

## ADR 17: Google OAuth as Primary Authentication & Parul University Email Allowlisting
- **Context:** SMS OTP authentication incurred high operational latency, SMS gateway costs, and lacked institutional verification. String X requires guaranteed student identity authentication limited to the Parul University campus ecosystem, while allowing designated test/developer accounts for platform engineering and App Store / Google Play reviews.
- **Decision:**
  1. Adopt Supabase Google OAuth as the primary authentication flow across the application.
  2. Implement `public.allowed_auth_emails` allowlist table with RLS permitting administrators to maintain developer and tester access.
  3. Implement `public.is_email_allowed(p_email TEXT)` validator checking for official Parul University student pattern (`^[0-9]+@paruluniversity\.ac\.in$`) or active entry in `allowed_auth_emails`.
  4. Implement `public.extract_enrollment_no(p_email TEXT)` extracting the numeric student enrollment prefix.
  5. Add `email TEXT NOT NULL UNIQUE` and `enrollment_no TEXT UNIQUE NULL` to `public.profiles`.
  6. Enforce immutable profile email synchronization via `trg_enforce_profile_email_identity` (BEFORE trigger on `public.profiles`) and `on_auth_user_email_updated` (AFTER trigger on `auth.users`), while allowing unhindered service_role and admin maintenance.
  7. Update `handle_new_user()` trigger to validate allowed email before initializing the initial profile stub on `auth.users` insert.
- **Reason:** Guarantees campus-exclusive student participation, prevents client-side identity spoofing, automates enrollment number extraction, and provides zero-cost authenticated OAuth sessions.
- **Consequences:** Students must sign in using their official university Google account; external non-allowlisted emails are rejected with descriptive authorization notices.

---

## ADR 18: Real-Time Aggregate Platform Statistics
- **Context:** The String X landing screen and marketing displays require live social-proof metrics (e.g. total registered profiles count) without performing expensive `COUNT(*)` queries on `public.profiles` or exposing sensitive student profile rows to anonymous/unauthenticated visitors.
- **Decision:**
  1. Create `public.platform_statistics` table with a singleton row (`id = 'global'`, `total_profiles INTEGER`, `updated_at TIMESTAMPTZ`).
  2. Implement `public.sync_platform_profile_count()` trigger function (`SECURITY DEFINER`) attached to `public.profiles` on `AFTER INSERT OR DELETE` to atomically increment and decrement `total_profiles`.
  3. Grant public read-only access (`FOR SELECT TO anon, authenticated USING (true)`) while revoking all mutation capabilities from client roles.
  4. Register `public.platform_statistics` in the `supabase_realtime` publication for instant reactive client subscriptions.
- **Reason:** O(1) instantaneous counter reads, zero privacy/PII leaks to unauthenticated clients, and zero query overhead during high-traffic campus launch spikes.
- **Consequences:** Total profile counters update in real time across all connected clients with minimal database resource consumption.

---

## ADR 19: Unified Verification Subsystem & PostgreSQL Verification State ENUM
- **Context:** The original prototype stored flat verification fields directly on `public.profiles` (`verification_status`, `face_verification_path`, `face_verified_at`, `verification_rejection_reason`). This architecture suffered from key limitations: (1) no multi-attempt historical audit trail when students re-submitted rejected photos, (2) conflation of public profile photo (DP) moderation with private live webcam facial selfie verification, (3) lack of geolocation telemetry capture to detect proxy submissions, and (4) inconsistent status strings across services.
- **Decision:**
  1. Create dedicated `public.verification` table storing complete verification attempt history with foreign keys to `auth.users` and `public.profile_photos`.
  2. Create PostgreSQL ENUM `public.verification_state` with explicit values: `'pending'`, `'verified'`, `'rejected'`.
  3. Allow multiple attempt rows per student (NO unique constraint on `user_id`), indexed deterministically by `(user_id, created_at DESC, id DESC)`.
  4. Drop `face_verified_at` and `verification_rejection_reason` from `public.profiles`; retain `profiles.verification_status` as a profile-level summary field and `face_verification_path` strictly as transitional compatibility state.
  5. Require non-null geolocation telemetry (`latitude`, `longitude`, `accuracy_m`) in `submit_face_verification` RPC as a secondary fraud signal (not identity proof).
  6. Add `submit_dp_verification(p_profile_photo_id UUID)` RPC for independent profile photo moderation.
  7. Redefine `admin_verify_user(p_user_code_or_id, p_approved, p_reject_dp, p_reject_face, p_rejection_reason)` allowing granular moderation of DP, Face, or both with structured rejection reasons.
- **Reason:** Establishes a complete moderation audit trail, separates public avatar review from biometric identity verification, and enforces strict type safety via database enums.
- **Consequences:** Verification history is preserved immutably across re-attempts; the latest attempt deterministically controls active user standing.

---

## ADR 20: Bidirectional Verification State Synchronization & Profile Propagation
- **Context:** Following the initial unified verification rollout, administrators moderating users directly in Supabase Table Editor encountered restrictive CHECK constraint exceptions (`chk_verification_status_invariants`) when updating parent and child status fields independently. Furthermore, manual edits in `public.verification` did not automatically propagate to `public.profiles.verification_status`, requiring double updates.
- **Decision:**
  1. Drop the restrictive `chk_verification_status_invariants` CHECK constraint; rely on `public.verification_state` ENUM for value integrity.
  2. Implement `public.sync_verification_states()` BEFORE trigger function on `public.verification`:
     - **INSERT:** Deterministically forces all new verification attempts to `pending / pending / pending`.
     - **UPDATE (Parent edit):** `pending` $\to$ `dp: pending, face: pending`; `verified` $\to$ `dp: verified, face: verified`; `rejected` $\to$ defaults to `dp: verified, face: rejected` (if neither child is rejected).
     - **UPDATE (Child edit):** Any child `rejected` $\to$ parent `rejected`; both children `verified` $\to$ parent `verified`; otherwise parent `pending`.
  3. Implement `public.sync_verification_to_profiles()` AFTER trigger function on `public.verification`:
     - Automatically updates `public.profiles.verification_status` whenever a verification row is inserted or updated.
     - Resolves the authoritative latest attempt using deterministic ordering: `ORDER BY created_at DESC, id DESC LIMIT 1`.
     - Operates after the row operation, before transaction commit, preventing stale profile status when older historical rows are edited.
  4. Perform one-time migration reconciliation in `20261005000002` aligning all profiles with their latest verification attempt.
- **Reason:** Eliminates administrator workflow errors during manual moderation, guarantees deterministic state derivation, and ensures `public.profiles` always mirrors the latest verification attempt.
- **Consequences:** Admins can edit parent or child fields freely in Table Editor; profile summary status updates automatically with zero desynchronization.



