-- =============================================================================
-- Migration: 20261004000001_unified_verification_system.sql
-- Description: Transactional migration implementing the unified verification architecture
--              - Creates public.verification table for DP and Face moderation
--              - Adds profile_photo_id foreign key linking verification to public.profile_photos
--              - Enforces strict status invariants (pending, verified, rejected)
--              - Preserves multi-attempt history with deterministic index (user_id, created_at DESC, id DESC)
--              - Migrates existing verification records from public.profiles (legacy grandfathering)
--              - Deduplicates profile_photos join during migration using LATERAL LIMIT 1
--              - Normalizes profiles.verification_status to ('pending', 'verified', 'rejected')
--              - Safely drops face_verified_at and verification_rejection_reason from profiles
--              - Retains profiles.face_verification_path strictly as transitional compatibility state
--              - Safely updates public.v_admin_users without CASCADE to project latest verification telemetry
--              - Redefines submit_face_verification RPC requiring non-null geolocation telemetry
--              - Redefines submit_dp_verification(p_profile_photo_id UUID) RPC with strict validation
--              - Redefines admin_verify_user RPC with robust DP/Face rejection & invariant preservation
--              - Updates complete_student_onboarding RPC to verify latest attempt strictly from public.verification
--              - Updates delete_user_account RPC and deleted_accounts archive schema
-- Security: SECURITY DEFINER with fixed search_path = public, auth, pg_temp
-- Nature: Transactional migration designed for the current StringX schema
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. CREATE UNIFIED VERIFICATION TABLE (public.verification)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_photo_id UUID NULL REFERENCES public.profile_photos(id) ON DELETE SET NULL,
    verification_status TEXT NOT NULL DEFAULT 'pending',
    dp TEXT NOT NULL DEFAULT 'pending',
    face TEXT NOT NULL DEFAULT 'pending',
    face_verification_path TEXT NULL,
    latitude DOUBLE PRECISION NULL,
    longitude DOUBLE PRECISION NULL,
    accuracy_m DOUBLE PRECISION NULL,
    captured_at TIMESTAMPTZ NULL,
    verification_rejection_reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Value domain constraints
    CONSTRAINT chk_verification_status CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    CONSTRAINT chk_verification_dp CHECK (dp IN ('pending', 'verified', 'rejected')),
    CONSTRAINT chk_verification_face CHECK (face IN ('pending', 'verified', 'rejected')),

    -- Location constraints
    CONSTRAINT chk_verification_latitude CHECK (latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)),
    CONSTRAINT chk_verification_longitude CHECK (longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)),
    CONSTRAINT chk_verification_accuracy CHECK (accuracy_m IS NULL OR accuracy_m >= 0.0),

    -- Status Invariants Rule:
    -- 1. verification_status = 'pending' => exactly one of:
    --    - pending / pending  (initial dual submission)
    --    - verified / pending (re-verifying Face after rejection while DP is already verified)
    --    - pending / verified (re-verifying DP after rejection while Face is already verified)
    -- 2. verification_status = 'verified' => dp = 'verified' AND face = 'verified'
    -- 3. verification_status = 'rejected' => exactly one of:
    --    - rejected / verified
    --    - verified / rejected
    --    - rejected / rejected
    -- Never allowed: rejected / pending, pending / rejected, or status = verified with unverified components
    CONSTRAINT chk_verification_status_invariants CHECK (
        (verification_status = 'pending' AND (
            (dp = 'pending' AND face = 'pending') OR
            (dp = 'verified' AND face = 'pending') OR
            (dp = 'pending' AND face = 'verified')
        )) OR
        (verification_status = 'verified' AND (
            dp = 'verified' AND face = 'verified'
        )) OR
        (verification_status = 'rejected' AND (
            (dp = 'rejected' AND face = 'verified') OR
            (dp = 'verified' AND face = 'rejected') OR
            (dp = 'rejected' AND face = 'rejected')
        ))
    )
);

