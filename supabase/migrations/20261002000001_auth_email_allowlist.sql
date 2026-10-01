-- =============================================================================
-- Migration: 20261002000001_auth_email_allowlist.sql
-- Description: Authentication Allowlist & Profile Identity Schema Migration
--   1. Creates public.allowed_auth_emails allowlist table with RLS
--   2. Adds reusable email validation and enrollment number extraction functions
--   3. Adds email (NOT NULL, UNIQUE) and enrollment_no (NULLABLE, UNIQUE) to public.profiles
--   4. Backfills existing profile records from auth.users
--   5. Updates handle_new_user() and adds email sync triggers
--   6. Implements identity protection trigger that preserves service_role/admin operations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATE DEVELOPER / TESTER EMAIL ALLOWLIST TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allowed_auth_emails (
    email TEXT PRIMARY KEY,
    CONSTRAINT chk_allowed_auth_emails_format CHECK (email = lower(trim(email)))
);

COMMENT ON TABLE public.allowed_auth_emails IS 'Allowlist of non-university emails permitted for developer and tester authentication';
COMMENT ON COLUMN public.allowed_auth_emails.email IS 'Normalized, lowercase email address permitted for authentication bypass';

-- Enable Row Level Security
ALTER TABLE public.allowed_auth_emails ENABLE ROW LEVEL SECURITY;

-- Revoke default public/anon/authenticated access
REVOKE ALL ON public.allowed_auth_emails FROM PUBLIC;
REVOKE ALL ON public.allowed_auth_emails FROM anon;
REVOKE ALL ON public.allowed_auth_emails FROM authenticated;

