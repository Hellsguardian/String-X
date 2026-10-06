# StringX — PU Email Restriction Status & Recovery Guide

> **Document Version:** 1.0.0  
> **Effective Date:** October 2026  
> **Classification:** Internal Engineering Security Policy & Operational Guide  
> **Status:** ACTIVE TEMPORARY PAUSE  

---

## 1. Purpose

StringX was originally engineered with an institutional access boundary restricting authentication exclusively to:
1. **Official Parul University (PU) student accounts:** Google accounts bearing numeric student enrollment IDs matching `^[0-9]+@paruluniversity\.ac\.in$`.
2. **Approved developer and tester accounts:** Explicitly listed in the database allowlist table `public.allowed_auth_emails`.

This institutional restriction is currently **TEMPORARILY PAUSED**.

> [!IMPORTANT]
> **CURRENT STATUS: PU EMAIL DOMAIN RESTRICTION IS TEMPORARILY DISABLED.**  
> This state is intentional and must **not** be "fixed", reverted, or refactored automatically by future developers or automated agents unless the product owner explicitly decides to re-enable PU-only access.

While the institutional domain restriction is paused, **generic email-format validation remains active** at both the database and frontend layers. Arbitrary domains (e.g., `@gmail.com`, `@outlook.com`) can register, but malformed, empty, or non-email inputs remain strictly rejected.

---

## 2. Current Authentication Policy

The platform currently operates under the following operational policy:

| Policy Item | Operational State | Behavior / Enforcement |
| :--- | :--- | :--- |
| **PU Domain Restriction** | **OFF** | Non-PU domains are permitted to register and authenticate. |
| **Generic Email Format Validation** | **ON** | Rejects empty strings, whitespace, NULL, and syntactically invalid strings. |
| **Non-PU Emails** | **ALLOWED** | Authenticated if they satisfy the standard email pattern. |
| **PU Student Emails** | **ALLOWED** | Continue to pass validation seamlessly. |
| **Empty / Whitespace / NULL Email** | **REJECTED** | Database trigger aborts transaction; client rejects immediately. |
| **Malformed Strings** | **REJECTED** | Strings failing email regex are denied. |

### Validation Pattern

Both the database function and frontend service utilize the following standard validation pattern:

```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

> [!NOTE]
> This pattern is a practical, production-safe email-format validation regex designed to verify standard user-supplied email structures (`local-part@domain.tld`). It should **not** be described as an exhaustive RFC 5322 implementation. Complete RFC 5322 compliance and mailbox existence are guaranteed upstream by Google OAuth (`email_verified: true`).

---

## 3. Why The Restriction Was Paused

**Business reason: temporary product/testing requirement. The repository does not contain a more specific business justification.**

The restriction was intentionally paused to allow non-PU user accounts to authenticate, complete onboarding, and test or utilize platform features without requiring manual pre-population of individual email addresses into `public.allowed_auth_emails`.

---

## 4. Original Security Architecture

Prior to the pause, the StringX authentication architecture enforced institutional access through a strict, transaction-bound pipeline:

```
                          Student clicks "Continue with Google"
                                            ↓
                               Google OAuth Consent Flow
                                            ↓
                        Redirect to Supabase Auth Callback URL
                                            ↓
                        GoTrue inserts into auth.users (BEGIN TX)
                                            ↓
                    Postgres Trigger: on_auth_user_created (AFTER INSERT)
                                            ↓
                          Trigger Function: public.handle_new_user()
                                            ↓
                       Evaluation: public.is_email_allowed(NEW.email)
                       ├── ALLOWED  → Extracts enrollment_no + Seeds public.profiles row
                       └── REJECTED → RAISE EXCEPTION (ROLLBACK auth.users insert)
                                            ↓
                        Client Session Hydration (AuthContext.tsx)
                                            ↓
                    authService.isEmailPermitted(user.email) [Client Gatekeeper]
                       ├── ALLOWED  → Hydrates User Profile & routes to Onboarding/Home
                       └── REJECTED → Calls authService.signOut() & displays Modal Notice
