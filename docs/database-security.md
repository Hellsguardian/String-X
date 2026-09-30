# STRING X — Database Security Architecture & Threat Model

> **Version:** 2.0.0  
> **Classification:** STRICT PRIVACY & DATA INTEGRITY SPECIFICATION  
> **Target Engine:** PostgreSQL 15+ (Supabase)  
> **Key Frameworks:** Row Level Security (RLS), Column-Level Security (CLS), Admin Authorization Layer, OWASP ASVS Level 3  

---

## 1. Security Overview

STRING X handles sensitive student identity data, verified phone numbers, collegiate residency records, physical attributes (height, weight), biometric selfie verifications, and romantic/social match telemetry. The platform enforces defense-in-depth across six distinct security tiers:

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           DEFENSE-IN-DEPTH                             │
  │                                                                        │
  │  Tier 1: Network & Origin (TLS 1.3, Vite CSP, CORS)                    │
  │  Tier 2: Identity (Supabase Auth E.164 Phone OTP, zero client lookup)  │
  │  Tier 3: Storage Isolation (Public CDN vs Strictly Private S3 bucket)  │
  │  Tier 4: Relational RLS (All 17 tables enforce Row Level Security)     │
  │  Tier 5: Column-Level Security (CLS: server-controlled columns revoked)│
  │  Tier 6: Secure Projections & RPCs (v_matched_profiles & atomics)      │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Admin Authorization Architecture

STRING X enforces a robust server-controlled admin authorization layer:

### 2.1 Dedicated Authorization Controls
- **No Client Boolean Trust:** The backend NEVER trusts frontend booleans (such as `is_admin = true`) or user-editable profile columns.
- **`admin_users` Registry:** Table `public.admin_users` stores authorized administrator IDs (`super_admin`, `admin`, `moderator`).
- **JWT `app_metadata` Integration:** Supports verified server-assigned claims in `auth.jwt() -> 'app_metadata' ->> 'role'`. Normal users can never mutate `app_metadata`.
- **`public.is_admin()` Security Function:**
  ```sql
  CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS BOOLEAN
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public, auth, pg_temp
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    ) OR (
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    );
  $$;
  ```

---

## 3. Column-Level Privilege Controls (CLS)

To prevent privilege escalation where an authenticated student could modify server-controlled security fields directly:

### 3.1 Server-Controlled Columns (REVOKED from Client Roles)
- `profiles.user_code` (Generated strictly by monotonic database sequence)
- `profiles.is_premium` (Authoritative Phase 1 premium flag)
- `profiles.premium_started_at` & `profiles.premium_expires_at`
- `profiles.verification_status` & `profiles.face_verification_path`
- `profiles.face_verified_at` & `profiles.verification_rejection_reason`
- `profiles.onboarding_status` & `profiles.is_profile_completed`
- `matches.*` (Direct client INSERT, UPDATE, and DELETE completely revoked)
- `connections.*` (Direct client UPDATE revoked)
- `user_reports.status`, `user_reports.moderator_notes`, `user_reports.resolved_at`

### 3.2 Student-Editable Columns (Permitted via Column GRANT)
```sql
GRANT UPDATE (
    full_name,
    gender,
    birth_year,
    university_id,
    hostel_id,
    course_id,
    study_year,
    home_state,
    height_cm,
    weight_kg,
    instagram_id,
    onboarding_step
) ON public.profiles TO authenticated;
```

---

## 4. Privacy Boundaries: Phone Numbers & Weight

### 4.1 Zero Phone Duplication (`auth.users.phone`)
- The verified E.164 phone number remains exclusively in `auth.users.phone`.
- It is never duplicated into `public.profiles`.
- Normal students cannot query `auth.users` and cannot enumerate peer phone numbers.
- Verified administrators query phone numbers exclusively via `public.v_admin_users` (which executes with view-owner privileges while validating `public.is_admin()`).

### 4.2 Weight Privacy (`profiles.weight_kg`)
- Restored `weight_kg` is stored for comprehensive administrative and health records.
- It is strictly omitted from public views and student match projections (`v_matched_profiles`, `v_my_matches`).
- Accessible only by the owning student (`auth.uid() = id`) and by administrators (`v_admin_users`).

---

## 5. Synchronized Pair-Level Reveal Model

The database enforces symmetric match reveals:

$$\text{effective\_reveal} = \text{admin\_reveal} \lor \text{user\_a.is\_premium} \lor \text{user\_b.is\_premium} \lor (\text{event.status} = \text{'reveal\_phase'}) \lor (\text{now}() \ge \text{countdown\_target})$$

- **Synchronized Unlocking:** If User A has `is_premium = true`, both User A and User B receive `is_revealed = true`.
- **Zero Asymmetry:** It is mathematically impossible for User A to see User B while User B cannot see User A.
- **Backend Enforcement:** The condition is hardcoded into `v_my_matches`, `v_matched_profiles`, and `is_match_revealed()`. Frontends cannot bypass this check.

---

## 6. Row Level Security (RLS) Policy Matrix

