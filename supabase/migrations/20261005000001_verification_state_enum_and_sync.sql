-- =============================================================================
-- Migration: 20261005000001_verification_state_enum_and_sync.sql
-- Description: Transactional migration converting verification columns to ENUM
--              and establishing automatic state synchronization:
--              1. Creates public.verification_state ENUM ('pending', 'verified', 'rejected').
--              2. Safely drops dependent view public.v_admin_users (without CASCADE).
--              3. Converts public.verification columns:
--                 - verification_status -> public.verification_state
--                 - dp                 -> public.verification_state
--                 - face               -> public.verification_state
--              4. Drops redundant text CHECK constraints (chk_verification_status,
--                 chk_verification_dp, chk_verification_face).
--              5. Recreates chk_verification_status_invariants enforcing the exact
--                 5 valid state combinations.
--              6. Creates deterministic synchronization trigger trg_sync_verification_states:
--                 - status = 'pending'  => dp = 'pending',  face = 'pending'
--                 - status = 'verified' => dp = 'verified', face = 'verified'
--                 - status = 'rejected' => preserves explicit component states
--              7. Updates RPCs with enum types and explicit casts:
--                 - submit_face_verification
--                 - submit_dp_verification
--                 - admin_verify_user
--                 - complete_student_onboarding
--              8. Recreates public.v_admin_users with exact existing schema and permissions.
-- Security: SECURITY DEFINER with fixed search_path = public, auth, pg_temp
-- Nature: Transactional migration designed for StringX
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. CREATE VERIFICATION STATE ENUM TYPE
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'verification_state'
    ) THEN
        CREATE TYPE public.verification_state AS ENUM ('pending', 'verified', 'rejected');
    END IF;
END $$;

COMMENT ON TYPE public.verification_state IS 'Allowed moderation states for verification: pending, verified, or rejected';

-- -----------------------------------------------------------------------------
-- 2. DROP DEPENDENT VIEW (public.v_admin_users)
-- PostgreSQL prohibits altering column types referenced by a view.
-- Audited: v_admin_users has no downstream database dependents.
-- Dropped safely without CASCADE.
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_admin_users;

-- -----------------------------------------------------------------------------
-- 3. DROP REDUNDANT INDIVIDUAL VALUE CHECK CONSTRAINTS & DEFAULTS
-- ENUM typing natively enforces domain validity.
-- -----------------------------------------------------------------------------
ALTER TABLE public.verification
    DROP CONSTRAINT IF EXISTS chk_verification_status,
    DROP CONSTRAINT IF EXISTS chk_verification_dp,
    DROP CONSTRAINT IF EXISTS chk_verification_face,
    DROP CONSTRAINT IF EXISTS chk_verification_status_invariants;

ALTER TABLE public.verification
    ALTER COLUMN verification_status DROP DEFAULT,
    ALTER COLUMN dp DROP DEFAULT,
    ALTER COLUMN face DROP DEFAULT;

-- -----------------------------------------------------------------------------
-- 4. CONVERT COLUMNS FROM TEXT TO public.verification_state ENUM
-- Explicit lossless casts on verified live domain values.
-- -----------------------------------------------------------------------------
ALTER TABLE public.verification
    ALTER COLUMN verification_status TYPE public.verification_state
        USING verification_status::public.verification_state,
    ALTER COLUMN dp TYPE public.verification_state
        USING dp::public.verification_state,
    ALTER COLUMN face TYPE public.verification_state
        USING face::public.verification_state;

-- -----------------------------------------------------------------------------
-- 5. RE-APPLY ENUM-TYPED COLUMN DEFAULTS
-- -----------------------------------------------------------------------------
ALTER TABLE public.verification
    ALTER COLUMN verification_status SET DEFAULT 'pending'::public.verification_state,
    ALTER COLUMN dp SET DEFAULT 'pending'::public.verification_state,
    ALTER COLUMN face SET DEFAULT 'pending'::public.verification_state;