```

### Key Trigger Mechanics
- **Trigger:** `on_auth_user_created` is an `AFTER INSERT` trigger defined on `auth.users` in [20260927000004_security.sql](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20260927000004_security.sql).
- **Function:** It executes `public.handle_new_user()`, updated in [20261002000001_auth_email_allowlist.sql](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261002000001_auth_email_allowlist.sql).

### `public.handle_new_user()` Responsibilities
1. Reads `NEW.email`.
2. Normalizes the address: `v_email := lower(trim(COALESCE(NEW.email, '')))`.
3. Calls `public.is_email_allowed(v_email)`.
4. If unauthorized, raises an exception:
   `'Access denied: StringX requires an official Parul University student Google account or an approved developer account.'`  
   Because PostgreSQL triggers execute within the calling transaction, this unhandled exception triggers an immediate transaction rollback, preventing the user row from persisting in `auth.users`.
5. If authorized, calls `public.extract_enrollment_no(v_email)` to extract numeric university student IDs.
6. Seeds the initial `public.profiles` row with `(id, email, enrollment_no, onboarding_status, onboarding_step)` set to `(NEW.id, v_email, v_enrollment, 'in_progress', 1)`.
7. **User Code:** Does not explicitly provide `user_code`; the `profiles.user_code` column default automatically invokes `public.generate_user_code()`, drawing a non-colliding human-readable identifier (`SX001`, `SX002`, ...) from `public.user_code_seq`.

---

## 5. Original `is_email_allowed()` Policy

The canonical original implementation in [20261002000001_auth_email_allowlist.sql](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261002000001_auth_email_allowlist.sql#L58-L89) allowed only:

1. **Official Parul University student enrollment emails:**
   ```regex
   ^[0-9]+@paruluniversity\.ac\.in$
   ```
2. **Explicit allowlist records:** Active entries in `public.allowed_auth_emails`:
   ```sql
   EXISTS (SELECT 1 FROM public.allowed_auth_emails WHERE email = v_clean_email)
   ```

All other email addresses caused `is_email_allowed()` to return `false`.

> [!WARNING]
> **CRITICAL SECURITY CONCEPT:**  
> `public.is_email_allowed()` was and remains the **authoritative database-level authorization gate**. Frontend validation was implemented purely for responsive UI feedback. Bypassing or removing frontend checks alone was never sufficient to grant access, because the PostgreSQL trigger on `auth.users` always aborts the insertion transaction if this function returns `false`.

---

## 6. Current Temporary Implementation

### Database Function: `public.is_email_allowed(p_email TEXT)`

The active function in the database has been replaced with:

```sql
CREATE OR REPLACE FUNCTION public.is_email_allowed(p_email TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_email TEXT;
BEGIN
    IF p_email IS NULL OR trim(p_email) = '' THEN
        RETURN false;
    END IF;

    v_clean_email := lower(trim(p_email));

    -- TEMPORARY PAUSE:
    -- Accept any standard email format regardless of domain.
    IF v_clean_email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;
```

### Preserved Security Properties
- **Language:** `plpgsql`
- **Security Context:** `SECURITY DEFINER` (executes with creator privileges to guarantee uniform authorization checks)
- **Search Path:** `SET search_path = public, pg_temp` (hardened against search_path hijacking)
- **Signature:** `public.is_email_allowed(p_email text) -> boolean` (identical signature)
- **Ownership:** `postgres`
- **Privileges:**
  - `REVOKE ALL ON FUNCTION public.is_email_allowed(TEXT) FROM PUBLIC;`
  - `REVOKE ALL ON FUNCTION public.is_email_allowed(TEXT) FROM anon;`
  - `GRANT EXECUTE ON FUNCTION public.is_email_allowed(TEXT) TO authenticated;`

All security isolation properties have been strictly preserved.

---

## 7. Frontend Change

### Target File & Method
- **File:** [src/services/authService.ts](file:///d:/coder_cave/projects/string%20X/src/services/authService.ts)
- **Method:** `isEmailPermitted(email: string | null | undefined): Promise<boolean>`

### Change Details
The method was updated from checking the PU student regex and invoking the Supabase RPC to performing a direct generic format check:

```typescript
  async isEmailPermitted(email: string | null | undefined): Promise<boolean> {
    if (!email || !email.trim()) return false;

    const clean = email.toLowerCase().trim();

    // TEMPORARY PAUSE:
    // Permit any standard email format regardless of domain.
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(clean)) {
      return true;
    }

    return false;
  },