COMMENT ON TABLE public.verification IS 'Unified verification records for DP (profile photo) and live biometric face selfie moderation';
COMMENT ON COLUMN public.verification.user_id IS 'Student auth user ID. Multiple rows allowed per user for multi-attempt audit history';
COMMENT ON COLUMN public.verification.profile_photo_id IS 'Foreign key to public.profile_photos linking DP moderation to the exact evaluated photo';
COMMENT ON COLUMN public.verification.verification_status IS 'Overall combined verification status: pending, verified, or rejected';
COMMENT ON COLUMN public.verification.dp IS 'Profile photo moderation status: pending, verified, or rejected';
COMMENT ON COLUMN public.verification.face IS 'Face selfie biometric status: pending, verified, or rejected';
COMMENT ON COLUMN public.verification.face_verification_path IS 'Private storage path in verifications bucket for biometric selfie';
COMMENT ON COLUMN public.verification.verification_rejection_reason IS 'Internal moderation rejection reason. Stored strictly here and never in profiles';

-- -----------------------------------------------------------------------------
-- 2. INDEXES ON public.verification
-- -----------------------------------------------------------------------------
-- Retrieve the latest verification attempt per user with deterministic tie-breaking
CREATE INDEX IF NOT EXISTS idx_verification_user_created 
ON public.verification (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_verification_profile_photo 
ON public.verification (profile_photo_id);

CREATE INDEX IF NOT EXISTS idx_verification_status 
ON public.verification (verification_status);

-- -----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) FOR public.verification
-- -----------------------------------------------------------------------------
ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.verification FROM PUBLIC;
REVOKE ALL ON TABLE public.verification FROM anon;
REVOKE ALL ON TABLE public.verification FROM authenticated;

-- Grant selective SELECT to authenticated users
GRANT SELECT ON TABLE public.verification TO authenticated;

-- Students can read their own verification attempts
CREATE POLICY "Users can view own verification records"
ON public.verification FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Administrators can view all verification records
CREATE POLICY "Admins can view all verification records"
ON public.verification FOR SELECT
TO authenticated
USING (public.is_admin());

-- Administrators can manage verification records if needed directly
CREATE POLICY "Admins can manage all verification records"
ON public.verification FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. NORMALIZE EXISTING PROFILES VERIFICATION STATUS & CONSTRAINTS
-- -----------------------------------------------------------------------------
-- Migrate legacy status values before altering constraint
UPDATE public.profiles
SET verification_status = 'pending'
WHERE verification_status = 'not_started' OR verification_status IS NULL;

UPDATE public.profiles
SET verification_status = 'rejected'
WHERE verification_status = 'failed';

-- Update check constraint on profiles.verification_status
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS chk_profiles_verification;

ALTER TABLE public.profiles 
ADD CONSTRAINT chk_profiles_verification 
CHECK (verification_status IN ('pending', 'verified', 'rejected'));

ALTER TABLE public.profiles 
ALTER COLUMN verification_status SET DEFAULT 'pending';

-- -----------------------------------------------------------------------------
-- 5. MIGRATE EXISTING VERIFICATION RECORDS INTO public.verification
-- NOTE: Grandfathering Decision
-- Users previously marked 'verified' in legacy public.profiles are grandfathered
-- as (verification_status = 'verified', dp = 'verified', face = 'verified') to
-- preserve their existing active standing. This is a legacy compatibility decision,
-- not historical proof of independent dual-component moderation.
-- Historical telemetry (latitude, longitude, accuracy_m, captured_at) is left NULL.
-- Uses LATERAL with LIMIT 1 on profile_photos to prevent any duplicate row creation.
-- -----------------------------------------------------------------------------
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
    verification_rejection_reason,
    created_at
)
SELECT 
    p.id AS user_id,
    primary_photo.id AS profile_photo_id,
    CASE 
        WHEN p.verification_status = 'verified' THEN 'verified'
        WHEN p.verification_status = 'rejected' THEN 'rejected'
        ELSE 'pending'
    END AS verification_status,
    CASE 
        WHEN p.verification_status = 'verified' THEN 'verified'
        WHEN p.verification_status = 'rejected' THEN 'rejected'
        ELSE 'pending'
    END AS dp,
    CASE 
        WHEN p.verification_status = 'verified' THEN 'verified'
        WHEN p.verification_status = 'rejected' THEN 'rejected'
        ELSE 'pending'
    END AS face,
    p.face_verification_path,
    NULL::double precision AS latitude,
    NULL::double precision AS longitude,
    NULL::double precision AS accuracy_m,
    NULL::timestamptz AS captured_at,
    p.verification_rejection_reason,
    now() AS created_at
