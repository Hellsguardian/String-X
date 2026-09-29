# STRING X — Architecture Changelog

All notable changes and architectural refactorings for STRING X are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