```

### Rationale
In [AuthContext.tsx](file:///d:/coder_cave/projects/string%20X/src/features/auth/context/AuthContext.tsx#L152-L167), both initial session hydration (`initAuth`) and OAuth redirect state changes (`onAuthStateChange`) evaluate `authService.isEmailPermitted(user.email)`. If that check returns `false`, `AuthContext` calls `authService.signOut()`, purges the user state, and forces the application back to an unauthenticated error modal.

Updating `isEmailPermitted()` ensures that valid non-PU sessions are not prematurely evicted by the frontend gatekeeper, while eliminating unnecessary RPC roundtrips and avoiding offline/latency timeouts.

> **CRITICAL:** ONLY `isEmailPermitted()` was modified in `authService.ts`. All other methods, OAuth redirects, and configuration parameters are unchanged.

---

## 8. What Was NOT Changed

To ensure absolute system stability, the temporary pause was scoped with surgical precision. The following systems were **NOT modified**:

- [x] **Auth Triggers:** `on_auth_user_created` and `on_auth_user_email_updated` remain active on `auth.users`.
- [x] **User Initialization:** `public.handle_new_user()` was untouched; it still initializes profiles automatically.
- [x] **Profile Creation:** `public.profiles` stub creation on signup operates normally.
- [x] **Profiles Schema:** No tables, columns, or constraints were altered.
- [x] **Allowlist Table:** `public.allowed_auth_emails` and its RLS policies were not modified or cleared.
- [x] **Row Level Security (RLS):** All RLS policies across all tables remain 100% active.
- [x] **Matchmaking:** Matching algorithms, compatibility scores, and pairing RPCs remain untouched.
- [x] **Connections & Messaging:** Direct communication and reciprocal connection logic remain untouched.
- [x] **Verification:** Selfie capture, GPS location telemetry, and `verification_status` logic remain untouched.
- [x] **Admin Access:** `admin_users` table and `public.is_admin()` access checks remain untouched.
- [x] **User Code Generation:** Monotonic `user_code_seq` (`SX001`, `SX002`, ...) continues functioning identically.
- [x] **Google OAuth Configuration:** Redirect URIs, scopes, and client settings remain untouched.
- [x] **`AuthContext.tsx`:** Startup deadlock safeguards, deduplication, and lifecycle listeners remain untouched.
- [x] **Onboarding Pages:** Steps 01 through 09 and transitional screens remain untouched.

---

## 9. Email Update Behavior

The system includes a synchronization trigger for email modifications:
- **Trigger Function:** `public.handle_auth_user_email_sync()` in [20261002000001_auth_email_allowlist.sql](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261002000001_auth_email_allowlist.sql#L260-L290).
- **Trigger:** `on_auth_user_email_updated` (`AFTER UPDATE OF email ON auth.users`).

Whenever a user's email in `auth.users` changes, this trigger executes:
```sql
IF NEW.email IS DISTINCT FROM OLD.email THEN
    v_email := lower(trim(COALESCE(NEW.email, '')));
    IF v_email = '' OR NOT public.is_email_allowed(v_email) THEN
        RAISE EXCEPTION 'Access denied: StringX requires an official Parul University student Google account or an approved developer account.';
    END IF;
    ...
