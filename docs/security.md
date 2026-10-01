# STRING X — Security & Data Protection Architecture

> **Version:** 3.0.0  
> **Classification:** STRICT PRIVACY & DATA INTEGRITY SPECIFICATION  
> **Target Engine:** PostgreSQL 15+ (Supabase)  
> **Key Frameworks:** Row Level Security (RLS), Column-Level Security (CLS), Admin Authorization Layer, OWASP ASVS Level 3  

---

## 1. Security Principles

1. **Zero Trust Client:** The frontend runs in an untrusted browser environment. Client-side validation exists solely for user experience; security is strictly enforced at the PostgreSQL and Storage layer.
2. **Never Expose Service-Role Keys:** Only the anonymous public key (`VITE_SUPABASE_ANON_KEY`) is bundled into the client build. The Supabase `service_role` key must **NEVER** be committed to git, imported in frontend code, or bundled in Vite.
3. **Strict Row Level Security (RLS):** Every PostgreSQL table has RLS enabled by default. Without an explicit policy matching `auth.uid()` or `public.is_admin()`, access is completely denied.
4. **Column-Level Security (CLS):** Normal authenticated students have column-level update grants strictly for safe profile fields. Server-controlled fields (`is_premium`, `user_code`, `email`, `enrollment_no`, `verification_status`) are revoked from direct client mutation.

---

## 2. Row Level Security (RLS) Policy Matrix

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
| `verification` | Admin manage all | `authenticated` | `public.is_admin()` | Admins view and manage verification attempts directly. |
| `profile_photos` | Read own photos | `authenticated` | `auth.uid() = user_id OR public.is_admin()` | Partner views avatar strictly via projection view. |
| `profile_photos` | Manage own photos | `authenticated` | `auth.uid() = user_id` | Restricts upload, update, and deletion to image owner. |
| `user_interests` | Read own interests | `authenticated` | `auth.uid() = user_id OR public.is_admin()` | Shared tags exposed in match highlights. |
| `event_registrations`| Student registration | `authenticated` | `auth.uid() = user_id` | Prevents students from registering other accounts. |
| `event_registrations`| Admin management | `authenticated` | `public.is_admin()` | Allows event check-in and attendee management. |
| `event_preferences` | Owner-only access | `authenticated` | `EXISTS (reg. owner) OR public.is_admin()` | Telemetry, partner preference & excitement choices hidden from peers. |
| `matches` | Participant read | `authenticated` | `auth.uid() IN (user_a_id, user_b_id)` | Normal users can only view their own pairings. |
| `matches` | Admin full management| `authenticated` | `public.is_admin()` | Admin can create, update, reassign, and reveal matches. |
| `connections` | Participant read | `authenticated` | `auth.uid() IN (user_a_id, user_b_id) OR public.is_admin()` | Participants view connection state. |
| `user_blocks` | Blocker control | `authenticated` | `auth.uid() = blocker_id OR public.is_admin()` | Students manage their own block lists. |
| `user_reports` | Reporter submit | `authenticated` | `auth.uid() = reporter_id` | Submissions restricted to caller's identity. |

---

## 3. Data Privacy & Classification

| Field / Asset | Classification | Visibility Policy |
|---|---|---|
| `auth.users.email` / `profiles.email` | **Identity Protected** | Populated strictly from Google OAuth token. Immutable via triggers. |
| `auth.users.phone` | **Confidential / Private** | Kept in `auth.users`; never duplicated into `profiles`. Visible only to owner & admins via `v_admin_users`. |
| `public.verification.face_verification_path` | **Private Biometric Evidence** | Stored in private `verifications` bucket. NEVER exposed as avatar, card, or public asset. |
| `public.verification` coordinates | **Security Telemetry** | Geolocation (`latitude`, `longitude`, `accuracy_m`) is a secondary security signal; never exposed to peers. |
| `profiles.weight_kg` | **Private Health Data** | Excluded from student match projections (`v_matched_profiles`, `v_my_matches`). Visible to owner & admins only. |
| `profiles.instagram_id` | **Milestone Protected** | Held in escrow until the match is revealed. |

---

## 4. Input Sanitization & Anti-Abuse Measures

1. **Email Allowlist Enforcement:** `public.is_email_allowed()` enforces official `@paruluniversity.ac.in` domain or presence in `public.allowed_auth_emails`.
2. **Instagram Handle Sanitization:** Stripped of leading `@` symbols and validated against handle regex `/^[a-zA-Z0-9._]+$/`.
3. **Face Verification Stability Gate:** Local Pico cascade geometry tracking enforces 1.25s continuous stability before shutter capture.
4. **Account Deletion Archival:** `public.delete_user_account()` RPC safely archives profile to `public.deleted_accounts` for 30-day compliance before cascading deletion across `auth.users`.
