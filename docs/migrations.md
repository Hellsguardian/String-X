# STRING X — Database Migrations Guide

> **Version:** 2.0.0  
> **Target Engine:** PostgreSQL 15+ (Supabase)  
> **Location:** `supabase/migrations/`  
> **Status:** APPROVED ARCHITECTURAL SPECIFICATION (PHASE 1 ADMIN MATCHING & PREMIUM REVEAL)  

---

## 1. Migration Sequence & File Manifest

The migrations are ordered sequentially, establishing dependencies cleanly from core catalogs through administrative security layers and seed data:

| Sequence | Migration File | Purpose & Contents | Safe to Re-run? |
|---|---|---|---|
| **01** | [`20260927000001_core_schema.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20260927000001_core_schema.sql) | Core entities: `universities`, `hostels`, `courses`, `interests`, `profiles` (PK = `auth.users.id`, monotonic sequence generator for `user_code` [SX001, SX002, ...], restored `weight_kg`, authoritative `is_premium`, `premium_started_at`, `premium_expires_at`), `profile_photos`, `user_interests`, composite constraints, and performance indexes. | DDL (Initial deployment) |
| **02** | [`20260927000002_events.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20260927000002_events.sql) | Campus event system: `events`, explicit `event_registrations`, private `event_preferences`, and `event_vibe_tags`. | DDL (Initial deployment) |
| **03** | [`20260927000003_matchmaking.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20260927000003_matchmaking.sql) | Matchmaking engine: `match_preferences`, `matches` (canonical pair ordering `user_a_id < user_b_id`, `match_source` ['manual', 'ai'], `admin_reveal`, `status` ['active', 'replaced', 'cancelled', 'completed', 'expired'], `created_by`), `check_single_active_match_per_event` trigger, `connections`, `user_blocks`, and `user_reports`. | DDL (Initial deployment) |
| **04** | [`20260927000004_security.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20260927000004_security.sql) | Complete security architecture: `admin_users` table, `is_admin()` helper function, RLS policies for all 17 tables, column privileges (CLS), `is_match_revealed()` helper, projection views (`v_matched_profiles`, `v_my_matches`, `v_admin_users`), administrative RPCs (`admin_assign_match`, `admin_reassign_match`, `admin_set_match_reveal`, `admin_set_user_premium`, `admin_verify_user`), student RPCs, and `handle_new_user` auth trigger. | Declarative / Idempotent |
| **05** | [`20260927000005_storage.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20260927000005_storage.sql) | Storage buckets: `profile-photos` (public CDN), `verifications` (strictly private with admin review policy), `event-assets` (public CDN with admin management), and `storage.objects` RLS policies. | Idempotent (`ON CONFLICT DO UPDATE`) |
| **06** | [`20260927000006_seed_data.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20260927000006_seed_data.sql) | Deterministic seed data: Parul University, Sumandeep Vidyapeeth, Parul Hostels (Girls & Boys), UG/PG Courses, Interest Chips, and Navratri 2026 event. | **Fully Idempotent** (`ON CONFLICT DO NOTHING / UPDATE`) |
| **07** | [`20260929000001_cleanup_unused_profile_columns.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20260929000001_cleanup_unused_profile_columns.sql) | Column cleanup: Safely drops unused profile columns (`nickname`, `pronouns`, `is_day_scholar`) and updates column-level privileges. | Idempotent |
| **08** | [`20260929000002_reconcile_profile_columns_and_views.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20260929000002_reconcile_profile_columns_and_views.sql) | Repository & Live DB reconciliation: Explicitly recreates `v_matched_profiles` and `v_admin_users` without CASCADE to maintain clean schema sync across environments. | Idempotent |
| **09** | [`20260929000003_deleted_accounts_archive.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20260929000003_deleted_accounts_archive.sql) | Account deletion archive: Creates `public.deleted_accounts` archive table with 30-day retention (`deleted_at`), atomic `delete_user_account()` RPC, and `purge_expired_deleted_accounts()` function. | Idempotent |
| **10** | [`20260930000001_cleanup_event_registration_schema.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20260930000001_cleanup_event_registration_schema.sql) | Event registration cleanup: Safely drops obsolete tables (`event_vibe_tags`, `match_preferences`), inlines `partner_gender_preference` into `event_preferences`, adds `most_excited_1/2/3`, and drops obsolete telemetry columns (`is_submitted`, `submitted_at`, `updated_at`). | Idempotent |
| **11** | [`20261001000001_event_registration_match_sync.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261001000001_event_registration_match_sync.sql) | Automated single-value match assignment: Adds `matched_with` to `public.event_registrations`, partial unique index `idx_uq_event_registrations_matched_with`, bidirectional sync trigger `trg_sync_event_registration_match`, canonical `matches` and `connections` auto-sync, and updates `v_admin_users`. | Idempotent |
| **12** | [`20261002000001_auth_email_allowlist.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261002000001_auth_email_allowlist.sql) | Authentication allowlist & profile identity: Creates `public.allowed_auth_emails` table with RLS, adds `public.is_email_allowed()` and `public.extract_enrollment_no()`, adds `email` (NOT NULL UNIQUE) and `enrollment_no` (UNIQUE) to `public.profiles`, backfills profile emails from `auth.users`, updates `handle_new_user()`, and attaches `trg_enforce_profile_email_identity` and `on_auth_user_email_updated` triggers. | Idempotent |
| **13** | [`20261003000001_platform_statistics.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261003000001_platform_statistics.sql) | Real-time platform statistics: Creates singleton `public.platform_statistics` table (`id = 'global'`), initializes count from `public.profiles`, configures public read-only RLS, attaches `sync_platform_profile_count()` trigger on `public.profiles`, and registers table in `supabase_realtime` publication. | Idempotent |
| **14** | [`20261004000001_unified_verification_system.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261004000001_unified_verification_system.sql) | Unified verification subsystem: Creates `public.verification` table with multi-attempt index (`user_id, created_at DESC, id DESC`), grandfathering migration of legacy profile verifications, drops `face_verified_at` and `verification_rejection_reason` from `profiles`, recreates `v_admin_users` projecting latest verification telemetry, defines `submit_face_verification` with geolocation telemetry, adds `submit_dp_verification(UUID)`, updates `complete_student_onboarding`, and updates `admin_verify_user`. | Transactional / Idempotent |
| **15** | [`20261005000001_verification_state_enum_and_sync.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261005000001_verification_state_enum_and_sync.sql) | Verification state enum conversion: Creates `public.verification_state` ENUM (`pending`, `verified`, `rejected`), converts `verification_status`, `dp`, and `face` columns from `TEXT` to `verification_state`, establishes initial `trg_sync_verification_states` trigger, and updates verification RPCs with enum casts. | Transactional |
| **16** | [`20261005000002_verification_bidirectional_sync.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261005000002_verification_bidirectional_sync.sql) | Bidirectional verification synchronization & profile propagation: Drops restrictive `chk_verification_status_invariants` constraint, normalizes existing verification rows, redefines `sync_verification_states()` BEFORE trigger for intuitive Table Editor moderation, adds `sync_verification_to_profiles()` AFTER trigger updating `profiles.verification_status` from the latest attempt, and executes one-time profile reconciliation. | Transactional |