| Table Name | Policy Name | Scope / Roles | Condition / Expression | Security Objective |
|---|---|---|---|---|
| `admin_users` | Admin read/manage | `authenticated` | `public.is_admin()` | Authoritative admin user registry. |
| `universities` | Public read active | `anon`, `authenticated` | `is_active = true` | Displays active campuses. |
| `hostels` | Public read active | `anon`, `authenticated` | `is_active = true` | Lists hostels for campus picker. |
| `courses` | Public read active | `anon`, `authenticated` | `is_active = true` | Lists academic programs for course selection. |
| `interests` | Public read active | `anon`, `authenticated` | `is_active = true` | Provides interest chips for onboarding. |
| `events` | Public read active | `anon`, `authenticated` | `is_active = true` | Displays active festival cards and countdowns. |
| `profiles` | Own profile access | `authenticated` | `auth.uid() = id` | Strict self-access. Denies campus student enumeration. |
| `profiles` | Admin full access | `authenticated` | `public.is_admin()` | Admin complete user inspection. |
| `profile_photos` | Read own photos | `authenticated` | `auth.uid() = user_id OR public.is_admin()` | Partner views avatar strictly via projection view. |
| `profile_photos` | Manage own photos | `authenticated` | `auth.uid() = user_id` | Restricts upload, update, and deletion to image owner. |
| `user_interests` | Read own interests | `authenticated` | `auth.uid() = user_id OR public.is_admin()` | Shared tags exposed in match highlights. |
| `event_registrations`| Student registration | `authenticated` | `auth.uid() = user_id` | Prevents students from registering other accounts. |
| `event_registrations`| Admin management | `authenticated` | `public.is_admin()` | Allows event check-in and attendee management. |
| `event_preferences` | Owner-only access | `authenticated` | `EXISTS (reg. owner) OR public.is_admin()` | Telemetry, partner preference & excitement choices hidden from peers. |
| `matches` | Participant read | `authenticated` | `auth.uid() IN (user_a_id, user_b_id)` | Normal users can only view their own pairings. |
| `matches` | Admin full management| `authenticated` | `public.is_admin()` | Admin can create, update, reassign, and reveal matches. |
| `connections` | Participant read | `authenticated` | `auth.uid() IN (user_a_id, user_b_id) OR public.is_admin()` | Participants view connection state. |
| `connections` | Deny direct update | `authenticated` | *No UPDATE policy* | Must invoke `accept_string_connection()` RPC. |
| `user_blocks` | Blocker control | `authenticated` | `auth.uid() = blocker_id OR public.is_admin()` | Students manage their own block lists. |
| `user_reports` | Reporter submit | `authenticated` | `auth.uid() = reporter_id` | Submissions restricted to caller's identity. |
| `user_reports` | Admin moderation | `authenticated` | `public.is_admin()` | Admins view and resolve moderation flags. |

---

## 7. Storage Security Architecture

| Bucket | Access Level | MIME Enforcement | Size Limit | Access Boundary |
|---|---|---|---|---|
| `profile-photos` | **Public CDN Read** | `image/jpeg`, `image/png`, `image/webp` | 5 MB | Public read for avatars; uploads/updates/deletions restricted to folder `auth.uid()/*`. |
| `verifications` | **Strictly Private** | `image/jpeg`, `image/png` | 5 MB | **Never exposed via CDN.** Uploads restricted to `auth.uid()/*`. Reads permitted only to owner and administrators (`public.is_admin()`). |
| `event-assets` | **Public CDN Read** | `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml` | 10 MB | Public read; modifications restricted to administrators (`public.is_admin()`). |

---

## 8. Statically Verified Security Invariants

### 8.1 Normal Student Role (`authenticated`)
- [x] **Cannot read all profiles:** RLS isolates profile reads strictly to `auth.uid() = id`.
- [x] **Cannot read all phone numbers:** `auth.users` is inaccessible; `v_admin_users` is blocked by `is_admin()`.
- [x] **Cannot read all weights:** `weight_kg` is excluded from all student-accessible views.
- [x] **Cannot read all premium statuses:** Premium status is not enumerated campus-wide.
- [x] **Cannot read all matches:** Matches are filtered to `auth.uid() IN (user_a_id, user_b_id)`.
- [x] **Cannot modify premium:** Column-level privileges revoke update on `is_premium`.
- [x] **Cannot modify admin_reveal:** Normal users have no UPDATE grant/policy on `matches`.
- [x] **Cannot modify match_source or compatibility_score:** Controlled exclusively by backend/admin.
- [x] **Cannot modify another user's match:** RLS and lack of UPDATE policies prevent tampering.
- [x] **Cannot self-verify:** `verification_status = 'verified'` requires administrative review.
- [x] **Cannot self-mark checked-in:** `event_registrations.status = 'checked_in'` requires administrative authority.
- [x] **Cannot read or tamper with deleted accounts:** Direct SELECT, INSERT, UPDATE, DELETE on `public.deleted_accounts` is completely revoked from normal users.
- [x] **Cannot delete another user's account:** `delete_user_account()` RPC strictly resolves `auth.uid()` from the verified session token.
- [x] **Face verification selfie cannot be used as public DP:** Face verification images reside in the private `verifications` bucket and are strictly excluded from public avatar rendering.
- [x] **Google OAuth avatar cannot override DP:** OAuth metadata (`avatar_url`, `picture`) is isolated to authentication identity and never copied into profile avatars.

### 8.2 Administrator Role (`is_admin() = true`)
- [x] **Can access complete user data:** Full records via `v_admin_users`.
- [x] **Can access phone numbers:** Direct projection from `auth.users.phone`.
- [x] **Can access weight:** Full visibility in `v_admin_users` and `profiles`.
- [x] **Can access verification selfies:** Storage policy allows admin read on `verifications` bucket.
- [x] **Can view premium status:** Authoritative tracking in `v_admin_users`.
- [x] **Can assign manual matches:** Using `admin_assign_match()` with human-readable user codes.
- [x] **Can reassign matches:** Using `admin_reassign_match()` with automatic `'replaced'` transition.
- [x] **Can manually reveal matches:** Using `admin_set_match_reveal()`.
- [x] **Can manage premium status:** Using `admin_set_user_premium()`.
- [x] **Can review deleted accounts archive:** Administrative SELECT policy allows review of `deleted_accounts`.
- [x] **Can purge retention archive:** Using `purge_expired_deleted_accounts(p_retention_days)`.
