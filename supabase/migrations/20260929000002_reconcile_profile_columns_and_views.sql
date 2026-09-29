-- =============================================================================
-- Migration: 20260929000002_reconcile_profile_columns_and_views.sql
-- Description: Reconciles repository migration chain with live Supabase database.
--              Safely removes unused profile columns (nickname, pronouns, is_day_scholar)
--              if they exist, and explicitly recreates dependent views without CASCADE.
--              Preserves original view security, filters, joins, grants, and column-level privileges.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SAFELY REMOVE EXISTING VIEWS WITHOUT CASCADE
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_matched_profiles;
DROP VIEW IF EXISTS public.v_admin_users;

-- -----------------------------------------------------------------------------
-- 2. DROP OBSOLETE COLUMNS FROM public.profiles (IDEMPOTENT)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
    DROP COLUMN IF EXISTS nickname,
    DROP COLUMN IF EXISTS pronouns,
    DROP COLUMN IF EXISTS is_day_scholar;

-- -----------------------------------------------------------------------------
-- 3. RECREATE public.v_matched_profiles (WITHOUT nickname)
-- -----------------------------------------------------------------------------
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
    -- Gated Social Reveal: NULL until both students have attached the string
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
) AND conn.status = 'connected'
WHERE 
    -- 1. Caller must be an authenticated session
    auth.uid() IS NOT NULL
    -- 2. Target must not be the caller themselves
    AND p.id <> auth.uid()
    -- 3. Legitimate Match Access: Caller and target share an active match that is REVEALED
    AND EXISTS (
        SELECT 1 
        FROM public.matches m
        JOIN public.profiles pa ON pa.id = m.user_a_id
        JOIN public.profiles pb ON pb.id = m.user_b_id
        LEFT JOIN public.events ev ON ev.id = m.event_id
        WHERE (
            (m.user_a_id = auth.uid() AND m.user_b_id = p.id) OR
            (m.user_b_id = auth.uid() AND m.user_a_id = p.id)
        )
        AND m.status = 'active'
        AND (
            m.admin_reveal = true
            OR pa.is_premium = true
            OR pb.is_premium = true
            OR ev.status = 'reveal_phase'
            OR (ev.countdown_target IS NOT NULL AND ev.countdown_target <= now())
        )
    )
    -- 4. Bi-directional Block Exclusion: Neither user has blocked the other
    AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks b
        WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = auth.uid())
    );

COMMENT ON VIEW public.v_matched_profiles IS 'Secure projection exposing sanitized partner profiles exclusively when active match is revealed, excluding unused nickname';
REVOKE ALL ON public.v_matched_profiles FROM PUBLIC;
GRANT SELECT ON public.v_matched_profiles TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RECREATE public.v_admin_users (WITHOUT nickname, pronouns, is_day_scholar)
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
    p.verification_status,
    p.face_verification_path,
    p.face_verified_at,
    p.verification_rejection_reason,
    p.is_premium,
    p.premium_started_at,
    p.premium_expires_at,
    p.onboarding_status,
    p.onboarding_step,
    p.is_profile_completed,
    pp.storage_path AS primary_photo_path,
    act_m.id AS active_match_id,
    act_m.event_id AS active_event_id,
    act_m.match_source,
    act_m.partner_id,
    partner_prof.user_code AS partner_user_code,
    partner_prof.full_name AS partner_full_name,
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
        m.id,
        m.event_id,
        m.match_source,
        m.admin_reveal,
        m.revealed_at,
        CASE WHEN m.user_a_id = p.id THEN m.user_b_id ELSE m.user_a_id END AS partner_id,
        (
            m.admin_reveal = true
            OR p_a.is_premium = true
            OR p_b.is_premium = true
            OR ev.status = 'reveal_phase'
            OR (ev.countdown_target IS NOT NULL AND ev.countdown_target <= now())
        ) AS is_revealed
    FROM public.matches m
    JOIN public.profiles p_a ON p_a.id = m.user_a_id
    JOIN public.profiles p_b ON p_b.id = m.user_b_id
    LEFT JOIN public.events ev ON ev.id = m.event_id
    WHERE (m.user_a_id = p.id OR m.user_b_id = p.id)
      AND m.status = 'active'
    ORDER BY m.matched_at DESC
    LIMIT 1
) act_m ON true
LEFT JOIN public.profiles partner_prof ON partner_prof.id = act_m.partner_id
WHERE public.is_admin() = true;

COMMENT ON VIEW public.v_admin_users IS 'Comprehensive admin master user directory with phone, weight, verification, premium, and assigned match status, excluding unused columns';
REVOKE ALL ON public.v_admin_users FROM PUBLIC;
GRANT SELECT ON public.v_admin_users TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. REVISE COLUMN-LEVEL UPDATE PRIVILEGES ON public.profiles
-- -----------------------------------------------------------------------------
REVOKE UPDATE ON public.profiles FROM PUBLIC;
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;

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
