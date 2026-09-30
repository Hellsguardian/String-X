# STRING X — Database Architecture Specification

> **Version:** 3.0.0  
> **Status:** APPROVED ARCHITECTURAL SPECIFICATION (PHASE 1 ADMIN MATCHING & PREMIUM REVEAL)  
> **Target Database:** PostgreSQL 15+ (Supabase)  
> **Target Storage:** Supabase Storage (S3-compatible)  
> **Authentication Engine:** Supabase Auth (`auth.users`)  
> **Client Framework:** React + TypeScript (Vite) via `@supabase/supabase-js`

---

## 1. Database Overview & Phase 1 Scope

The STRING X database architecture provides a secure, relational, highly scalable persistence layer designed for collegiate event-driven matchmaking. It supports approximately 100–200 users in Phase 1 with complete administrative operational workflows, while maintaining strict architectural compatibility for automated Phase 2/3 AI matchmaking engines.

### Product & Operational Framework

- **Phase 1 Manual Matchmaking:** Matches are initially curated and assigned manually by the STRING X administration team. The admin needs complete visibility over student profiles, verified phone numbers, weight, residency, premium status, assigned match pairings, and reveal states.
- **Admin Assignment Workflow:** Admins can pair students directly using intuitive human-readable identifiers (`user_code`: `SX001`, `SX002`, ...) while the database maintains normalized, canonically ordered `matches` records.
- **Synchronized Premium Reveal:** When either participant in a match becomes premium (`user_a.is_premium OR user_b.is_premium`) or when the admin triggers a manual override (`admin_reveal = true`), the pair is **synchronously revealed to BOTH participants**. The reveal state is a pair-level property, eliminating asymmetric information exposure.
- **Future AI Engine Compatibility:** The normalized schema seamlessly supports both manual matching (`match_source = 'manual'`) and future machine learning clustering (`match_source = 'ai'`) without requiring database redesign.

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           SUPABASE ENGINE                              │
  │                                                                        │
  │  ┌───────────────────────┐         ┌────────────────────────────────┐  │
  │  │   auth.users          │         │       Supabase Storage         │  │
  │  │  (Identity & Phone)   │         │  - profile-photos (Public CDN) │  │
  │  └──────────┬────────────┘         │  - verifications  (Private)    │  │
  │             │                      │  - event-assets   (Public CDN) │  │
  │             ▼ 1:1 (PK = FK)        └────────────────┬───────────────┘  │
  │  ┌───────────────────────┐                          │ Storage Path     │
  │  │   public.profiles     │◄─────────────────────────┘ References       │
  │  │ (id = auth.users.id)  │                                             │
  │  │ (user_code = SX001)   │                                             │
  │  │ (weight_kg, is_premium│                                             │
  │  └──────┬─────┬──────────┘                                             │
  │         │     │                                                        │
  │         │     └──────────────┐                                         │
  │         ▼                    ▼                                         │
  │  ┌──────────────┐     ┌──────────────┐         ┌────────────────────┐  │
  │  │ Lookup &     │     │ Campus Events│         │ admin_users        │  │
  │  │ Academic Hub │     │ & Vibe Engine│         │ (Server Role Auth) │  │
  │  └──────────────┘     └──────┬───────┘         └─────────┬──────────┘  │
  │                              │                           │             │
  │                              ▼                           │             │
  │                       ┌──────────────┐                   │             │
  │                       │ matches      │◄──────────────────┤             │
  │                       │(Canonical A<B│                   │             │
  │                       │manual / ai)  │                   │             │
  │                       └──────┬───────┘                   │             │
  │                              │                           │             │
  │         ┌────────────────────┴────────────────────┐      │             │
  │         ▼                                         ▼      ▼             │
  │  ┌──────────────┐                          ┌──────────────┐            │
  │  │ Secure Views │                          │ Admin View   │            │
  │  │v_my_matches  │                          │v_admin_users │            │
  │  │v_matched_prof│                          │(Master List) │            │
  │  └──────────────┘                          └──────────────┘            │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Pillars

### 2.1 Human-Readable User ID (`user_code`)
- **Format:** `SX001`, `SX002`, `SX010`, `SX099`, `SX100`, `SX200`, ..., expanding monotonically.
- **Generation:** Non-blocking PostgreSQL sequence `public.user_code_seq` combined with `public.generate_user_code()`. Guaranteed safe against concurrent user signups.
- **Identity Integrity:** `profiles.id UUID` remains the internal primary key and foreign key to `auth.users(id)`. The `user_code` is strictly an administrative and communication identifier.
- **Immutability:** Normal students have no column-level grant to modify `user_code`.

### 2.2 Complete User Profile & Restored Weight (`weight_kg`)
- **Restoration:** Restored `weight_kg NUMERIC(5,2)` to `public.profiles` with validation constraint `CHECK (weight_kg IS NULL OR (weight_kg >= 30.00 AND weight_kg <= 250.00))`.
- **Privacy Enforcement:** `weight_kg` is completely omitted from student projection views (`v_matched_profiles`, `v_my_matches`). It is accessible strictly by the profile owner and by verified admins via `v_admin_users`.

### 2.3 Authoritative Premium Architecture
- **Attributes:**
  - `is_premium BOOLEAN NOT NULL DEFAULT false` (authoritative active status for Phase 1).
  - `premium_started_at TIMESTAMPTZ NULL`.
  - `premium_expires_at TIMESTAMPTZ NULL` (retained for future automated subscription lifecycle support).
- **Security Boundary:** Normal authenticated students cannot modify any premium columns. Privileges are revoked, and transitions are managed exclusively via service role or `admin_set_user_premium()` RPC.

### 2.4 Dedicated Server-Controlled Admin Authorization Model
- **No Frontend Booleans:** The platform never trusts frontend flags such as `is_admin: true` or user-editable profile attributes.
- **Authoritative Registry:** Managed through `public.admin_users` table with row-level security, combined with JWT `app_metadata` claims (`role = 'admin' | 'super_admin'`).
- **Encapsulated Check:** `public.is_admin()` helper function is `SECURITY DEFINER` and `STABLE`, utilized across RLS policies, projection views, and administrative RPCs.

### 2.5 Normalized Match Architecture (No Denormalized Match Columns)
- **Zero Denormalization:** The database strictly avoids adding `profiles.matches` or array columns. All pairing relationships reside in `public.matches`.
- **Canonical Ordering:** Enforced via `CHECK (user_a_id < user_b_id)` and `UNIQUE (event_id, user_a_id, user_b_id)`. Eliminates reciprocal duplicates (`user_a -> user_b` and `user_b -> user_a`).
- **Single Active Match Guarantee:** Enforced by database trigger `trg_check_single_active_match` across both `user_a_id` and `user_b_id` positions for any given event.
- **Auditability:** Tracks `match_source` (`'manual'` vs `'ai'`), `created_by UUID REFERENCES auth.users(id)`, `matched_at`, `revealed_at`, `created_at`, and `updated_at`.

### 2.6 Synchronized Pair-Level Reveal Model
- **Core Principle:** The reveal state is a property of the **match pair**, not an asymmetric individual toggle.
- **Evaluation Rule:**
  $$\text{effective\_reveal} = \text{admin\_reveal} \lor \text{user\_a.is\_premium} \lor \text{user\_b.is\_premium} \lor (\text{event.status} = \text{'reveal\_phase'}) \lor (\text{now}() \ge \text{event.countdown\_target})$$
- **Synchronized Access:** If User A is premium and User B is not, the match is revealed to **both** User A and User B. Asymmetric visibility is mathematically impossible.
- **Admin Override:** Administrators can activate `admin_reveal = true` to immediately unlock the match for both participants.

### 2.7 Removed / Deprecated Columns (Zero Schema Overhead)
The following columns are **not** part of the String X onboarding/profile schema and have been dropped from `public.profiles` and all dependent views (`v_matched_profiles`, `v_admin_users`):
- `nickname`: Dropped.
- `pronouns`: Dropped.
- `is_day_scholar`: Dropped.

Client-writable profile fields are strictly:
`full_name`, `gender`, `birth_year`, `university_id`, `hostel_id`, `course_id`, `study_year`, `home_state`, `height_cm`, `weight_kg`, `instagram_id`, and `onboarding_step`.

### 2.8 Onboarding Resolution & Registration Gate Invariants
1. **Google OAuth Avatar Isolation:** Google OAuth profile pictures (`avatar_url`, `picture`) are strictly isolated to authentication and never automatically copied into `profile.photoUrl`. Step 04 Photo onboarding starts empty until the user explicitly uploads or captures their own main photo.
2. **University Foreign Key Resolution:** `university_id` must resolve against `public.universities` (`110b37d5-599c-4921-be80-17645f3b36b8` for Parul University, `5886d28b-2338-4ed0-b059-73324098b942` for Sumandeep Vidyapeeth) with whitespace normalization and case-insensitive comparison. Failed resolutions log structured errors, block step progression, and never overwrite existing values with `NULL`. Incremental updates (e.g. hostel selection) preserve the resolved `university_id`.
3. **Database as Single Source of Truth for Completion:** A user is completely registered if and only if `onboarding_status = 'completed'` AND `is_profile_completed = true`. Returning completed users bypass onboarding and are routed directly to Page 12 (`AppRoute.HOME`). Incomplete users resume at their recorded step without duplicate profile row creation.

### 2.9 Event Registration & Preferences Architecture (Phase 1 Database Cleanup)
The event registration system was streamlined in Phase 1 (`20260930000001_cleanup_event_registration_schema.sql`):
1. **Consolidated Questionnaire Telemetry (`event_preferences`):**
   - **`partner_gender_preference`:** Moved directly into `event_preferences` (`TEXT NOT NULL DEFAULT 'Open to Anyone'`, with check constraint `CHECK (partner_gender_preference IN ('Girls', 'Guys', 'Open to Anyone'))`).
   - **`most_excited_1`, `most_excited_2`, `most_excited_3`:** Three nullable `TEXT` columns added directly to `event_preferences` representing the student's top three selected vibes for the festival (e.g. `'💃 Garba'`, `'📸 Outfits, Photos & Reels'`, `'🍜 Food & Late-Night Plans'`).
   - **Retained `created_at`:** Records when the preference telemetry was captured.
   - **Removed Telemetry Fields:** `is_submitted`, `submitted_at`, and `updated_at` were dropped from `event_preferences` to avoid redundancy with `event_registrations.registered_at`.
2. **Retired Tables:**
   - **`public.event_vibe_tags`:** Dropped. Festival excitement selections are stored directly in `most_excited_1`, `most_excited_2`, and `most_excited_3`.
   - **`public.match_preferences`:** Dropped. Matching partner gender preference is stored directly in `event_preferences.partner_gender_preference`.
3. **Preserved Junction Architecture:**
   - `public.interests` and `public.user_interests` remain the authoritative many-to-many relationship for student interests and are completely unchanged. They are never inlined into `event_preferences`.

### 2.10 Automated Single-Value Match Assignment (Phase 2 Matching Implementation)
The event-scoped manual matching workflow was automated in Phase 2 (`20261001000001_event_registration_match_sync.sql`):
1. **Single-Value Assignment Column (`event_registrations.matched_with`):**
   - References `public.profiles(user_code)` (`ON DELETE SET NULL`), enabling administrators to assign matches via user codes (e.g. `SX001 -> matched_with = SX005`).
   - Guarded by partial unique index `idx_uq_event_registrations_matched_with` on `(event_id, matched_with) WHERE matched_with IS NOT NULL`, preventing multiple active claims on the same partner within a festival.
2. **Automated Synchronization Trigger (`trg_sync_event_registration_match`):**
   - Orchestrated by `public.sync_event_registration_match()` (`SECURITY DEFINER`, search_path secured, recursion controlled via `pg_trigger_depth() > 1`).
   - Automatically synchronizes reciprocal registrations: setting `SX001.matched_with = SX005` immediately updates `SX005.matched_with = SX001`.
   - Pipeline flow:
     ```
     event_registrations.matched_with
             ↓
     synchronization trigger (trg_sync_event_registration_match)
             ↓
     matches (canonical pair LEAST / GREATEST, status='active', manual)
             ↓
     connections (status='pending', user_a_revealed=false, user_b_revealed=false)
     ```
3. **Reassignment, Clearing & Collision Handling:**
   - Clearing (`matched_with = NULL`) resets the partner's registration, marks the old match `'cancelled'`, and marks connection `'unmatched'`.
   - Reassignment (e.g. `SX001` from `SX005` to `SX007`) retires previous pairings to `'replaced'` and clears previous partner links before establishing the new active pairing.
   - Enforces `trg_check_single_active_match` and rejects self-matching, non-existent users, or un-enrolled students with PostgreSQL exceptions.
4. **Admin Projections & Client Routing:**
   - `public.v_admin_users` exposes `registered_matched_with`.
   - Frontend "Find My Match" CTA intelligently checks questionnaire completion first (routes to Step 9 if incomplete), then verifies canonical active match in the database (routes to Page 23 Countdown if active, or Page 22 Waiting Radar if searching).

---

## 3. Server-Controlled vs User-Editable Fields

```
┌────────────────────────────────────────────────────────────────────────┐
│                   FIELD PRIVILEGE & MUTATION MATRIX                    │
├───────────────────────┬───────────────────┬────────────────────────────┤
│ TABLE / COLUMN        │ MUTATION ACTOR    │ ENFORCEMENT MECHANISM      │
├───────────────────────┼───────────────────┼────────────────────────────┤
│ profiles:             │ Authenticated     │ Column-level GRANT UPDATE: │
│ full_name, gender,    │ User              │ full_name, gender,         │
│ birth_year, university│ (Own Profile)     │ birth_year, university_id, │
│ hostel_id, course_id, │                   │ hostel_id, course_id,      │
│ study_year,home_state,│                   │ study_year, home_state,    │
│ height_cm, weight_kg, │                   │ height_cm, weight_kg,      │
│ instagram_id,         │                   │ instagram_id,              │
│ onboarding_step       │                   │ onboarding_step.           │
├───────────────────────┼───────────────────┼────────────────────────────┤
│ profiles:             │ Admin /           │ REVOKE UPDATE from client; │
│ user_code             │ Sequence Default  │ Populated via sequence     │
│                       │                   │ public.generate_user_code()│
├───────────────────────┼───────────────────┼────────────────────────────┤
│ profiles:             │ Admin /           │ REVOKE UPDATE from client; │
│ is_premium,           │ Service Role /    │ Managed via dedicated RPC  │
│ premium_started_at,   │ Admin RPC         │ admin_set_user_premium()   │
│ premium_expires_at    │                   │ or direct admin access.    │
├───────────────────────┼───────────────────┼────────────────────────────┤
│ profiles:             │ Restricted RPC /  │ REVOKE UPDATE from client; │
│ verification_status,  │ Admin Review      │ Mutated via submit_face_   │
│ face_verification_path│                   │ verification() or admin RPC│
│ face_verified_at,     │                   │ admin_verify_user().       │
│ rejection_reason      │                   │                            │
├───────────────────────┼───────────────────┼────────────────────────────┤
│ profiles:             │ Restricted RPC    │ REVOKE UPDATE from client; │
│ onboarding_status,    │                   │ Atomic validation via      │
│ is_profile_completed  │                   │ complete_student_onboarding│
├───────────────────────┼───────────────────┼────────────────────────────┤
│ matches:              │ Admin /           │ REVOKE INSERT, UPDATE,     │
│ all columns           │ Service Role /    │ DELETE from normal users.  │
│                       │ Admin RPC         │ Managed via admin RPCs.    │
├───────────────────────┼───────────────────┼────────────────────────────┤
│ connections:          │ Atomic RPC /      │ REVOKE direct client UPDATE│
│ reveal & status       │ Service Role      │ accept_string_connection() │
├───────────────────────┼───────────────────┼────────────────────────────┤
│ user_reports:         │ Moderator /       │ REVOKE UPDATE, DELETE;     │
│ status, notes, resolved│ Admin Role       │ Normal users INSERT only.  │
└───────────────────────┴───────────────────┴────────────────────────────┘
```

---

## 4. Stored Procedures & Administrative RPCs

### 4.1 Admin Matching RPCs
- **`admin_assign_match(p_event_id, p_user_1_code, p_user_2_code, p_score, p_reasons, p_highlights)`**:
  - Resolves users by `user_code` (e.g. `SX001` and `SX002`) or UUID.
  - Sorts IDs canonically (`user_a_id < user_b_id`).
  - Sets `match_source = 'manual'`, `status = 'active'`, `created_by = auth.uid()`.
  - Enforces single active match integrity.
- **`admin_reassign_match(p_event_id, p_old_match_id, p_new_partner_code, ...)`**:
  - Atomically transitions old match to `status = 'replaced'`.
  - Inserts new match with new partner as `status = 'active'`.
  - Preserves historical records without data loss.
- **`admin_set_match_reveal(p_match_id, p_reveal)`**:
  - Toggles `admin_reveal = p_reveal` and updates `revealed_at`.
- **`admin_set_user_premium(p_user_code_or_id, p_is_premium, p_expires_at)`**:
  - Updates `is_premium`, `premium_started_at`, and `premium_expires_at`.
- **`admin_verify_user(p_user_code_or_id, p_verified, p_rejection_reason)`**:
  - Moderates face selfie verification.

### 4.2 Student Atomic RPCs
- **`submit_face_verification(p_storage_path)`**: Transitions status strictly to `'pending'`.
- **`complete_student_onboarding()`**: Validates required attributes and marks `is_profile_completed = true`.
- **`accept_string_connection(p_connection_id)`**: Serialized mutual reveal with row-level locking (`FOR UPDATE`).
- **`cancel_event_registration(p_event_id)`**: Allows self-cancellation; denies self check-in.

### 4.3 Account Deletion & Archival RPCs
- **`delete_user_account()`**:
  - Secure `SECURITY DEFINER` function executing atomically within PostgreSQL.
  - Step 1: Identifies caller via `auth.uid()`. Rejects unauthenticated callers.
  - Step 2: Reads complete active `public.profiles` row.
  - Step 3: Inserts identical profile snapshot into `public.deleted_accounts` with `deleted_at = now()`.
  - Step 4: Verifies archival insert succeeded.
  - Step 5: Deletes active user row from `auth.users`, automatically cascading to `public.profiles`, `public.profile_photos`, `user_interests`, `matches`, and `connections`.
  - Safe re-registration: Because `auth.users` row is deleted, the user can immediately re-authenticate with the same Google/email account and start fresh without "user already exists" collisions.
- **`purge_expired_deleted_accounts(p_retention_days INTEGER DEFAULT 30)`**:
  - Purges archived rows in `public.deleted_accounts` where `deleted_at < now() - INTERVAL '30 days'`.
  - Reserved strictly for administrators and scheduled pg_cron maintenance jobs.

### 4.4 Profile Photo vs. Face Verification Photo Separation
- **Main Profile Photo (Public DP):**
  - Uploaded on dedicated onboarding Step 04 (`Step04Photo`).
  - Stored in the public CDN bucket `profile-photos` under `${userId}/avatar_${timestamp}.${ext}`.
  - Recorded in `public.profile_photos` table (`is_primary = true`, `bucket_id = 'profile-photos'`).
  - Single source of truth for all public avatars, `ProfileSettingsScreen`, and `HomeScreen`.
  - If missing, displays the default initials placeholder (`firstName.charAt(0)`).
- **Face Verification Photo (Private Evidence):**
  - Captured on onboarding Step 09 (`Step09FaceVerification`).
  - Stored in the strictly private `verifications` bucket under `${userId}/face_verification_${timestamp}.${ext}`.
  - Path stored in `public.profiles.face_verification_path` and verified via `submit_face_verification` RPC.
  - **CRITICAL SECURITY GUARANTEE:** Face verification selfies are private identity evidence. They are **NEVER** used as profile avatars, main DPs, card photos, match imagery, or fallback images.
- **Google OAuth Avatar Isolation:**
  - Google OAuth metadata (`avatar_url`, `picture`) is strictly isolated to identity authentication.
  - It is **NEVER** automatically copied or defaulted into the user's String X DP. Photo onboarding begins empty.

---

## 5. Projection Views & Access Boundaries

| View Name | Scope / Target | Access Privilege | Security Objective |
|---|---|---|---|
| `v_matched_profiles` | Match partner profile | `authenticated` (Participants only) | Exposes partner name, photo, course, hostel strictly when the match is revealed. Omits phone, weight, and private telemetry. |
| `v_my_matches` | Active match card | `authenticated` (Participants only) | Exposes user's own match card, partner `user_code`, compatibility score, highlights, and synchronized `is_revealed` status. |
| `v_admin_users` | Master directory | `authenticated` (Admins only) | Exposes complete student dataset including phone (from `auth.users`), weight, verification selfies, premium status, assigned match, and reveal status. |

---

## 6. Migration Readiness Checklist

- [x] **Human-Readable User ID**: Monotonic sequence and function generate non-colliding `user_code` (`SX001`, `SX002`, ...).
- [x] **Profiles PK Model**: `profiles.id = auth.users.id` retained; zero phone duplication.
- [x] **Restored Weight**: `weight_kg NUMERIC(5,2)` added with range validation constraint (30 to 250 kg).
- [x] **Authoritative Premium**: `is_premium` controls active state; `premium_expires_at` retained for future subscription lifecycle.
- [x] **Admin Authorization Model**: Server-controlled `admin_users` table and `public.is_admin()` function.
- [x] **Complete Admin Data Access**: `v_admin_users` securely bridges `auth.users.phone` and complete profile telemetry for administrators.
- [x] **Normalized Matches**: Canonical ordering (`user_a_id < user_b_id`); no denormalized array columns in `profiles`.
- [x] **Phase 1 Manual Matching**: `match_source = 'manual'` and `admin_assign_match()` workflow.
- [x] **Future AI Matching**: Fully compatible via `match_source = 'ai'`, `compatibility_score`, `compatibility_reasons`, and `shared_highlights`.
- [x] **Synchronized Reveal**: Pair-level reveal evaluated uniformly across both participants.
- [x] **Admin Reveal Override**: Admin can manually toggle `admin_reveal = true` on any match.
- [x] **Safe Match Reassignment**: Historical matches transitioned to `'replaced'`; database trigger enforces single active match per event.
- [x] **Event-Specific Matching**: Matches keyed to `event_id`, supporting independent multi-year festivals.
- [x] **Client Protection**: Direct mutations on `matches`, `connections`, `admin_users`, and server-controlled profile fields denied to normal users.
