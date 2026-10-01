# STRING X — Architecture Changelog

All notable changes and architectural refactorings for STRING X are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.11.0] - 2026-10-05

### Added
- **Verification State Enum & Bidirectional Synchronization:**
  - Converted `verification_status`, `dp`, and `face` columns in `public.verification` from `TEXT` to `public.verification_state` ENUM (`pending`, `verified`, `rejected`).
  - Dropped restrictive `chk_verification_status_invariants` constraint to enable independent component editing in Supabase Table Editor.
  - Implemented `public.sync_verification_states()` BEFORE trigger performing deterministic in-memory parent/child bidirectional synchronization:
    - `INSERT`: Deterministically forces new attempts to `pending / pending / pending`.
    - `UPDATE (Parent edit)`: `pending` $\to$ `dp: pending, face: pending`; `verified` $\to$ `dp: verified, face: verified`; `rejected` $\to$ defaults to `dp: verified, face: rejected`.
    - `UPDATE (Child edit)`: Any child `rejected` $\to$ parent `rejected`; both children `verified` $\to$ parent `verified`; otherwise parent `pending`.
  - Implemented `public.sync_verification_to_profiles()` AFTER trigger updating `public.profiles.verification_status` from the student's authoritative latest attempt (`ORDER BY created_at DESC, id DESC`).
  - Executed one-time profile reconciliation in migration `20261005000002_verification_bidirectional_sync.sql`.
  - Enforced verification-based matchmaking access control: `rejected` status locks matching actions while retaining general app access.

---

## [2.10.0] - 2026-10-04

### Added
- **Unified Multi-Attempt Verification Subsystem:**
  - Created `public.verification` table supporting composite multi-attempt history per student (no unique constraint on `user_id`, indexed by `user_id, created_at DESC, id DESC`).
  - Decoupled public profile photo (DP) moderation from private biometric facial selfie verification.
  - Updated `submit_face_verification(p_storage_path, p_latitude, p_longitude, p_accuracy_m)` RPC requiring non-null geolocation telemetry.
  - Added `submit_dp_verification(p_profile_photo_id UUID)` RPC for dedicated profile photo moderation.
  - Safely dropped `face_verified_at` and `verification_rejection_reason` from `public.profiles`.
  - Recreated `public.v_admin_users` projecting latest verification telemetry via `LATERAL` join.
  - Redefined `admin_verify_user` with independent DP/Face moderation and mandatory rejection reason.
  - Updated `complete_student_onboarding()` to verify active attempt directly from `public.verification`.
  - Created migration `20261004000001_unified_verification_system.sql`.

---

## [2.9.0] - 2026-10-03

### Added
- **Platform Statistics & Realtime Sync:**
  - Created `public.platform_statistics` table with singleton `'global'` row.
  - Implemented `sync_platform_profile_count()` trigger function on `public.profiles` (`AFTER INSERT OR DELETE`) maintaining `total_profiles` atomically.
  - Configured public read RLS policy (`FOR SELECT TO anon, authenticated USING (true)`).
  - Registered `public.platform_statistics` in the `supabase_realtime` publication for instant reactive client counters.
  - Created migration `20261003000001_platform_statistics.sql`.

---

## [2.8.0] - 2026-10-02

### Added
- **Authentication Allowlist & Profile Identity Schema:**
  - Adopted Supabase Google OAuth as primary authentication flow across the application.
  - Created `public.allowed_auth_emails` allowlist table with administrator RLS.
  - Added `public.is_email_allowed(p_email TEXT)` validator for official Parul University student pattern (`^[0-9]+@paruluniversity\.ac\.in$`) or allowlist presence.
  - Added `public.extract_enrollment_no(p_email TEXT)` extracting numeric student enrollment prefix.
  - Added `email` (`NOT NULL UNIQUE`) and `enrollment_no` (`UNIQUE NULL`) to `public.profiles`.
  - Implemented `trg_enforce_profile_email_identity` (BEFORE trigger) and `on_auth_user_email_updated` (AFTER trigger) for server-enforced email immutability.
  - Updated `handle_new_user()` trigger to initialize profile stubs with validated email and enrollment number.
  - Created migration `20261002000001_auth_email_allowlist.sql`.

---

## [2.7.0] - 2026-10-01

