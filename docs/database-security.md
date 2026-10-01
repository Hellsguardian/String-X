# STRING X — Database Security Architecture & Threat Model

> **Version:** 2.1.0  
> **Classification:** STRICT PRIVACY & DATA INTEGRITY SPECIFICATION  
> **Target Engine:** PostgreSQL 15+ (Supabase)  
> **Key Frameworks:** Row Level Security (RLS), Column-Level Security (CLS), Admin Authorization Layer, OWASP ASVS Level 3  

---

## 1. Security Overview

STRING X handles sensitive student identity data, verified emails and enrollment IDs, collegiate residency records, physical attributes (height, weight), biometric selfie verifications, geolocation telemetry, and romantic/social match telemetry. The platform enforces defense-in-depth across six distinct security tiers:

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           DEFENSE-IN-DEPTH                             │
  │                                                                        │
  │  Tier 1: Network & Origin (TLS 1.3, Vite CSP, CORS)                    │
  │  Tier 2: Identity (Google OAuth @paruluniversity.ac.in, Allowlist)     │
  │  Tier 3: Storage Isolation (Public CDN vs Strictly Private S3 bucket)  │
  │  Tier 4: Relational RLS (All 18 tables enforce Row Level Security)     │
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
- `profiles.email` & `profiles.enrollment_no` (Enforced immutable via `trg_enforce_profile_email_identity`)
- `profiles.user_code` (Generated strictly by monotonic database sequence)
- `profiles.is_premium` (Authoritative Phase 1 premium flag)
- `profiles.premium_started_at` & `profiles.premium_expires_at`
- `profiles.verification_status` (Propagated via trigger from `public.verification`)
- `profiles.face_verification_path` (Transitional compatibility stub)
- `profiles.onboarding_status` & `profiles.is_profile_completed`
- `verification.*` (Direct client mutations revoked; managed via atomic RPCs and admin functions)
- `allowed_auth_emails.*` (Direct client access revoked; admin-only RLS)
- `platform_statistics.*` (Direct mutations revoked; modified by profile triggers)
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

## 4. Privacy Boundaries: Identity, Weight & Telemetry

### 4.1 Zero Phone Duplication (`auth.users.phone`)
- The verified phone number resides in `auth.users.phone`.
- It is never duplicated into `public.profiles`.
- Normal students cannot query `auth.users` and cannot enumerate peer phone numbers.
- Verified administrators query phone numbers exclusively via `public.v_admin_users` (which executes with view-owner privileges while validating `public.is_admin()`).

### 4.2 Weight Privacy (`profiles.weight_kg`)
- Restored `weight_kg` is stored for comprehensive administrative and health records.
- It is strictly omitted from public views and student match projections (`v_matched_profiles`, `v_my_matches`).
- Accessible only by the owning student (`auth.uid() = id`) and by administrators (`v_admin_users`).

### 4.3 Email Identity & Domain Allowlist Protection
- `profiles.email` and `profiles.enrollment_no` are populated directly from `auth.users` on signup.
- Trigger `trg_enforce_profile_email_identity` prevents client update attempts from spoofing or altering institutional email addresses.
- `public.allowed_auth_emails` is accessible strictly to administrators via `public.is_admin()`.