-- -----------------------------------------------------------------------------
-- 6. RE-APPLY RELATIONAL INVARIANT CHECK CONSTRAINT
-- Enforces ONLY the 5 allowed state combinations:
-- 1. pending  / pending  / pending
-- 2. verified / verified / verified
-- 3. rejected / verified / rejected  (rejected face only)
-- 4. rejected / rejected / verified  (rejected DP only)
-- 5. rejected / rejected / rejected  (rejected both)
-- -----------------------------------------------------------------------------
ALTER TABLE public.verification
    ADD CONSTRAINT chk_verification_status_invariants CHECK (
        (verification_status = 'pending'::public.verification_state AND
         dp = 'pending'::public.verification_state AND
         face = 'pending'::public.verification_state)
        OR
        (verification_status = 'verified'::public.verification_state AND
         dp = 'verified'::public.verification_state AND
         face = 'verified'::public.verification_state)
        OR
        (verification_status = 'rejected'::public.verification_state AND (
            (dp = 'rejected'::public.verification_state AND face = 'verified'::public.verification_state) OR
            (dp = 'verified'::public.verification_state AND face = 'rejected'::public.verification_state) OR
            (dp = 'rejected'::public.verification_state AND face = 'rejected'::public.verification_state)
        ))
    );

-- -----------------------------------------------------------------------------
-- 7. SYNCHRONIZATION TRIGGER FUNCTION & TRIGGER
-- Ensures database-level synchronization on INSERT and UPDATE:
-- - status = pending  => forces dp = pending,  face = pending
-- - status = verified => forces dp = verified, face = verified
-- - status = rejected => preserves explicitly supplied dp and face
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_verification_states()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.verification_status = 'pending'::public.verification_state THEN
        NEW.dp := 'pending'::public.verification_state;
        NEW.face := 'pending'::public.verification_state;
    ELSIF NEW.verification_status = 'verified'::public.verification_state THEN
        NEW.dp := 'verified'::public.verification_state;
        NEW.face := 'verified'::public.verification_state;
    ELSIF NEW.verification_status = 'rejected'::public.verification_state THEN
        -- Preserve explicitly supplied component states.
        -- chk_verification_status_invariants will ensure only valid rejected combinations succeed.
        NULL;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_verification_states()
IS 'BEFORE trigger synchronizing verification_status with dp and face component states';

DROP TRIGGER IF EXISTS trg_sync_verification_states ON public.verification;

CREATE TRIGGER trg_sync_verification_states
BEFORE INSERT OR UPDATE ON public.verification
FOR EACH ROW
EXECUTE FUNCTION public.sync_verification_states();