### Added
- **Phase 2 Matching Implementation (Automated Single-Value Match Assignment):**
  - Added `matched_with TEXT REFERENCES public.profiles(user_code) ON DELETE SET NULL` to `public.event_registrations`.
  - Added partial unique index `idx_uq_event_registrations_matched_with` on `(event_id, matched_with)` preventing multiple registrations from claiming the same partner within an event.
  - Implemented `public.sync_event_registration_match()` trigger function with recursion guard (`pg_trigger_depth() > 1`) and `trg_sync_event_registration_match` trigger on `BEFORE INSERT OR UPDATE OF matched_with`.
  - Enforced automatic bidirectional synchronization between registrations (e.g. `SX001.matched_with = 'SX005'` <-> `SX005.matched_with = 'SX001'`).
  - Canonical match & connection synchronization: automatically creates or updates canonical pairings in `public.matches` (`user_a_id = LEAST(...)`, `user_b_id = GREATEST(...)`, `match_source = 'manual'`, `status = 'active'`) and corresponding `public.connections` (`status = 'pending'`).
  - Safe reassignment, clearing (`matched_with = NULL`), collision handling (retiring existing active pairings to `'replaced'` / `'unmatched'`), and validation rejecting self-matching and un-enrolled event targets.
  - Updated `public.v_admin_users` to expose `registered_matched_with`.
  - Updated `src/lib/supabase/types.ts` with `matched_with: string | null` on `event_registrations`.
  - Updated `src/services/eventService.ts` to expose `matchedWith` from `getEventRegistration`.
  - Implemented intelligent "Find My Match" routing in `src/app/AppShell.tsx` and dynamic CTA button text in `src/components/screens/HomeScreen.tsx`.

---

## [2.6.0] - 2026-09-30

### Changed
- **Phase 1 Database Cleanup (Event Registration & Preferences):**
  - Retired `public.event_vibe_tags` table: inlined user excitement selections directly into `public.event_preferences` across three nullable `TEXT` columns (`most_excited_1`, `most_excited_2`, `most_excited_3`), preserving exact UI card option titles.
  - Retired `public.match_preferences` table: inlined `partner_gender_preference` directly into `public.event_preferences` (`TEXT NOT NULL DEFAULT 'Open to Anyone'`, `CHECK ('Girls', 'Guys', 'Open to Anyone')`).
  - Removed obsolete telemetry columns from `public.event_preferences`: dropped `is_submitted`, `submitted_at`, and `updated_at`.
  - Retained `created_at` timestamp on `public.event_preferences`.
  - Preserved `public.interests` and `public.user_interests` completely unchanged as the relational many-to-many interest catalog.
  - Created migration `20260930000001_cleanup_event_registration_schema.sql`.
  - Updated `src/lib/supabase/types.ts` to include full database types for `event_preferences`, `event_registrations`, `interests`, and `user_interests`.
  - Updated `src/services/eventService.ts` to persist event registration responses directly to `event_registrations` and `event_preferences` and sync selected interests to `user_interests`.

---

## [2.5.0] - 2026-09-30

### Fixed
- **Matchmaking Waiting Radar & Real Match Gating:**
  - Removed premature automatic navigation from the matchmaking screen (`SubmissionSuccessScreen`) to "Strings Attached" (`CountdownScreen`).
  - Replaced hardcoded progress timer and container click triggers with an indefinite searching/evaluating loop.
  - Implemented explicit matchmaking state machine (`'searching' | 'evaluating' | 'matched' | 'error'`).
  - Added backend match checking and real-time subscription via `matchmakingService.checkActiveMatch()` and `subscribeToMatches()`, querying `public.v_my_matches` and `public.matches`.
  - Configured procedural wave progress indicator that cycles continuously during search without misleading users with a fake 100%.
  - Navigation to "Strings Attached" now occurs strictly upon confirmation of a genuine match in the backend.

---

## [2.4.0] - 2026-09-30