### 4.4 Geolocation Telemetry Privacy (`public.verification`)
- Geolocation coordinates (`latitude`, `longitude`, `accuracy_m`) are captured exclusively during live selfie submission as a secondary fraud signal.
- Telemetry resides strictly in `public.verification` with owner-only and admin-only RLS.
- Coordinates are NEVER exposed to peers in `v_matched_profiles` or `v_my_matches`.

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
| `allowed_auth_emails` | Admin manage allowlist | `authenticated` | `public.is_admin() = true` | Restricts developer bypass management to administrators. |
| `platform_statistics` | Public read count | `anon`, `authenticated` | `true` | Exposes aggregate profile counter with zero PII. |
| `universities` | Public read active | `anon`, `authenticated` | `is_active = true` | Displays active campuses. |
| `hostels` | Public read active | `anon`, `authenticated` | `is_active = true` | Lists hostels for campus picker. |
| `courses` | Public read active | `anon`, `authenticated` | `is_active = true` | Lists academic programs for course selection. |
| `interests` | Public read active | `anon`, `authenticated` | `is_active = true` | Provides interest chips for onboarding. |
| `events` | Public read active | `anon`, `authenticated` | `is_active = true` | Displays active festival cards and countdowns. |
| `profiles` | Own profile access | `authenticated` | `auth.uid() = id` | Strict self-access. Denies campus student enumeration. |
| `profiles` | Admin full access | `authenticated` | `public.is_admin()` | Admin complete user inspection. |
| `verification` | View own verification | `authenticated` | `auth.uid() = user_id` | Students inspect their own verification attempt history. |
| `verification` | Admin view all | `authenticated` | `public.is_admin()` | Admins view all verification attempts. |
| `verification` | Admin manage all | `authenticated` | `public.is_admin()` | Admins manage verification attempts directly. |
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
- [x] **Cannot modify email or enrollment number:** Enforced by trigger `trg_enforce_profile_email_identity`.
- [x] **Cannot modify premium:** Column-level privileges revoke update on `is_premium`.
- [x] **Cannot modify admin_reveal:** Normal users have no UPDATE grant/policy on `matches`.
- [x] **Cannot modify match_source or compatibility_score:** Controlled exclusively by backend/admin.
- [x] **Cannot modify another user's match:** RLS and lack of UPDATE policies prevent tampering.
- [x] **Cannot self-verify:** Verification state changes require administrative moderation via `admin_verify_user()`.
- [x] **Cannot read other students' verification attempts:** RLS on `public.verification` isolates rows to `auth.uid() = user_id`.
- [x] **Cannot modify allowlisted emails:** `public.allowed_auth_emails` permits access strictly to administrators.
- [x] **Cannot tamper with platform statistics:** Direct mutations on `public.platform_statistics` are revoked.
- [x] **Cannot self-mark checked-in:** `event_registrations.status = 'checked_in'` requires administrative authority.
- [x] **Cannot read or tamper with deleted accounts:** Direct SELECT, INSERT, UPDATE, DELETE on `public.deleted_accounts` is completely revoked from normal users.
- [x] **Cannot delete another user's account:** `delete_user_account()` RPC strictly resolves `auth.uid()` from the verified session token.
- [x] **Face verification selfie cannot be used as public DP:** Face verification images reside in the private `verifications` bucket and are strictly excluded from public avatar rendering.
- [x] **Google OAuth avatar cannot override DP:** OAuth metadata (`avatar_url`, `picture`) is isolated to authentication identity and never copied into profile avatars.

### 8.2 Administrator Role (`is_admin() = true`)
- [x] **Can access complete user data:** Full records via `v_admin_users`.
- [x] **Can access phone numbers:** Direct projection from `auth.users.phone`.
- [x] **Can access weight:** Full visibility in `v_admin_users` and `profiles`.
- [x] **Can access verification telemetry & selfies:** Storage policy allows admin read on `verifications` bucket; `v_admin_users` projects location and timestamps.
- [x] **Can moderate verification:** Using `admin_verify_user()` with independent DP/Face review and rejection reason.
- [x] **Can manage email allowlist:** Full CRUD on `public.allowed_auth_emails`.
- [x] **Can view premium status:** Authoritative tracking in `v_admin_users`.
- [x] **Can assign manual matches:** Using `event_registrations.matched_with` single-value assignment or `admin_assign_match()`.
- [x] **Can reassign matches:** With automatic `'replaced'` transition.
- [x] **Can manually reveal matches:** Using `admin_set_match_reveal()`.
- [x] **Can manage premium status:** Using `admin_set_user_premium()`.
- [x] **Can review deleted accounts archive:** Administrative SELECT policy allows review of `deleted_accounts`.
- [x] **Can purge retention archive:** Using `purge_expired_deleted_accounts(p_retention_days)`.

