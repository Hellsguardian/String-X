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
Execute the SQL files **strictly in numerical order**:
1. Run `20260927000001_core_schema.sql`
2. Run `20260927000002_events.sql`
3. Run `20260927000003_matchmaking.sql`
4. Run `20260927000004_security.sql`
5. Run `20260927000005_storage.sql`
6. Run `20260927000006_seed_data.sql`

---

## 3. Post-Deployment Verification Checklist

After applying migrations, verify each core capability:
1. **User Code Auto-Generation:** Create a test profile and verify `user_code` matches `SX001` format.
2. **CLS Enforcement:** Attempt to run `UPDATE public.profiles SET is_premium = true` from an authenticated client; verify PostgreSQL returns permission denied.
3. **Admin Assignment:** As an administrator, call `admin_assign_match()` to pair two users; verify single canonical match record with `user_a_id < user_b_id`.
4. **Synchronized Reveal:** Toggle premium on one participant via `admin_set_user_premium()`; verify `v_my_matches` and `v_matched_profiles` show revealed state for **both** partners simultaneously.
5. **Single Active Match Trigger:** Attempt to insert a second active match for the same student in the same event; verify the transaction is rejected with integrity exception.
6. **Master Directory Visibility:** Query `v_admin_users` as an admin; verify phone number, weight, premium, and match status are visible. Verify non-admins receive zero rows.