### Fixed
- **Navratri 2026 "Find My Match" Navigation Flow:**
  - Resolved issue where clicking "Find My Match →" on the Home screen appeared to do nothing.
  - Root cause: `AppShell`'s post-authentication routing guard redirected any active `screen === AppRoute.ONBOARDING` back to `AppRoute.HOME` if `isOnboardingCompleted === true`, prematurely aborting entry into the Navratri questionnaire.
  - Refined the guard to strictly bypass core registration steps (`onboardingStep < 9`), allowing completed users to seamlessly enter the Navratri matching flow (`onboardingStep >= 9`) starting at Step 9 (`NavratriStep01Partner`).
  - Added accessible `id="find-my-match-btn"` and `aria-label` to the CTA button while preserving exact visual aesthetics and dimensions.
  - Verified end-to-end browser navigation through Step 01 (Partner Preference) to Step 02 (Interests).

---

## [2.3.0] - 2026-09-30

### Added
- **Delete Account Flow (`ProfileSettingsScreen`):**
  - Added "Delete Account" button directly below "Sign Out", styled in destructive red accents with a `Trash2` icon.
  - Implemented an animated confirmation modal communicating that the action is permanent, active profile/photos/account data are removed, the user is signed out, and returning later with the same Google identity requires full re-registration from the beginning (internal archive details are excluded from the UI).
  - Added active user-owned storage file purge (`profile-photos` and `verifications` buckets) upon deletion.