-- -----------------------------------------------------------------------------
-- 8. REDEFINE SUBMIT FACE VERIFICATION RPC (public.submit_face_verification)
-- Compatible with fresh pending attempt model (dp=pending, face=pending).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_face_verification(
    p_storage_path TEXT,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_accuracy_m DOUBLE PRECISION
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_expected_prefix TEXT;
    v_primary_photo_id UUID;
    v_verification_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_expected_prefix := v_user_id::text || '/';
    IF p_storage_path IS NULL OR NOT (p_storage_path LIKE v_expected_prefix || '%') THEN
        RAISE EXCEPTION 'Invalid storage path: must reside in user folder %', v_expected_prefix;
    END IF;

    -- Strictly require non-null geolocation telemetry for all live face submissions
    IF p_latitude IS NULL OR p_longitude IS NULL OR p_accuracy_m IS NULL THEN
        RAISE EXCEPTION 'Geolocation coordinates (latitude, longitude, accuracy_m) are strictly required for face verification';
    END IF;

    IF p_latitude < -90.0 OR p_latitude > 90.0 THEN
        RAISE EXCEPTION 'Invalid latitude: must be between -90.0 and 90.0';
    END IF;

    IF p_longitude < -180.0 OR p_longitude > 180.0 THEN
        RAISE EXCEPTION 'Invalid longitude: must be between -180.0 and 180.0';
    END IF;

    IF p_accuracy_m < 0.0 THEN
        RAISE EXCEPTION 'Invalid accuracy: must be non-negative';
    END IF;

    -- Retrieve current primary photo ID if available
    SELECT id INTO v_primary_photo_id
    FROM public.profile_photos
    WHERE user_id = v_user_id 
      AND is_primary = true 
      AND upload_status = 'completed'
    LIMIT 1;

    -- Insert new verification attempt record (fresh complete attempt: status, dp, face all 'pending')
    INSERT INTO public.verification (
        user_id,
        profile_photo_id,
        verification_status,
        dp,
        face,
        face_verification_path,
        latitude,
        longitude,
        accuracy_m,
        captured_at,
        created_at
    ) VALUES (
        v_user_id,
        v_primary_photo_id,
        'pending'::public.verification_state,
        'pending'::public.verification_state,
        'pending'::public.verification_state,
        p_storage_path,
        p_latitude,
        p_longitude,
        p_accuracy_m,
        now(),
        now()
    )
    RETURNING id INTO v_verification_id;

    -- Update overall verification_status on profiles to 'pending'
    UPDATE public.profiles
    SET 
        verification_status = 'pending',
        face_verification_path = p_storage_path,
        updated_at = now()
    WHERE id = v_user_id;

    RETURN json_build_object(
        'success', true,
        'verification_id', v_verification_id,
        'verification_status', 'pending',
        'dp', 'pending',
        'face', 'pending'
    );
END;
$$;

COMMENT ON FUNCTION public.submit_face_verification(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) 
IS 'Submits face verification selfie with mandatory geolocation telemetry. Creates fresh complete pending verification attempt.';
REVOKE EXECUTE ON FUNCTION public.submit_face_verification(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_face_verification(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_face_verification(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- -----------------------------------------------------------------------------
-- 9. REDEFINE SUBMIT DP VERIFICATION RPC (public.submit_dp_verification)
-- Compatible with fresh pending attempt model (dp=pending, face=pending).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_dp_verification(p_profile_photo_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_photo public.profile_photos%ROWTYPE;
    v_latest_rec public.verification%ROWTYPE;
    v_face_path TEXT;
    v_verification_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_profile_photo_id IS NULL THEN
        RAISE EXCEPTION 'Profile photo ID is required';
    END IF;

    -- 1. Validate photo existence and security ownership
    SELECT * INTO v_photo
    FROM public.profile_photos
    WHERE id = p_profile_photo_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile photo not found: %', p_profile_photo_id;
    END IF;

    IF v_photo.user_id <> v_user_id THEN
        RAISE EXCEPTION 'Access denied: photo belongs to another user';
    END IF;

    IF NOT v_photo.is_primary THEN
        RAISE EXCEPTION 'Invalid submission: photo must be the current primary profile photo';
    END IF;

    IF v_photo.upload_status <> 'completed' THEN
        RAISE EXCEPTION 'Invalid submission: photo upload is not completed';
    END IF;

    -- 2. Inspect latest verification record for face verification path carry-over
    SELECT * INTO v_latest_rec
    FROM public.verification
    WHERE user_id = v_user_id
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    IF v_latest_rec.face_verification_path IS NOT NULL
       AND trim(v_latest_rec.face_verification_path) <> '' THEN
        v_face_path := v_latest_rec.face_verification_path;
    ELSE
        v_face_path := NULL;
    END IF;

    -- 3. Create fresh pending verification attempt for DP (dp=pending, face=pending)
    -- Location telemetry is explicitly NULL: location belongs strictly to biometric selfie capture, never DP
    INSERT INTO public.verification (
        user_id,
        profile_photo_id,
        verification_status,
        dp,
        face,
        face_verification_path,
        latitude,
        longitude,
        accuracy_m,
        captured_at,
        created_at
    ) VALUES (
        v_user_id,
        p_profile_photo_id,
        'pending'::public.verification_state,
        'pending'::public.verification_state,
        'pending'::public.verification_state,
        v_face_path,
        NULL,
        NULL,
        NULL,
        NULL,
        now()
    )
    RETURNING id INTO v_verification_id;

    -- 4. Update overall status on profiles
    UPDATE public.profiles
    SET 
        verification_status = 'pending',
        updated_at = now()
    WHERE id = v_user_id;

    RETURN json_build_object(
        'success', true,
        'verification_id', v_verification_id,
        'verification_status', 'pending',
        'dp', 'pending',
        'face', 'pending',
        'profile_photo_id', p_profile_photo_id
    );
END;
$$;

COMMENT ON FUNCTION public.submit_dp_verification(UUID) 
IS 'Submits updated profile photo for DP verification. Validates ownership and primary status. Creates fresh complete pending verification attempt.';
REVOKE EXECUTE ON FUNCTION public.submit_dp_verification(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_dp_verification(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_dp_verification(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 10. REDEFINE ADMIN VERIFY USER RPC (public.admin_verify_user)
-- Uses enum-typed variables and explicit verification_state casts.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_verify_user(
    p_user_code_or_id TEXT,
    p_approved BOOLEAN,
    p_reject_dp BOOLEAN DEFAULT false,
    p_reject_face BOOLEAN DEFAULT false,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_user_code TEXT;
    v_latest_rec public.verification%ROWTYPE;
    v_target_verification_id UUID;
    v_status public.verification_state;
    v_dp public.verification_state;
    v_face public.verification_state;
    v_reason TEXT;
BEGIN
    -- 1. Verify administrator authorization
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: caller does not have administrative privileges';
    END IF;

    -- 2. Resolve target user
    SELECT id, user_code INTO v_user_id, v_user_code
    FROM public.profiles
    WHERE user_code = upper(trim(p_user_code_or_id)) 
       OR id::text = trim(p_user_code_or_id);

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User profile not found: %', p_user_code_or_id;
    END IF;

    -- 3. Retrieve latest verification attempt record with deterministic tie-breaking
    SELECT * INTO v_latest_rec
    FROM public.verification
    WHERE user_id = v_user_id
    ORDER BY created_at DESC, id DESC
    LIMIT 1
    FOR UPDATE;

    IF v_latest_rec.id IS NULL THEN
        RAISE EXCEPTION 'No verification submission exists for this user';
    END IF;

    IF v_latest_rec.verification_status <> 'pending'::public.verification_state THEN
        RAISE EXCEPTION
            'Cannot moderate verification attempt with status %; a pending verification submission is required',
            v_latest_rec.verification_status;
    END IF;

    -- Evidence validation: approved verification requires both DP and Face submissions
    IF p_approved THEN
        IF v_latest_rec.profile_photo_id IS NULL THEN
            RAISE EXCEPTION
                'Cannot approve verification: profile photo submission is missing';
        END IF;

        IF v_latest_rec.face_verification_path IS NULL
           OR trim(v_latest_rec.face_verification_path) = '' THEN
            RAISE EXCEPTION
                'Cannot approve verification: face verification submission is missing';
        END IF;
    END IF;

    -- 4. Evaluate moderation decision
    IF p_approved THEN
        v_status := 'verified'::public.verification_state;
        v_dp := 'verified'::public.verification_state;
        v_face := 'verified'::public.verification_state;
        v_reason := NULL;
    ELSE
        -- Must explicitly reject at least one component
        IF NOT p_reject_dp AND NOT p_reject_face THEN
            RAISE EXCEPTION 'Invalid rejection: administrator must specify whether DP, Face, or both are rejected';
        END IF;

        IF p_rejection_reason IS NULL OR trim(p_rejection_reason) = '' THEN
            RAISE EXCEPTION 'Rejection reason is required when rejecting verification';
        END IF;

        -- Determine component rejection states:
        -- In pending attempts, dp and face are pending.
        -- When rejecting:
        -- - if p_reject_dp is true -> dp = 'rejected'
        -- - if p_reject_dp is false -> dp = 'verified'
        -- - if p_reject_face is true -> face = 'rejected'
        -- - if p_reject_face is false -> face = 'verified'
        -- This guarantees that the approved component becomes 'verified', the rejected becomes 'rejected',
        -- and neither component remains 'pending' in a rejected overall status.
        IF p_reject_dp THEN
            v_dp := 'rejected'::public.verification_state;
        ELSE
            v_dp := 'verified'::public.verification_state;
        END IF;

        IF p_reject_face THEN
            v_face := 'rejected'::public.verification_state;
        ELSE
            v_face := 'verified'::public.verification_state;
        END IF;

        -- Safety assertion against invalid rejected combination
        IF v_dp = 'verified'::public.verification_state AND v_face = 'verified'::public.verification_state THEN
            RAISE EXCEPTION 'Invalid rejection state: at least one component must be rejected';
        END IF;

        v_status := 'rejected'::public.verification_state;
        v_reason := trim(p_rejection_reason);
    END IF;

    -- 5. Update the existing verification attempt record
    UPDATE public.verification
    SET 
        verification_status = v_status,
        dp = v_dp,
        face = v_face,
        verification_rejection_reason = v_reason
    WHERE id = v_latest_rec.id;
    v_target_verification_id := v_latest_rec.id;

    -- 6. Update overall status on public.profiles
    UPDATE public.profiles
    SET 
        verification_status = v_status::text,
        updated_at = now()
    WHERE id = v_user_id;

    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id,
        'user_code', v_user_code,
        'verification_id', v_target_verification_id,
        'verification_status', v_status::text,
        'dp', v_dp::text,
        'face', v_face::text,
        'verification_rejection_reason', v_reason
    );
END;
$$;

COMMENT ON FUNCTION public.admin_verify_user(TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) 
IS 'Administrative RPC to approve or reject student verification with verification_state enum support and invariant protection';
REVOKE EXECUTE ON FUNCTION public.admin_verify_user(TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_verify_user(TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_verify_user(TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 11. REDEFINE COMPLETE STUDENT ONBOARDING RPC (public.complete_student_onboarding)
-- Uses enum-typed verification row and verifies status IN ('pending', 'verified').
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_student_onboarding()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
    v_latest_v public.verification%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    IF v_profile.full_name IS NULL OR trim(v_profile.full_name) = '' THEN
        RAISE EXCEPTION 'Cannot complete onboarding: full_name is required';
    END IF;

    IF v_profile.gender IS NULL OR trim(v_profile.gender) = '' THEN
        RAISE EXCEPTION 'Cannot complete onboarding: gender is required';
    END IF;

    IF v_profile.university_id IS NULL THEN
        RAISE EXCEPTION 'Cannot complete onboarding: university selection is required';
    END IF;

    IF v_profile.course_id IS NULL THEN
        RAISE EXCEPTION 'Cannot complete onboarding: course selection is required';
    END IF;

    IF v_profile.study_year IS NULL OR trim(v_profile.study_year) = '' THEN
        RAISE EXCEPTION 'Cannot complete onboarding: study_year is required';
    END IF;

    IF v_profile.home_state IS NULL OR trim(v_profile.home_state) = '' THEN
        RAISE EXCEPTION 'Cannot complete onboarding: home_state is required';
    END IF;

    IF v_profile.height_cm IS NULL OR v_profile.height_cm <= 0 THEN
        RAISE EXCEPTION 'Cannot complete onboarding: height is required';
    END IF;

    -- Confirm face verification submission in user's LATEST attempt with deterministic ordering
    SELECT * INTO v_latest_v
    FROM public.verification
    WHERE user_id = auth.uid()
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    -- Must have a latest verification record containing a valid face verification path and non-rejected status
    IF v_latest_v.id IS NULL 
       OR v_latest_v.verification_status NOT IN ('pending'::public.verification_state, 'verified'::public.verification_state)
       OR v_latest_v.face_verification_path IS NULL 
       OR trim(v_latest_v.face_verification_path) = '' THEN
        RAISE EXCEPTION 'Cannot complete onboarding: a valid face verification submission is required';
    END IF;

    UPDATE public.profiles
    SET 
        onboarding_status = 'completed',
        is_profile_completed = true,
        onboarding_step = 9,
        updated_at = now()
    WHERE id = auth.uid();

    RETURN json_build_object(
        'success', true,
        'onboarding_status', 'completed',
        'is_profile_completed', true
    );
END;
$$;

COMMENT ON FUNCTION public.complete_student_onboarding() 
IS 'Validates required onboarding fields and confirms face verification in latest attempt with verification_state enum support';
REVOKE EXECUTE ON FUNCTION public.complete_student_onboarding() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_student_onboarding() FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_student_onboarding() TO authenticated;

-- -----------------------------------------------------------------------------
-- 12. RECREATE public.v_admin_users VIEW (EXACT PROJECTION & LOGIC)
-- Recreated with exact columns, LATERAL joins, security barrier, and permissions.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_admin_users
WITH (security_barrier = true, security_invoker = false) AS
SELECT 
    p.id,
    p.user_code,
    u_auth.phone,
    p.full_name,
    p.gender,
    p.birth_year,
    (EXTRACT(YEAR FROM CURRENT_DATE) - p.birth_year)::smallint AS age,
    p.university_id,
    univ.name AS university_name,
    univ.campus_code AS university_code,
    p.hostel_id,
    h.name AS hostel_name,
    p.course_id,
    c.name AS course_name,
    p.study_year,
    p.home_state,
    p.height_cm,
    p.weight_kg,
    p.instagram_id,
    -- Verification telemetry from public.profiles & public.verification
    p.verification_status,
    latest_v.id AS verification_id,
    latest_v.profile_photo_id,
    latest_v.dp AS verification_dp,
    latest_v.face AS verification_face,
    COALESCE(latest_v.face_verification_path, p.face_verification_path) AS face_verification_path,
    latest_v.latitude,
    latest_v.longitude,
    latest_v.accuracy_m,
    latest_v.captured_at,
    latest_v.verification_rejection_reason,
    latest_v.created_at AS verification_created_at,
    p.is_premium,
    p.premium_started_at,
    p.premium_expires_at,
    p.onboarding_status,
    p.onboarding_step,
    p.is_profile_completed,
    pp.storage_path AS primary_photo_path,
    pp.id AS current_primary_photo_id,
    act_m.id AS active_match_id,
    act_m.event_id AS active_event_id,
    act_m.match_source,
    act_m.partner_id,
    partner_prof.user_code AS partner_user_code,
    partner_prof.full_name AS partner_full_name,
    act_reg.matched_with AS registered_matched_with,
    act_m.admin_reveal,
    act_m.is_revealed,
    act_m.revealed_at,
    p.created_at,
    p.updated_at
FROM public.profiles p
JOIN auth.users u_auth ON u_auth.id = p.id
LEFT JOIN public.universities univ ON univ.id = p.university_id
LEFT JOIN public.hostels h ON h.id = p.hostel_id
LEFT JOIN public.courses c ON c.id = p.course_id
LEFT JOIN public.profile_photos pp ON pp.user_id = p.id AND pp.is_primary = true
LEFT JOIN LATERAL (
    SELECT 
        v.id,
        v.profile_photo_id,
        v.verification_status,
        v.dp,
        v.face,
        v.face_verification_path,
        v.latitude,
        v.longitude,
        v.accuracy_m,
        v.captured_at,
        v.verification_rejection_reason,
        v.created_at
    FROM public.verification v
    WHERE v.user_id = p.id
    ORDER BY v.created_at DESC, v.id DESC
    LIMIT 1
) latest_v ON true
LEFT JOIN LATERAL (
    SELECT 
        m.id,
        m.event_id,
        m.match_source,
        CASE 
            WHEN m.user_a_id = p.id THEN m.user_b_id 
            ELSE m.user_a_id 
        END AS partner_id,
        m.admin_reveal,
        (m.revealed_at IS NOT NULL) AS is_revealed,
        m.revealed_at
    FROM public.matches m
    WHERE (m.user_a_id = p.id OR m.user_b_id = p.id)
      AND m.status = 'active'
    ORDER BY m.matched_at DESC
    LIMIT 1
) act_m ON true
LEFT JOIN public.profiles partner_prof ON partner_prof.id = act_m.partner_id
LEFT JOIN LATERAL (
    SELECT er.matched_with
    FROM public.event_registrations er
    WHERE er.user_id = p.id
      AND er.status = 'registered'
    ORDER BY er.registered_at DESC
    LIMIT 1
) act_reg ON true
WHERE public.is_admin() = true;

COMMENT ON VIEW public.v_admin_users IS 'Comprehensive admin master user directory with latest unified verification telemetry, phone, weight, and match status';
REVOKE ALL ON public.v_admin_users FROM PUBLIC;
GRANT SELECT ON public.v_admin_users TO authenticated;

COMMIT;

-- =============================================================================
-- POST-MIGRATION VERIFICATION QUERIES (MANUAL AUDIT ONLY - DO NOT AUTO-EXECUTE)
-- =============================================================================
/*
-- 1. Check ENUM type creation:
SELECT n.nspname, t.typname
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname = 'verification_state';

-- 2. Check ENUM values and sort order:
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname = 'verification_state'
ORDER BY e.enumsortorder;

-- 3. Check column data types and UDT names:
SELECT column_name, data_type, udt_schema, udt_name, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'verification'
  AND column_name IN ('verification_status', 'dp', 'face')
ORDER BY column_name;

-- 4. Verify existing data combinations (must only be the 5 valid combinations):
SELECT verification_status, dp, face, COUNT(*)
FROM public.verification
GROUP BY verification_status, dp, face
ORDER BY verification_status, dp, face;

-- 5. Verify trigger exists and is active:
SELECT trigger_name, event_manipulation, action_statement, action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'verification'
  AND trigger_name = 'trg_sync_verification_states';

-- 6. Verify invariant check constraint exists:
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.verification'::regclass
  AND conname = 'chk_verification_status_invariants';

-- 7. Verify v_admin_users exists and is valid:
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'v_admin_users';

-- 8. Verify function signatures and security attributes:
SELECT 
    p.proname,
    pg_get_function_identity_arguments(p.oid) AS args,
    p.prosecdef AS is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
      'submit_face_verification',
      'submit_dp_verification',
      'admin_verify_user',
      'complete_student_onboarding',
      'sync_verification_states'
  )
ORDER BY p.proname;
*/