```

**Impact during the pause:**
Because `public.is_email_allowed()` evaluates generic email formats, any valid non-PU email will pass synchronization without error. Once the PU-only restriction is restored, updating an email to a non-PU domain will again be blocked.

---

## 10. Existing Users

- **Existing Parul University Users:** Zero impact. Existing PU student accounts (`[0-9]+@paruluniversity.ac.in`) continue to validate successfully.
- **Existing Allowlisted Developer Accounts:** Zero impact. Accounts in `public.allowed_auth_emails` continue to validate successfully.
- **Existing Profile Records:** No profiles were modified, backfilled, or deleted.
- **Non-PU Profiles Created During the Pause:**
  When a non-PU user authenticates, `public.extract_enrollment_no(v_email)` evaluates regex `^([0-9]+)@`. Because generic emails (e.g. `john@gmail.com`) do not match, the function returns `NULL`.
  In `public.profiles`, `enrollment_no` is **nullable** and protected by a partial unique index:
  ```sql
  CREATE UNIQUE INDEX idx_uq_profiles_enrollment_no ON public.profiles (enrollment_no) WHERE enrollment_no IS NOT NULL;
  ```
  Consequently, multiple accounts with `enrollment_no = NULL` are completely valid and supported by the database schema.

---

## 11. CRITICAL FUTURE CONSIDERATION — NON-PU USERS

> [!CAUTION]
> ### ATTENTION BEFORE RESTORING THE PU-ONLY RESTRICTION:
> While the restriction is paused, users with non-PU email addresses (e.g., `@gmail.com`, `@yahoo.com`) will register and create profiles in `public.profiles`.
>
> If a developer simply restores the original `is_email_allowed()` function without planning for these accounts:
> 1. Those non-PU users will **fail future authentication checks**.
> 2. On their next visit, `AuthContext.tsx` will reject their email and immediately sign them out.
> 3. Any updates to their email in `auth.users` will be blocked by `handle_auth_user_email_sync()`.
>
> **BEFORE RESTORING THE RESTRICTION, THE ENGINEERING TEAM MUST:**
> - Query `public.profiles WHERE enrollment_no IS NULL` to audit all non-PU accounts created during the pause.
> - Consult product/stakeholders to determine which non-PU accounts should **retain access** and which should be **deauthorized**.
> - Add the email addresses of all accounts permitted to retain access into `public.allowed_auth_emails`:
>   ```sql
>   INSERT INTO public.allowed_auth_emails (email)
>   VALUES ('approved.external.user@gmail.com')
>   ON CONFLICT (email) DO NOTHING;
>   ```
> - **DO NOT automatically batch-insert all non-PU emails into `public.allowed_auth_emails` without explicit product authorization.**

---

## 12. How To Re-enable PU Email Restriction

Follow this strict step-by-step procedure when the product owner authorizes the restoration of PU-only access:

### Step 1: Audit Non-PU Accounts
Run a read-only query in Supabase SQL Editor:
```sql
SELECT id, user_code, email, full_name, created_at 
FROM public.profiles 
WHERE enrollment_no IS NULL 
ORDER BY created_at DESC;
```

### Step 2: Obtain Authorization for Retained Accounts
Review the list with the product owner and compile the explicit list of external email addresses approved to retain platform access.

### Step 3: Populate Retained Accounts into the Allowlist
Insert approved external emails into `public.allowed_auth_emails`:
```sql
INSERT INTO public.allowed_auth_emails (email)
VALUES 
    ('approved.tester@gmail.com')
ON CONFLICT (email) DO NOTHING;
```

### Step 4: Restore Original Database Function
Restore the canonical function definition directly from [20261002000001_auth_email_allowlist.sql](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261002000001_auth_email_allowlist.sql#L58-L100):

```sql
CREATE OR REPLACE FUNCTION public.is_email_allowed(p_email TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_email TEXT;
BEGIN
    IF p_email IS NULL OR trim(p_email) = '' THEN
        RETURN false;
    END IF;

    v_clean_email := lower(trim(p_email));

    -- 1. Matches official Parul University student enrollment email pattern
    IF v_clean_email ~ '^[0-9]+@paruluniversity\.ac\.in$' THEN
        RETURN true;
    END IF;

    -- 2. Matches active allowlist entry in allowed_auth_emails
    IF EXISTS (
        SELECT 1
        FROM public.allowed_auth_emails
        WHERE email = v_clean_email
    ) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

COMMENT ON FUNCTION public.is_email_allowed(TEXT) IS 'Evaluates whether an email is permitted to authenticate: either an official Parul University student email (numeric enrollment ID) or listed in public.allowed_auth_emails';

REVOKE ALL ON FUNCTION public.is_email_allowed(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_email_allowed(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_email_allowed(TEXT) TO authenticated;
```

### Step 5: Restore Original Frontend Service Method
In [src/services/authService.ts](file:///d:/coder_cave/projects/string%20X/src/services/authService.ts), restore `isEmailPermitted()`:

```typescript
  async isEmailPermitted(email: string | null | undefined): Promise<boolean> {
    if (!email || !email.trim()) return false;
    const clean = email.toLowerCase().trim();

    // 1. Fast client-side check for official Parul University student format
    if (/^[0-9]+@paruluniversity\.ac\.in$/i.test(clean)) {
      return true;
    }

    // 2. Authoritative check for developer/tester allowlist via secure RPC
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase.rpc as any)('is_email_allowed', {
          p_email: clean,
        });
        if (!error && typeof data === 'boolean') {
          return data;
        }
      } catch (err) {
        console.warn('[authService] is_email_allowed RPC check notice:', err);
      }
    }

    return false;
  },