FROM public.profiles p
LEFT JOIN LATERAL (
    SELECT pp.id
    FROM public.profile_photos pp
    WHERE pp.user_id = p.id AND pp.is_primary = true
    ORDER BY pp.created_at DESC, pp.id DESC
    LIMIT 1
) primary_photo ON true
WHERE p.face_verification_path IS NOT NULL 
  AND trim(p.face_verification_path) <> ''
  AND NOT EXISTS (
      SELECT 1 FROM public.verification v WHERE v.user_id = p.id
  );

-- -----------------------------------------------------------------------------
-- 6. RECREATE public.v_admin_users VIEW (SAFELY WITHOUT CASCADE)
-- Dependency Audit: Verified no dependent database objects exist for v_admin_users.
-- Dropping without CASCADE protects against unintended object removal.
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_admin_users;

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

-- -----------------------------------------------------------------------------
-- 7. RECREATE public.v_matched_profiles VIEW (SAFELY WITHOUT CASCADE)
-- Dependency Audit: Verified no dependent database objects exist for v_matched_profiles.
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_matched_profiles;

CREATE OR REPLACE VIEW public.v_matched_profiles
WITH (security_barrier = true, security_invoker = false) AS
SELECT 
    p.id,
    p.user_code,
    p.full_name,
    p.gender,
    (EXTRACT(YEAR FROM CURRENT_DATE) - p.birth_year)::smallint AS age,
    p.height_cm,
    p.home_state,
    p.study_year,
    u.name AS university_name,
    u.campus_code AS university_code,
    h.name AS hostel_name,
    c.name AS course_name,
    p.verification_status,
    pp.storage_path AS primary_photo_path,
    CASE 
        WHEN conn.id IS NOT NULL 
             AND conn.status = 'connected' 
             AND conn.user_a_revealed 
             AND conn.user_b_revealed
        THEN p.instagram_id
        ELSE NULL
    END AS instagram_id
FROM public.profiles p
LEFT JOIN public.universities u ON p.university_id = u.id
LEFT JOIN public.hostels h ON p.hostel_id = h.id
LEFT JOIN public.courses c ON p.course_id = c.id
LEFT JOIN public.profile_photos pp ON pp.user_id = p.id AND pp.is_primary = true
LEFT JOIN public.connections conn ON (
    (conn.user_a_id = p.id AND conn.user_b_id = auth.uid()) OR
    (conn.user_b_id = p.id AND conn.user_a_id = auth.uid())
) AND conn.status = 'connected';

COMMENT ON VIEW public.v_matched_profiles IS 'Filtered student profile view for active matches with privacy-guarded Instagram reveal';
REVOKE ALL ON public.v_matched_profiles FROM PUBLIC;
GRANT SELECT ON public.v_matched_profiles TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. REDEFINE SUBMIT FACE VERIFICATION RPC (public.submit_face_verification)
-- Strictly requires non-null latitude, longitude, and accuracy_m for all new submissions.
-- Uses deterministic (created_at DESC, id DESC) ordering.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_face_verification(TEXT);
DROP FUNCTION IF EXISTS public.submit_face_verification(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);

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
    v_latest_dp TEXT;
    v_new_dp TEXT;
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

    -- Inspect latest verification record to preserve already-verified DP state (deterministic ordering)
    SELECT dp INTO v_latest_dp
    FROM public.verification
    WHERE user_id = v_user_id
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    IF v_latest_dp = 'verified' THEN
        v_new_dp := 'verified';
    ELSE
        v_new_dp := 'pending';
    END IF;

    -- Retrieve current primary photo ID if available
    SELECT id INTO v_primary_photo_id
    FROM public.profile_photos
    WHERE user_id = v_user_id 
      AND is_primary = true 
      AND upload_status = 'completed'
    LIMIT 1;

    -- Insert new verification attempt record with mandatory captured telemetry
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
        'pending',
        v_new_dp,
        'pending',
        p_storage_path,
        p_latitude,
        p_longitude,
        p_accuracy_m,
        now(),
        now()
    )
    RETURNING id INTO v_verification_id;

    -- Update overall verification_status on profiles to 'pending'
    -- Note: profiles.face_verification_path is updated as transitional compatibility state
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
        'dp', v_new_dp,
        'face', 'pending'
    );
