-- =============================================================================
-- Migration: 20260929000003_deleted_accounts_archive.sql
-- Description: Creates public.deleted_accounts archive table with 30-day retention
--              metadata (deleted_at), atomic delete_user_account() RPC that archives
--              profile data before safely deleting auth.users row, and purge function.
--              Strictly isolates deleted accounts from active tables and client access.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATE DELETED_ACCOUNTS ARCHIVE TABLE
-- Note: id has NO foreign key to auth.users, allowing original auth row deletion.
-- Preserves current active profiles columns without obsolete columns (nickname, pronouns, is_day_scholar).
-- Added deleted_at TIMESTAMPTZ NOT NULL DEFAULT now() for retention enforcement.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deleted_accounts (
    id UUID PRIMARY KEY,
    user_code TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    gender TEXT NOT NULL DEFAULT '',
    birth_year SMALLINT,
    university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    hostel_id UUID,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    study_year TEXT,
    home_state TEXT,
    height_cm SMALLINT,
    weight_kg NUMERIC(5,2),
    instagram_id TEXT,
    verification_status TEXT NOT NULL DEFAULT 'not_started',
    face_verification_path TEXT,
    face_verified_at TIMESTAMPTZ,
    verification_rejection_reason TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    premium_started_at TIMESTAMPTZ,
    premium_expires_at TIMESTAMPTZ,
    onboarding_status TEXT NOT NULL DEFAULT 'in_progress',
    onboarding_step SMALLINT NOT NULL DEFAULT 1,
    is_profile_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.deleted_accounts IS 'Archival repository for deleted user profiles. Temporarily retained for legal/security compliance (default 30-day retention). No foreign key to auth.users.';
COMMENT ON COLUMN public.deleted_accounts.deleted_at IS 'Timestamp of user-confirmed deletion, used for automated retention purge evaluation.';

-- Index on deleted_at for efficient retention purge queries
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_deleted_at 
ON public.deleted_accounts (deleted_at);

-- -----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) FOR DELETED_ACCOUNTS
-- Regular clients cannot SELECT, INSERT, UPDATE, or DELETE archived records directly.
-- Access is strictly reserved for server-side RPC functions and admin reviews.
-- -----------------------------------------------------------------------------
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.deleted_accounts FROM PUBLIC;
REVOKE ALL ON TABLE public.deleted_accounts FROM anon;
REVOKE ALL ON TABLE public.deleted_accounts FROM authenticated;

-- Only verified administrators can view the archive
CREATE POLICY "Admins can view deleted accounts archive"
ON public.deleted_accounts FOR SELECT
TO authenticated
USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. SERVER-SIDE ATOMIC ACCOUNT DELETION RPC (delete_user_account)
-- Authenticated caller requests deletion of their own account.
-- Step 1: Validates auth.uid().
-- Step 2: Reads complete current public.profiles row.
-- Step 3: Inserts profile row into public.deleted_accounts.
-- Step 4: Verifies archival insert succeeded.
-- Step 5: Deletes user from auth.users (which cascades to public.profiles and related tables).
-- If any step fails, entire transaction rolls back to preserve the account.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_profile public.profiles%ROWTYPE;
    v_archive_id UUID;
BEGIN
    -- 1. Identify current authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required: No active session';
    END IF;

    -- 2. Read the complete current public.profiles row
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile record not found for user %', v_user_id;
    END IF;

    -- 3. Insert exact profile data into public.deleted_accounts
    INSERT INTO public.deleted_accounts (
        id,
        user_code,
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
        verification_status,
        face_verification_path,
        face_verified_at,
        verification_rejection_reason,
        is_premium,
        premium_started_at,
        premium_expires_at,
        onboarding_status,
        onboarding_step,
        is_profile_completed,
        created_at,
        updated_at,
        deleted_at
    ) VALUES (
        v_profile.id,
        v_profile.user_code,
        v_profile.full_name,
        v_profile.gender,
        v_profile.birth_year,
        v_profile.university_id,
        v_profile.hostel_id,
        v_profile.course_id,
        v_profile.study_year,
        v_profile.home_state,
        v_profile.height_cm,
        v_profile.weight_kg,
        v_profile.instagram_id,
        v_profile.verification_status,
        v_profile.face_verification_path,
        v_profile.face_verified_at,
        v_profile.verification_rejection_reason,
        v_profile.is_premium,
        v_profile.premium_started_at,
        v_profile.premium_expires_at,
        v_profile.onboarding_status,
        v_profile.onboarding_step,
        v_profile.is_profile_completed,
        v_profile.created_at,
        v_profile.updated_at,
        now()
    )
    RETURNING id INTO v_archive_id;

    -- 4. Verify the archive insert succeeded
    IF v_archive_id IS NULL THEN
        RAISE EXCEPTION 'Archival failed: could not insert into deleted_accounts';
    END IF;

    -- 5. Delete active user from auth.users (cascades to public.profiles, profile_photos, matches, etc.)
    DELETE FROM auth.users WHERE id = v_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Account successfully archived and deleted',
        'archived_id', v_archive_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Account deletion failed: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.delete_user_account() IS 'Atomically archives active profile to deleted_accounts before deleting auth.users row and cascading related data. Strict auth.uid() check.';
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RETENTION PURGE FUNCTION (purge_expired_deleted_accounts)
-- Purges archived accounts older than retention period (default 30 days).
-- Reserved for administrator invocation or scheduled pg_cron maintenance.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_expired_deleted_accounts(p_retention_days INTEGER DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_purged_count INTEGER;
BEGIN
    DELETE FROM public.deleted_accounts
    WHERE deleted_at < (now() - (p_retention_days || ' days')::interval);

    GET DIAGNOSTICS v_purged_count = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'purged_count', v_purged_count,
        'retention_days', p_retention_days
    );
END;
$$;

COMMENT ON FUNCTION public.purge_expired_deleted_accounts(INTEGER) IS 'Purges archived accounts older than retention period (default 30 days). Reserved for admin/cron.';
REVOKE EXECUTE ON FUNCTION public.purge_expired_deleted_accounts(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purge_expired_deleted_accounts(INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purge_expired_deleted_accounts(INTEGER) FROM authenticated;