- **Server-Side Account Deletion & Archival (`public.deleted_accounts`):**
  - Created migration `20260929000003_deleted_accounts_archive.sql` introducing `public.deleted_accounts` table mirroring active `public.profiles` schema with `deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
  - Added atomic `public.delete_user_account()` RPC (`SECURITY DEFINER`) that archives the caller's profile to `deleted_accounts` and safely deletes their `auth.users` row.
  - Deleting `auth.users` cascades to active `profiles`, `profile_photos`, `user_interests`, `matches`, and `connections`, cleanly freeing the Google/email identity for seamless re-registration.
  - Added `purge_expired_deleted_accounts(p_retention_days)` maintenance function for purging records older than 30 days.
  - Enforced strict RLS: direct client reads/writes on `deleted_accounts` are completely revoked.

### Fixed
- **Profile Photo Source Isolation:**
  - Removed erroneous `profile.photoUrl || profile.faceVerificationPhoto` fallback in `ProfileSettingsScreen` and `HomeScreen`.
  - Main DP now resolves strictly from `profile.photoUrl` (uploaded on dedicated Step 04 photo onboarding page and stored in `public.profile_photos` table in public CDN bucket `profile-photos`).
  - Face verification selfies remain strictly private verification evidence in the `verifications` bucket and are NEVER exposed as public DP, match photo, or avatar.
  - Google OAuth metadata (`avatar_url`, `picture`) remains strictly isolated to authentication and never defaults or overrides the user's main photo.
  - If main photo is missing, UI renders standard initials placeholder.

---

## [2.2.0] - 2026-09-29

### Fixed
- **Google OAuth Profile Photo Isolation (Issue 1):**
  - Removed OAuth metadata fallback (`user_metadata.avatar_url`, `user_metadata.picture`) into `profile.photoUrl`.
  - Step 04 Photo onboarding now starts completely empty; users must explicitly upload or capture their own main photo.
- **Resilient University ID Persistence (Issue 2):**
  - Enhanced `resolveUniversityId` with whitespace normalization (`trim().replace(/\s+/g, ' ')`), case-insensitive matching, and resilient static seeded fallback for Parul University (`110b37d5-599c-4921-be80-17645f3b36b8`) and Sumandeep Vidyapeeth (`5886d28b-2338-4ed0-b059-73324098b942`).
  - Ensured `Step02CampusHostel` always carries `collegeName` alongside `hostel` updates.
  - Added step 1 Continue trigger in `OnboardingFlowContainer` to guarantee `collegeName` and `hostel` persistence.
  - In `mapProfileToDb`, added candidate college resolution fallback to `fullProfile.collegeName` when updating hostel, preventing `university_id` from ever being omitted or written as `NULL`.
  - Added structured `[UNIVERSITY_SAVE]` logging and prohibited silent `NULL` writes on failed resolutions.
  - Updated `validateStep(1)` to require valid university resolution before continuing.
- **Direct Navigation for Completed Users & Resumed State for Incomplete Users (Issue 3):**
  - Based user completion strictly on database truth: `onboarding_status === 'completed' AND is_profile_completed === true` via `isRegistrationCompleted()`.
  - In `AuthContext`, awaited `loadUserProfile` before marking auth status as `authenticated`, eliminating client-side race conditions.
  - In `AppShell`, added guards for `loading || profileLoading` with a branded loading spinner to eliminate onboarding screen flash.
  - Completed returning users are now directly routed to Page 12 (`AppRoute.HOME`), bypassing onboarding.
  - Incomplete users resume onboarding at their saved database step (`profile.onboardingStep - 1`).

---

## [2.1.0] - 2026-09-29

### Removed
- **Unused Profile Columns:**
  - Removed `nickname`, `pronouns`, and `is_day_scholar` from `public.profiles`.
  - Recreated `v_matched_profiles` and `v_admin_users` without references to the dropped columns.
  - Aligned column-level `GRANT UPDATE` on `public.profiles` to strictly permitted onboarding fields.
- **Repository Reconciliation:**
  - Added migration `20260929000002_reconcile_profile_columns_and_views.sql` to explicitly match live database state without cascading drops.
  - Restored weight input UX range `0–90 KG` with reference progressive acceleration curves while maintaining database validation bounds (`30–90 KG`).

---

## [2.0.0] - 2026-09-26

### Added
- **Layered Service Architecture (`src/services/`):**
  - Added `authService.ts` for Supabase phone OTP dispatch and verification.
  - Added `profileService.ts` for profile fetching, database mappers, and completion evaluation.
  - Added `onboardingService.ts` for multi-step draft caching and validation rules.
  - Added `storageService.ts` for binary photo uploads to Supabase Storage.
  - Added `eventService.ts` for campus event retrieval and questionnaire submissions.
  - Added `matchmakingService.ts` for partner score queries and wave actions.
- **Supabase Client Layer (`src/lib/supabase/`):**
  - Added `client.ts` with singleton instance and auto-session persistence.
  - Added `env.ts` with smart fallback detection for unconfigured environments.
  - Added `types.ts` defining PostgreSQL table schemas and Row/Insert/Update types.
- **Domain Contexts & Providers (`src/features/`):**
  - Added `AuthContext.tsx` with centralized auth state listener.
  - Added `OnboardingContext.tsx` with active step orchestration and timer cleanup.
  - Added `AppProviders.tsx` composite provider wrapper.
- **Modular Step Pages (`src/pages/`):**
  - Added 9 isolated core onboarding step components under `src/pages/onboarding/steps/`.
  - Added 9 isolated Navratri event step components under `src/pages/events/navratri/steps/`.
  - Added dedicated page wrappers for Landing, Phone Sign-up, Home, Profile, Radar, and Countdown.
- **Declarative Navigation:**
  - Added `useAppNavigation.ts` with route mapping via `AppRoute` constants.
  - Added `DEV_SCREEN_MAP` linking all 24 screens in `DevScreenRail.tsx`.
- **Developer Documentation System (`docs/`):**
  - Added 22 technical documentation files covering architecture, database, design system, API, and QA.

### Changed
- **Decomposed Monolithic Components:**
  - Refactored `App.tsx` from a monolithic state manager into a lightweight root shell delegating to `AppShell.tsx` and `AppProviders.tsx`.
  - Refactored `OnboardingFlow.tsx` from 713 lines of coupled code into an adapter delegating to `OnboardingFlowContainer.tsx`.
- **Decoupled Phone Sign-Up:**
  - Enhanced `PhoneNumberSignUpScreen.tsx` with async `onSendOtp` and `onVerifyOtp` hooks connected to `authService`.
- **Type Centralization:**
  - Re-organized types into `src/types/user.ts`, `src/types/events.ts`, `src/types/navigation.ts`, and `src/types/api.ts`.
- **Environment Template:**
  - Updated `.env.example` with Supabase configuration keys.

### Fixed
- Fixed arbitrary page number math (`stepIndex - 3`, `stepIndex - 4`) by introducing semantic route constants.
- Fixed peer dependency collision between Vite 8, Tailwind CSS v4, and esbuild by documenting `--legacy-peer-deps`.
- Fixed memory leak vulnerability from uncleaned auto-advance setTimeout timers by adding `useEffect` cleanup handlers.

### Removed
- Removed direct coupling between UI step components and database fields.
- Removed hardcoded navigation assumptions in individual screen views.

---

## [1.0.0] - Initial Prototype
- Initial release featuring AI Studio generated UI, Neo-brutalist styling, 20 interactive inputs, Pico.js face detection, and mock data.