END;
$$;

COMMENT ON FUNCTION public.submit_face_verification(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) 
IS 'Submits face verification selfie with mandatory geolocation telemetry. Creates new attempt record preserving verified DP status.';
REVOKE EXECUTE ON FUNCTION public.submit_face_verification(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_face_verification(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_face_verification(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- -----------------------------------------------------------------------------
-- 9. REDEFINE SUBMIT DP VERIFICATION RPC (public.submit_dp_verification)
-- Uses deterministic (created_at DESC, id DESC) ordering.
-- Leaves location telemetry strictly NULL (location belongs to face capture).
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_dp_verification();
DROP FUNCTION IF EXISTS public.submit_dp_verification(UUID);

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
    v_new_face TEXT;
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

    -- 2. Inspect latest verification record with deterministic tie-breaking
    SELECT * INTO v_latest_rec
    FROM public.verification
    WHERE user_id = v_user_id
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    -- Preserve verified Face status if already verified; carry forward pending face path if non-empty;
    -- NEVER carry forward a rejected or empty face verification path into a new DP verification attempt.
    IF v_latest_rec.face = 'verified' THEN
        v_new_face := 'verified';
        v_face_path := v_latest_rec.face_verification_path;

    ELSIF v_latest_rec.face = 'pending'
          AND v_latest_rec.face_verification_path IS NOT NULL
          AND trim(v_latest_rec.face_verification_path) <> '' THEN
        v_new_face := 'pending';
        v_face_path := v_latest_rec.face_verification_path;

    ELSE
        v_new_face := 'pending';
        v_face_path := NULL;
    END IF;

    -- 3. Create new verification attempt for DP
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
        'pending',
        'pending',
        v_new_face,
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
        'face', v_new_face,
        'profile_photo_id', p_profile_photo_id
    );
END;
$$;

COMMENT ON FUNCTION public.submit_dp_verification(UUID) 
IS 'Submits updated profile photo for DP verification. Validates ownership and primary status. Preserves verified Face status. Leaves location telemetry NULL.';
REVOKE EXECUTE ON FUNCTION public.submit_dp_verification(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_dp_verification(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_dp_verification(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 10. REDEFINE COMPLETE STUDENT ONBOARDING RPC
-- Checks user's LATEST attempt with deterministic tie-breaking (created_at DESC, id DESC).
-- public.verification is the single source of truth; no fallback to profiles.face_verification_path.
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

    -- Confirm face verification submission in user's LATEST attempt with deterministic ordering:
    -- (Does not require face = 'verified'; 'pending' is completely valid for onboarding completion)
    -- The latest public.verification row is the sole authoritative source of truth.
    SELECT * INTO v_latest_v
    FROM public.verification
    WHERE user_id = auth.uid()
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    -- Must have a latest verification record containing a valid face verification path
    IF v_latest_v.id IS NULL 
       OR v_latest_v.verification_status NOT IN ('pending', 'verified')
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
IS 'Validates required onboarding fields and confirms face verification in latest attempt before setting is_profile_completed = true';
REVOKE EXECUTE ON FUNCTION public.complete_student_onboarding() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_student_onboarding() FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_student_onboarding() TO authenticated;

-- -----------------------------------------------------------------------------
-- 11. REDEFINE ADMIN VERIFY USER RPC (public.admin_verify_user)
-- Uses deterministic (created_at DESC, id DESC) ordering.
-- Robust rejection logic preserving invariants without manufacturing verification.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_verify_user(TEXT, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.admin_verify_user(TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT);

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
    v_status TEXT;
    v_dp TEXT;
    v_face TEXT;
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

    IF v_latest_rec.verification_status <> 'pending' THEN
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
        v_status := 'verified';
        v_dp := 'verified';
        v_face := 'verified';
        v_reason := NULL;
    ELSE
        -- Must explicitly reject at least one component
        IF NOT p_reject_dp AND NOT p_reject_face THEN
            RAISE EXCEPTION 'Invalid rejection: administrator must specify whether DP, Face, or both are rejected';
        END IF;

        IF p_rejection_reason IS NULL OR trim(p_rejection_reason) = '' THEN
            RAISE EXCEPTION 'Rejection reason is required when rejecting verification';
        END IF;

        -- CRITICAL: Determine new dp and face states without manufacturing a verified state
        -- p_reject_dp = true -> dp = rejected
        -- p_reject_dp = false -> preserve existing/latest DP state
        -- p_reject_face = true -> face = rejected
        -- p_reject_face = false -> preserve existing/latest Face state
        v_dp := CASE 
            WHEN p_reject_dp THEN 'rejected' 
            ELSE COALESCE(v_latest_rec.dp, 'pending') 
        END;

        v_face := CASE 
            WHEN p_reject_face THEN 'rejected' 
            ELSE COALESCE(v_latest_rec.face, 'pending') 
        END;

        -- Invariant safety check:
        -- In rejected status, valid combinations are ONLY:
        -- (dp=rejected AND face=verified), (dp=verified AND face=rejected), (dp=rejected AND face=rejected).
        -- A component cannot remain 'pending' while the overall verification is rejected.
        -- If both components were pending and admin only flagged one, the other cannot silently be verified
        -- nor left pending. Both must be rejected.
        IF v_dp = 'pending' OR v_face = 'pending' THEN
            RAISE EXCEPTION 'Invalid moderation request: cannot leave a component pending while rejecting verification. If neither component has been previously verified, both must be rejected.';
        END IF;

        v_status := 'rejected';
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

    -- 6. Update overall status on public.profiles (without rejection reason or verified_at)
    UPDATE public.profiles
    SET 
        verification_status = v_status,
        updated_at = now()
    WHERE id = v_user_id;

    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id,
        'user_code', v_user_code,
        'verification_id', v_target_verification_id,
        'verification_status', v_status,
        'dp', v_dp,
        'face', v_face,
        'verification_rejection_reason', v_reason
    );
END;
$$;

COMMENT ON FUNCTION public.admin_verify_user(TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) 
IS 'Administrative RPC to approve or reject student verification with independent DP and Face moderation flags and invariant protection';
REVOKE EXECUTE ON FUNCTION public.admin_verify_user(TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_verify_user(TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_verify_user(TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 12. UPDATE ACCOUNT DELETION RPC (public.delete_user_account)
-- -----------------------------------------------------------------------------
-- Reconcile deleted_accounts schema: drop obsolete fields
ALTER TABLE public.deleted_accounts 
    DROP COLUMN IF EXISTS face_verified_at,
    DROP COLUMN IF EXISTS verification_rejection_reason;

ALTER TABLE public.deleted_accounts 
    ALTER COLUMN verification_status SET DEFAULT 'pending';

-- Update delete_user_account() to decouple from dropped profile fields
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

    -- 3. Insert profile data into public.deleted_accounts (without obsolete verification columns)
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

    IF v_archive_id IS NULL THEN
        RAISE EXCEPTION 'Archival failed: could not insert into deleted_accounts';
    END IF;

    -- 4. Delete user from auth.users (cascades to public.verification, public.profiles, etc.)
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

COMMENT ON FUNCTION public.delete_user_account() 
IS 'Atomically archives active profile and cascades user deletion across verification and profiles';
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- -----------------------------------------------------------------------------
-- 13. DROP OBSOLETE VERIFICATION COLUMNS FROM public.profiles
-- Note on profiles.face_verification_path:
-- It is retained strictly as transitional compatibility state for existing frontend code.
-- public.verification is the single source of truth for verification records and paths.
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles 
    DROP COLUMN IF EXISTS face_verified_at,
    DROP COLUMN IF EXISTS verification_rejection_reason;

COMMIT;