-- Allow administrators to view and manage allowlist records via is_admin()
DROP POLICY IF EXISTS p_allowed_auth_emails_admin_all ON public.allowed_auth_emails;
CREATE POLICY p_allowed_auth_emails_admin_all
ON public.allowed_auth_emails
FOR ALL
TO authenticated
USING (public.is_admin() = true)
WITH CHECK (public.is_admin() = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.allowed_auth_emails TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. REUSABLE EMAIL VALIDATION & ENROLLMENT EXTRACTION FUNCTIONS
-- -----------------------------------------------------------------------------

-- Extract numeric enrollment number from university email prefix
CREATE OR REPLACE FUNCTION public.extract_enrollment_no(p_email TEXT)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT substring(lower(trim(p_email)) from '^([0-9]+)@');
$$;

COMMENT ON FUNCTION public.extract_enrollment_no(TEXT) IS 'Extracts numeric university enrollment number from email prefix if present; returns NULL otherwise';

-- Reusable validator: returns true if email is valid PU student email OR in allowlist
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

-- Access permissions:
-- Authenticated access is sufficient for runtime authorization checks following Google OAuth sign-in.
-- Anon access is removed to minimize public exposure and prevent unauthenticated allowlist enumeration.
-- Note: This function exposes strictly a boolean authorization result and never returns table contents.
REVOKE ALL ON FUNCTION public.is_email_allowed(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_email_allowed(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_email_allowed(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.extract_enrollment_no(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.extract_enrollment_no(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.extract_enrollment_no(TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. ALTER public.profiles (ADD email & enrollment_no)
-- -----------------------------------------------------------------------------

-- Step 3.1: Add columns as nullable first
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS enrollment_no TEXT;

COMMENT ON COLUMN public.profiles.email IS 'Authoritative authenticated user email. Automatically populated from auth.users; immutable from client.';
COMMENT ON COLUMN public.profiles.enrollment_no IS 'Extracted numeric university enrollment number from email prefix (e.g. 2403051050712). Nullable for developer/test emails.';

-- Step 3.2: Backfill existing profiles strictly from auth.users.email
UPDATE public.profiles p
SET email = lower(trim(u.email)),
    enrollment_no = public.extract_enrollment_no(u.email)
FROM auth.users u
WHERE p.id = u.id 
  AND u.email IS NOT NULL 
  AND trim(u.email) <> ''
  AND (p.email IS NULL OR trim(p.email) = '');

-- Step 3.3: Pre-enforcement verification: abort if any profiles lack a valid email in auth.users.
-- The migration must FAIL clearly rather than inventing synthetic identities if such records exist.
-- Existing records are strictly preserved and never deleted.
DO $$
DECLARE
    v_missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_missing_count
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.email IS NULL 
       OR trim(p.email) = ''
       OR u.id IS NULL 
       OR u.email IS NULL 
       OR trim(u.email) = '';

    IF v_missing_count > 0 THEN
        RAISE EXCEPTION 'Migration pre-check failed: Found % profile record(s) without a matching auth.users record or valid auth email. Aborting migration to prevent data inconsistency without fabricating identities.', v_missing_count;
    END IF;
END $$;

-- Step 3.4: Enforce NOT NULL on email
ALTER TABLE public.profiles
    ALTER COLUMN email SET NOT NULL;

-- Step 3.5: Add unique constraints / indexes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_profiles_email'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT uq_profiles_email UNIQUE (email);
    END IF;
END $$;

-- Partial unique index on enrollment_no (allows multiple NULLs for developers/testers)
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_profiles_enrollment_no
    ON public.profiles (enrollment_no)
    WHERE enrollment_no IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. PROFILE IDENTITY ENFORCEMENT TRIGGER (NON-BLOCKING FOR ADMIN/SERVICE-ROLE)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_profile_email_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_auth_email TEXT;
    v_is_privileged BOOLEAN;
BEGIN
    -- Check if execution context is service_role, postgres superuser, or admin
    v_is_privileged := (
        COALESCE(auth.role(), '') = 'service_role'
        OR current_user = 'postgres'
        OR public.is_admin() = true
    );

    IF v_is_privileged THEN
        -- Privileged execution: do not override custom values, auto-extract enrollment_no if omitted
        IF NEW.email IS NOT NULL AND (NEW.enrollment_no IS NULL OR NEW.enrollment_no = '') THEN
            NEW.enrollment_no := public.extract_enrollment_no(NEW.email);
        END IF;
        RETURN NEW;
    END IF;

    -- Standard authenticated client: strictly populate from auth.users single source of truth
    SELECT lower(trim(email)) INTO v_auth_email
    FROM auth.users
    WHERE id = NEW.id;

    IF v_auth_email IS NOT NULL AND v_auth_email <> '' THEN
        NEW.email := v_auth_email;
        NEW.enrollment_no := public.extract_enrollment_no(v_auth_email);
    ELSIF NEW.email IS NOT NULL THEN
        NEW.email := lower(trim(NEW.email));
        NEW.enrollment_no := public.extract_enrollment_no(NEW.email);
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_profile_email_identity() IS 'Enforces that client operations cannot spoof or alter email and enrollment_no, while allowing unhindered service_role and admin maintenance';

DROP TRIGGER IF EXISTS trg_enforce_profile_email_identity ON public.profiles;
CREATE TRIGGER trg_enforce_profile_email_identity
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_profile_email_identity();

-- -----------------------------------------------------------------------------
-- 5. UPDATE public.handle_new_user() FOR AUTOMATIC PROFILE INITIALIZATION
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_email TEXT;
    v_enrollment TEXT;
BEGIN
    -- 1. For Google authentication, email must exist and be authorized
    v_email := lower(trim(COALESCE(NEW.email, '')));

    IF v_email = '' OR NOT public.is_email_allowed(v_email) THEN
        RAISE EXCEPTION 'Access denied: StringX requires an official Parul University student Google account or an approved developer account.';
    END IF;

    -- 2. Extract numeric university enrollment number from email prefix if student account
    v_enrollment := public.extract_enrollment_no(v_email);

    -- 3. Create initial profile stub with validated email & enrollment number
    INSERT INTO public.profiles (id, email, enrollment_no, onboarding_status, onboarding_step)
    VALUES (NEW.id, v_email, v_enrollment, 'in_progress', 1)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        enrollment_no = EXCLUDED.enrollment_no;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function creating profile stub on new auth user creation after verifying official university or developer allowlist email';

-- -----------------------------------------------------------------------------
-- 6. AUTH.USERS EMAIL UPDATE SYNCHRONIZATION TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_auth_user_email_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_email TEXT;
    v_enrollment TEXT;
BEGIN
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        v_email := lower(trim(COALESCE(NEW.email, '')));

        -- Reject empty or unauthorized emails
        IF v_email = '' OR NOT public.is_email_allowed(v_email) THEN
            RAISE EXCEPTION 'Access denied: StringX requires an official Parul University student Google account or an approved developer account.';
        END IF;

        -- Extract enrollment number from authorized email
        v_enrollment := public.extract_enrollment_no(v_email);

        -- Synchronize authorized email and enrollment number into public.profiles
        UPDATE public.profiles
        SET email = v_email,
            enrollment_no = v_enrollment
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_auth_user_email_sync() IS 'Synchronizes public.profiles.email and enrollment_no whenever an auth.users email is updated';

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_email_sync();