```

### Step 6: Verify Database Triggers
Confirm triggers are active and attached:
```sql
SELECT trigger_name, event_manipulation, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE trigger_name IN ('on_auth_user_created', 'on_auth_user_email_updated');
```

### Step 7: Build & Typecheck
Run local checks:
```bash
npm run lint
npm run build
```

### Step 8: Multi-Account Verification Testing
Test the restored system with 4 distinct account types:
1. **PU Student Email:** Must sign in and authenticate successfully.
2. **Approved Allowlisted Account:** Must authenticate successfully via `public.allowed_auth_emails`.
3. **Unauthorized External Email:** Must be rejected at Google Sign-In with "Parul University Account Required" notice.
4. **Active Session Test:** Existing valid PU session restores without error.

---

## 13. Re-enable Verification Checklist

Before considering the restoration complete, check off every item:

- [ ] Original `is_email_allowed()` definition restored from `20261002000001_auth_email_allowlist.sql`.
- [ ] Original frontend `authService.isEmailPermitted()` restored.
- [ ] `PUBLIC` execute privilege on `is_email_allowed()` revoked.
- [ ] `anon` execute privilege on `is_email_allowed()` revoked.
- [ ] `authenticated` execute privilege on `is_email_allowed()` granted.
- [ ] `SECURITY DEFINER` preserved on `is_email_allowed()`.
- [ ] `search_path = public, pg_temp` preserved on `is_email_allowed()`.
- [ ] Trigger `on_auth_user_created` verified on `auth.users`.
- [ ] Trigger `on_auth_user_email_updated` verified on `auth.users`.
- [ ] `public.handle_new_user()` verified intact.
- [ ] `public.handle_auth_user_email_sync()` verified intact.
- [ ] `public.profiles` schema verified intact.
- [ ] RLS policies on all 18 tables verified enabled and intact.
- [ ] Google OAuth redirect configuration verified intact.
- [ ] Non-PU account audit completed; approved accounts inserted into `allowed_auth_emails`.
- [ ] Parul University student login tested: **PASS**.
- [ ] Approved allowlist login tested: **PASS**.
- [ ] Unauthorized non-PU login rejection verified: **PASS**.
- [ ] `npm run lint` (`tsc --noEmit`): **PASS**.
- [ ] `npm run build`: **PASS**.

---

## 14. Rollback / Emergency Recovery

If re-enabling the restriction causes unexpected platform disruptions (e.g. valid student sign-ins failing or unexpected OAuth deadlocks):

1. **Halt further changes:** Do not attempt ad-hoc edits to database triggers or RLS policies.
2. **Preserve database state:** Never drop or truncate `auth.users`, `public.profiles`, or `public.allowed_auth_emails`.
3. **Inspect the canonical migration:** Open [supabase/migrations/20261002000001_auth_email_allowlist.sql](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261002000001_auth_email_allowlist.sql).
4. **Compare database definition:** Query `SELECT pg_get_functiondef('public.is_email_allowed(text)'::regprocedure);` to identify unintended syntax changes.
5. **Inspect git diff:** Run `git diff src/services/authService.ts` to ensure only `isEmailPermitted()` was modified.
6. **Re-apply the temporary pause if necessary:** If production access is blocked for real users during event operations, re-apply the temporary definition from Section 6 while diagnosing the issue in a staging environment.
7. **Strict Rule:** Never disable RLS, drop triggers, or alter the `profiles` table schema as a troubleshooting workaround.

---

## 15. Source of Truth

Future developers should reference these canonical source files:

| Artifact | File Path | Role |
| :--- | :--- | :--- |
| **Original Policy Migration** | [supabase/migrations/20261002000001_auth_email_allowlist.sql](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261002000001_auth_email_allowlist.sql) | **Canonical database source of truth** for original `is_email_allowed()`, `extract_enrollment_no()`, and triggers. |
| **Security Architecture Migration** | [supabase/migrations/20260927000004_security.sql](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20260927000004_security.sql) | Source of truth for `on_auth_user_created` trigger and base RLS architecture. |
| **Frontend Auth Service** | [src/services/authService.ts](file:///d:/coder_cave/projects/string%20X/src/services/authService.ts) | Client-side email eligibility validation method `isEmailPermitted()`. |
| **Auth Context Gatekeeper** | [src/features/auth/context/AuthContext.tsx](file:///d:/coder_cave/projects/string%20X/src/features/auth/context/AuthContext.tsx) | Session lifecycle, initialization listener, and error eviction logic. |
| **Operational Documentation** | [docs/STRINGX_PU_EMAIL_RESTRICTION.md](file:///d:/coder_cave/projects/string%20X/docs/STRINGX_PU_EMAIL_RESTRICTION.md) | This document; operational guidelines for managing the temporary pause. |

---

## 16. Change History

### Temporary Pause — October 2026

- **Status:** ACTIVE / PAUSED
- **Change:** PU-domain restriction temporarily disabled.
- **Database Modification:** `public.is_email_allowed(TEXT)` updated to validate generic standard email syntax (`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`) without domain restriction.
- **Frontend Modification:** `src/services/authService.ts` -> `isEmailPermitted()` updated to validate generic standard email syntax without domain restriction.
- **Unchanged:** Triggers, profile creation, table schemas, RLS policies, OAuth configuration, matchmaking, messaging, verification, and admin functionality.
- **Verification Results:**
  - Non-PU email evaluation (`test.student@gmail.com`): **PASS** (`true`)
  - PU student email evaluation (`2403051050712@paruluniversity.ac.in`): **PASS** (`true`)
  - Invalid email string (`invalid-email`): **PASS** (`false`)
  - Empty string (`''`): **PASS** (`false`)
  - Null value (`NULL`): **PASS** (`false`)
  - TypeScript typecheck (`tsc --noEmit`): **PASS** (0 errors)
  - Vite production bundle build (`vite build`): **PASS** (0 errors)
- **Rollback Source:** [20261002000001_auth_email_allowlist.sql](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261002000001_auth_email_allowlist.sql).

---

## 17. Developer Rules

1. **Do not automatically re-enable the PU restriction:** Do not treat the temporary state as a bug or technical debt to be resolved without explicit product authorization.
2. **Do not delete or bypass auth triggers:** Never drop `on_auth_user_created` or `on_auth_user_email_updated`.
3. **Do not disable RLS to solve authentication issues:** Row Level Security is orthogonal to email domain validation.
4. **Do not modify profiles, matches, or messaging to resolve email issues:** The email policy is fully isolated to `is_email_allowed()` and `authService.ts`.
5. **Do not replace database enforcement with frontend-only validation:** The database trigger is the only authoritative gate preventing unauthorized identity persistence.
6. **Account for non-PU users created during the pause:** Before restoring the restriction, review `profiles WHERE enrollment_no IS NULL` and populate approved accounts into `allowed_auth_emails`.
7. **Prefer the canonical migration for restoration:** Always restore `is_email_allowed()` from `20261002000001_auth_email_allowlist.sql` rather than writing SQL from memory.
8. **Isolate policy changes:** Never bundle email restriction policy changes with unrelated UI or backend feature PRs.
9. **Run the full verification checklist:** Always execute Section 13 before and after any policy transition.
10. **Keep this document updated:** Update this document immediately whenever the restriction status changes.