---

## 2. Migration Execution Instructions

### Important Notice
> **DO NOT EXECUTE MIGRATIONS REMOTELY UNTIL EXPLICITLY DIRECTED.**  
> The migration files in this repository have been finalized and verified locally.

### Execution When Ready to Deploy:

#### Option A: Using the Supabase CLI (Recommended)
1. Ensure the Supabase CLI is authenticated:
   ```bash
   npx supabase login
   npx supabase link --project-ref nutavlypeasbadcaqobw
   ```
2. Review pending migrations:
   ```bash
   npx supabase migration list
   ```
3. Push migrations to remote database:
   ```bash
   npx supabase db push
   ```

#### Option B: Using the Supabase SQL Editor
Execute the SQL files **strictly in numerical sequence from 01 through 16**:
1. `20260927000001_core_schema.sql`
2. `20260927000002_events.sql`
3. `20260927000003_matchmaking.sql`
4. `20260927000004_security.sql`
5. `20260927000005_storage.sql`
6. `20260927000006_seed_data.sql`
7. `20260929000001_cleanup_unused_profile_columns.sql`
8. `20260929000002_reconcile_profile_columns_and_views.sql`
9. `20260929000003_deleted_accounts_archive.sql`
10. `20260930000001_cleanup_event_registration_schema.sql`
11. `20261001000001_event_registration_match_sync.sql`
12. `20261002000001_auth_email_allowlist.sql`
13. `20261003000001_platform_statistics.sql`
14. `20261004000001_unified_verification_system.sql`
15. `20261005000001_verification_state_enum_and_sync.sql`
16. `20261005000002_verification_bidirectional_sync.sql`

---

## 3. Post-Deployment Verification Checklist

After applying migrations, verify each core capability:
1. **User Code Auto-Generation:** Create a test profile and verify `user_code` matches `SX001` format.
2. **CLS Enforcement:** Attempt to run `UPDATE public.profiles SET is_premium = true` from an authenticated client; verify PostgreSQL returns permission denied.
3. **Admin Assignment:** As an administrator, set `matched_with` on an event registration; verify automatic creation of canonical match (`user_a_id < user_b_id`) and connection.
4. **Synchronized Reveal:** Toggle premium on one participant via `admin_set_user_premium()`; verify `v_my_matches` and `v_matched_profiles` show revealed state for **both** partners simultaneously.
5. **Single Active Match Trigger:** Attempt to insert a second active match for the same student in the same event; verify the transaction is rejected with integrity exception.
6. **Master Directory Visibility:** Query `v_admin_users` as an admin; verify phone number, weight, premium, unified verification telemetry, and match status are visible. Verify non-admins receive zero rows.
7. **Email Allowlist Enforcement:** Attempt to authenticate with a non-university email not present in `allowed_auth_emails`; verify rejection by `handle_new_user()`.
8. **Platform Statistics Realtime:** Insert a new profile; verify `platform_statistics.total_profiles` increments atomically and broadcasts via Supabase Realtime.
9. **Verification State Bidirectional Sync:** Update `dp` or `face` in `public.verification`; verify `verification_status` updates automatically via `trg_sync_verification_states`, and `profiles.verification_status` updates via `trg_sync_verification_to_profiles`.
