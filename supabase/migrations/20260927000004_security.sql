-- =============================================================================
-- Migration: 20260927000004_security.sql
-- Description: Row Level Security, Column-Level Authorization, Secure Views,
--              Atomic Administrative & Student RPCs, and Auth Triggers
-- Standards: OWASP ASVS Level 3, defense-in-depth column privileges,
--            anti-scraping view protection, pair-level synchronized reveal,
--            full admin visibility layer without client data exposure
-- =============================================================================

-- =============================================================================
-- SECTION 1: ADMIN AUTHORIZATION LAYER & ADMIN USERS TABLE
-- Dedicated server-controlled authorization mechanism.
-- Does NOT rely on user-editable profile booleans.
-- Supports database table registry and app_metadata JWT claims.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_users IS 'Authoritative admin user registry. Server-controlled role assignment';

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function to verify admin privileges (SECURITY DEFINER, STABLE)
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

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if authenticated caller is registered in admin_users or possesses verified admin app_metadata claim';

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- Admin Users Table RLS
CREATE POLICY "Admins can view admin_users"
ON public.admin_users FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage admin_users"
ON public.admin_users FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

REVOKE ALL ON public.admin_users FROM PUBLIC;
REVOKE ALL ON public.admin_users FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;

-- =============================================================================
-- SECTION 2: ENABLE ROW LEVEL SECURITY ON ALL PLATFORM TABLES
-- =============================================================================
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_vibe_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 3: RLS POLICIES FOR REFERENCE & ACADEMIC CATALOG
-- =============================================================================

-- Universities: Public read for active campuses
CREATE POLICY "Public read access for active universities"
ON public.universities FOR SELECT
USING (is_active = true);

-- Hostels: Public read for active hostels
CREATE POLICY "Public read access for active hostels"
ON public.hostels FOR SELECT
USING (is_active = true);

-- Courses: Public read for active courses
CREATE POLICY "Public read access for active courses"
ON public.courses FOR SELECT
USING (is_active = true);

-- Interests: Public read for active interest chips
CREATE POLICY "Public read access for active interests"
ON public.interests FOR SELECT
USING (is_active = true);

-- Events: Public read for active campus festivals
CREATE POLICY "Public read access for active events"
ON public.events FOR SELECT
USING (is_active = true);

-- =============================================================================
-- SECTION 4: RLS & COLUMN PRIVILEGES FOR STUDENT IDENTITY & PROFILES
-- =============================================================================

-- 4.1 Profiles RLS Policies: Strict self-access for normal students, full access for admins.
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4.2 Column-Level Authorization on Profiles:
-- CRITICAL SECURITY CONTROL: Normal authenticated clients MUST NOT be able to modify
-- server-controlled security columns: user_code, verification_status, face_verification_path,
-- face_verified_at, verification_rejection_reason, is_premium, premium_started_at,
-- premium_expires_at, onboarding_status, is_profile_completed.
REVOKE UPDATE ON public.profiles FROM PUBLIC;
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;

-- Grant UPDATE strictly on user-editable onboarding and profile attributes:
GRANT UPDATE (
    full_name,
    nickname,
    pronouns,
    gender,
    birth_year,
    university_id,
    hostel_id,
    is_day_scholar,
    course_id,
    study_year,
    home_state,
    height_cm,
    weight_kg,
    instagram_id,
    onboarding_step
) ON public.profiles TO authenticated;

-- 4.3 Profile Photos: Strict owner-only access for students; full read for admins.
CREATE POLICY "Users can read own profile photos"
ON public.profile_photos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profile photos"
ON public.profile_photos FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can manage own photos"
ON public.profile_photos FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4.4 User Interests: Strict owner-only access for students; full read for admins.
CREATE POLICY "Users can read own user interests"
ON public.user_interests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user interests"
ON public.user_interests FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can manage own interests"
ON public.user_interests FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- SECTION 5: RLS POLICIES FOR EVENTS & VIBE PREFERENCES
-- =============================================================================

-- 5.1 Event Registrations: Own-user enrollment for students; full access for admins.
CREATE POLICY "Users can read own event registrations"
ON public.event_registrations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all event registrations"
ON public.event_registrations FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can register own account for events"
ON public.event_registrations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only cancel own registration"
ON public.event_registrations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

CREATE POLICY "Admins can update all event registrations"
ON public.event_registrations FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Column privileges on Event Registrations:
REVOKE UPDATE ON public.event_registrations FROM PUBLIC;
REVOKE UPDATE ON public.event_registrations FROM authenticated;
REVOKE UPDATE ON public.event_registrations FROM anon;
GRANT UPDATE (status) ON public.event_registrations TO authenticated;

-- 5.2 Event Preferences: Strictly owner-only for students; full read for admins.
CREATE POLICY "Users can read own event preferences"
ON public.event_preferences FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.event_registrations r
        WHERE r.id = event_preferences.registration_id
          AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can read all event preferences"
ON public.event_preferences FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can insert own event preferences"
ON public.event_preferences FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.event_registrations r
        WHERE r.id = event_preferences.registration_id
          AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update own event preferences"
ON public.event_preferences FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.event_registrations r
        WHERE r.id = event_preferences.registration_id
          AND r.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.event_registrations r
        WHERE r.id = event_preferences.registration_id
          AND r.user_id = auth.uid()
    )
);

-- 5.3 Event Vibe Tags: Owner-only access via preference ownership; full read for admins.
CREATE POLICY "Users can manage own event vibe tags"
ON public.event_vibe_tags FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.event_preferences ep
        JOIN public.event_registrations r ON r.id = ep.registration_id
        WHERE ep.id = event_vibe_tags.preference_id
          AND r.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.event_preferences ep
        JOIN public.event_registrations r ON r.id = ep.registration_id
        WHERE ep.id = event_vibe_tags.preference_id
          AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all event vibe tags"
ON public.event_vibe_tags FOR SELECT
TO authenticated
USING (public.is_admin());

-- =============================================================================
-- SECTION 6: RLS POLICIES FOR MATCHMAKING, CONNECTIONS & SAFETY
-- =============================================================================

-- 6.1 Match Preferences: Own-user access only; read access for admins
CREATE POLICY "Users can manage own match preferences"
ON public.match_preferences FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all match preferences"
ON public.match_preferences FOR SELECT
TO authenticated
USING (public.is_admin());

-- 6.2 Matches: Read-only for participants; full access for admins.
-- Normal users have NO INSERT, UPDATE, or DELETE permissions.
CREATE POLICY "Participants can view their matches"
ON public.matches FOR SELECT
TO authenticated
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Admins can view all matches"
ON public.matches FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert matches"
ON public.matches FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update matches"
ON public.matches FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete matches"
ON public.matches FOR DELETE
TO authenticated
USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
REVOKE ALL ON public.matches FROM anon;
REVOKE ALL ON public.matches FROM PUBLIC;

-- 6.3 Connections: Participants can view their connection; admins can view all.
-- Reveal mutations MUST invoke the accept_string_connection() RPC below.
CREATE POLICY "Participants can view their connections"
ON public.connections FOR SELECT
TO authenticated
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Admins can view all connections"
ON public.connections FOR SELECT
TO authenticated
USING (public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON public.connections FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.connections FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.connections FROM anon;

-- 6.4 User Blocks: Blocker controls their block list; admins can view all blocks.
CREATE POLICY "Users can manage their block list"
ON public.user_blocks FOR ALL
TO authenticated
USING (auth.uid() = blocker_id)
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Admins can view all blocks"
ON public.user_blocks FOR SELECT
TO authenticated
USING (public.is_admin());

-- 6.5 User Reports: Reporter can submit reports and view own submissions.
-- Admins can view and moderate all reports.
CREATE POLICY "Users can create reports"
ON public.user_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own submitted reports"
ON public.user_reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.user_reports FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update reports"
ON public.user_reports FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.user_reports TO authenticated;
REVOKE DELETE ON public.user_reports FROM PUBLIC;
REVOKE DELETE ON public.user_reports FROM authenticated;
REVOKE ALL ON public.user_reports FROM anon;

-- =============================================================================
-- SECTION 7: REVEAL EVALUATION HELPER FUNCTION
-- Encapsulates the core STRING X reveal rule:
-- A pair is effectively revealed if:
--   1. admin_reveal = true (manual admin override)
--   2. user_a.is_premium = true OR user_b.is_premium = true (synchronized premium)
--   3. event status = 'reveal_phase' OR countdown_target has elapsed
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_match_revealed(p_match_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.matches m
    JOIN public.profiles pa ON pa.id = m.user_a_id
    JOIN public.profiles pb ON pb.id = m.user_b_id
    LEFT JOIN public.events ev ON ev.id = m.event_id
    WHERE m.id = p_match_id
      AND m.status = 'active'
      AND (
        m.admin_reveal = true
        OR pa.is_premium = true
        OR pb.is_premium = true
        OR ev.status = 'reveal_phase'
        OR (ev.countdown_target IS NOT NULL AND ev.countdown_target <= now())
      )
  );
$$;

COMMENT ON FUNCTION public.is_match_revealed(UUID) IS 'Evaluates effective pair reveal: true if admin override, either partner is premium, or event countdown reached';
REVOKE EXECUTE ON FUNCTION public.is_match_revealed(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_match_revealed(UUID) TO authenticated;

-- =============================================================================
-- SECTION 8: SECURE PROJECTION VIEWS
-- =============================================================================

-- 8.1 SECURE PARTNER PROFILE PROJECTION (v_matched_profiles)
-- Anti-scraping protection: strictly returns only legitimate, unblocked partners
-- when the match is in an effectively revealed state.
-- NEVER exposes phone number, weight, private verification data, or internal admin telemetry.
CREATE OR REPLACE VIEW public.v_matched_profiles
WITH (security_barrier = true, security_invoker = false) AS
SELECT 
    p.id,
    p.user_code,
    p.full_name,
    p.nickname,
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

COMMENT ON VIEW public.v_matched_profiles IS 'Secure projection exposing sanitized partner profiles exclusively when active match is revealed (premium on either partner, admin override, or event countdown)';
REVOKE ALL ON public.v_matched_profiles FROM PUBLIC;
GRANT SELECT ON public.v_matched_profiles TO authenticated;

-- 8.2 SECURE USER MATCHES PROJECTION (v_my_matches)
-- Allows a student to see their active match card and pair-level reveal status.
CREATE OR REPLACE VIEW public.v_my_matches
WITH (security_barrier = true, security_invoker = false) AS
SELECT 
    m.id AS match_id,
    m.event_id,
    ev.title AS event_title,
    ev.slug AS event_slug,
    CASE 
        WHEN m.user_a_id = auth.uid() THEN m.user_b_id 
        ELSE m.user_a_id 
    END AS partner_id,
    partner_p.user_code AS partner_user_code,
    (
        m.admin_reveal = true
        OR pa.is_premium = true
        OR pb.is_premium = true
        OR ev.status = 'reveal_phase'
        OR (ev.countdown_target IS NOT NULL AND ev.countdown_target <= now())
    ) AS is_revealed,
    m.compatibility_score,
    m.compatibility_reasons,
    m.shared_highlights,
    m.status,
    m.matched_at,
    CASE 
        WHEN (
            m.admin_reveal = true
            OR pa.is_premium = true
            OR pb.is_premium = true
            OR ev.status = 'reveal_phase'
            OR (ev.countdown_target IS NOT NULL AND ev.countdown_target <= now())
        ) THEN COALESCE(m.revealed_at, m.matched_at)
        ELSE NULL
    END AS effective_revealed_at
FROM public.matches m
JOIN public.events ev ON ev.id = m.event_id
JOIN public.profiles pa ON pa.id = m.user_a_id
JOIN public.profiles pb ON pb.id = m.user_b_id
JOIN public.profiles partner_p ON partner_p.id = (
    CASE WHEN m.user_a_id = auth.uid() THEN m.user_b_id ELSE m.user_a_id END
)
WHERE auth.uid() IS NOT NULL
  AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
  AND m.status = 'active';

COMMENT ON VIEW public.v_my_matches IS 'Secure projection for authenticated students to view their own active match card with synchronized pair-reveal state';
REVOKE ALL ON public.v_my_matches FROM PUBLIC;
GRANT SELECT ON public.v_my_matches TO authenticated;

-- 8.3 SECURE ADMIN MASTER DIRECTORY PROJECTION (v_admin_users)
-- Master user directory accessible EXCLUSIVELY to verified administrators.
-- Contains complete user records: phone (from auth.users), weight, verification, premium,
-- and current assigned match and reveal status.
CREATE OR REPLACE VIEW public.v_admin_users
WITH (security_barrier = true, security_invoker = false) AS
SELECT 
    p.id,
    p.user_code,
    u_auth.phone,
    p.full_name,
    p.nickname,
    p.gender,
    p.pronouns,
    p.birth_year,
    (EXTRACT(YEAR FROM CURRENT_DATE) - p.birth_year)::smallint AS age,
    p.university_id,
    univ.name AS university_name,
    univ.campus_code AS university_code,
    p.hostel_id,
    h.name AS hostel_name,
    p.is_day_scholar,
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

COMMENT ON VIEW public.v_admin_users IS 'Comprehensive admin master user directory with phone, weight, verification, premium, and assigned match status';
REVOKE ALL ON public.v_admin_users FROM PUBLIC;
GRANT SELECT ON public.v_admin_users TO authenticated;

-- =============================================================================
-- SECTION 9: ADMINISTRATIVE & STUDENT STORED PROCEDURES (RPCS)
-- =============================================================================

-- 9.1 ADMIN MANUAL MATCH ASSIGNMENT RPC (admin_assign_match)
-- Assigns a manual pairing between two users using user_code (e.g. SX001 <-> SX002) or UUID.
-- Enforces canonical order (user_a_id < user_b_id) and single active match integrity.
CREATE OR REPLACE FUNCTION public.admin_assign_match(
    p_event_id UUID,
    p_user_1_code TEXT,
    p_user_2_code TEXT,
    p_score SMALLINT DEFAULT 85,
    p_reasons JSONB DEFAULT '[]'::jsonb,
    p_highlights TEXT[] DEFAULT '{}'::text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_u1_id UUID;
    v_u2_id UUID;
    v_user_a_id UUID;
    v_user_b_id UUID;
    v_match_id UUID;
    v_p1_code TEXT;
    v_p2_code TEXT;
BEGIN
    -- 1. Enforce admin privilege
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: caller does not have administrative privileges';
    END IF;

    -- 2. Resolve User 1
    SELECT id, user_code INTO v_u1_id, v_p1_code 
    FROM public.profiles 
    WHERE user_code = upper(trim(p_user_1_code)) OR id::text = trim(p_user_1_code);

    IF v_u1_id IS NULL THEN
        RAISE EXCEPTION 'User 1 not found: %', p_user_1_code;
    END IF;

    -- 3. Resolve User 2
    SELECT id, user_code INTO v_u2_id, v_p2_code 
    FROM public.profiles 
    WHERE user_code = upper(trim(p_user_2_code)) OR id::text = trim(p_user_2_code);

    IF v_u2_id IS NULL THEN
        RAISE EXCEPTION 'User 2 not found: %', p_user_2_code;
    END IF;

    -- 4. Disallow self-matching
    IF v_u1_id = v_u2_id THEN
        RAISE EXCEPTION 'Cannot match a user with themselves: %', v_p1_code;
    END IF;

    -- 5. Canonical ordering (user_a_id < user_b_id)
    v_user_a_id := LEAST(v_u1_id, v_u2_id);
    v_user_b_id := GREATEST(v_u1_id, v_u2_id);

    -- 6. Insert canonical match row (or reactivate existing pair)
    INSERT INTO public.matches (
        event_id,
        user_a_id,
        user_b_id,
        match_source,
        compatibility_score,
        compatibility_reasons,
        shared_highlights,
        status,
        created_by
    ) VALUES (
        p_event_id,
        v_user_a_id,
        v_user_b_id,
        'manual',
        p_score,
        p_reasons,
        p_highlights,
        'active',
        auth.uid()
    )
    ON CONFLICT (event_id, user_a_id, user_b_id) DO UPDATE SET
        match_source = 'manual',
        compatibility_score = EXCLUDED.compatibility_score,
        compatibility_reasons = EXCLUDED.compatibility_reasons,
        shared_highlights = EXCLUDED.shared_highlights,
        status = 'active',
        updated_at = now()
    RETURNING id INTO v_match_id;

    RETURN json_build_object(
        'success', true,
        'match_id', v_match_id,
        'event_id', p_event_id,
        'user_a_id', v_user_a_id,
        'user_b_id', v_user_b_id,
        'user_1_code', v_p1_code,
        'user_2_code', v_p2_code,
        'status', 'active'
    );
END;
$$;

COMMENT ON FUNCTION public.admin_assign_match IS 'Admin RPC for manual pairing using user_codes (e.g. SX001 <-> SX002) with canonical ordering and single active match integrity';
REVOKE EXECUTE ON FUNCTION public.admin_assign_match FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_assign_match TO authenticated;

-- 9.2 ADMIN MATCH REASSIGNMENT RPC (admin_reassign_match)
-- Safely supersedes an existing pairing: sets old match status to 'replaced'
-- and atomically creates a new active pairing with the new partner.
CREATE OR REPLACE FUNCTION public.admin_reassign_match(
    p_event_id UUID,
    p_old_match_id UUID,
    p_new_partner_code TEXT,
    p_score SMALLINT DEFAULT 85,
    p_reasons JSONB DEFAULT '[]'::jsonb,
    p_highlights TEXT[] DEFAULT '{}'::text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_old_match RECORD;
    v_target_user_id UUID;
    v_new_partner_id UUID;
    v_user_a_id UUID;
    v_user_b_id UUID;
    v_new_match_id UUID;
BEGIN
    -- 1. Enforce admin privilege
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: caller does not have administrative privileges';
    END IF;

    -- 2. Lock and retrieve old match
    SELECT * INTO v_old_match 
    FROM public.matches 
    WHERE id = p_old_match_id AND event_id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Old match record not found: %', p_old_match_id;
    END IF;

    -- 3. Resolve new partner
    SELECT id INTO v_new_partner_id 
    FROM public.profiles 
    WHERE user_code = upper(trim(p_new_partner_code)) OR id::text = trim(p_new_partner_code);

    IF v_new_partner_id IS NULL THEN
        RAISE EXCEPTION 'New partner not found: %', p_new_partner_code;
    END IF;

    -- In reassigning, user_a keeps their spot and gets new partner (or vice versa)
    v_target_user_id := v_old_match.user_a_id;
    IF v_target_user_id = v_new_partner_id THEN
        v_target_user_id := v_old_match.user_b_id;
    END IF;

    IF v_target_user_id = v_new_partner_id THEN
        RAISE EXCEPTION 'Cannot reassign user to themselves';
    END IF;

    -- 4. Mark old match as replaced (preserves history, frees active match slot)
    UPDATE public.matches
    SET status = 'replaced', updated_at = now()
    WHERE id = p_old_match_id;

    -- 5. Canonical ordering
    v_user_a_id := LEAST(v_target_user_id, v_new_partner_id);
    v_user_b_id := GREATEST(v_target_user_id, v_new_partner_id);

    -- 6. Insert new canonical match (or reactivate existing pair)
    INSERT INTO public.matches (
        event_id,
        user_a_id,
        user_b_id,
        match_source,
        compatibility_score,
        compatibility_reasons,
        shared_highlights,
        status,
        created_by
    ) VALUES (
        p_event_id,
        v_user_a_id,
        v_user_b_id,
        'manual',
        p_score,
        p_reasons,
        p_highlights,
        'active',
        auth.uid()
    )
    ON CONFLICT (event_id, user_a_id, user_b_id) DO UPDATE SET
        match_source = 'manual',
        compatibility_score = EXCLUDED.compatibility_score,
        compatibility_reasons = EXCLUDED.compatibility_reasons,
        shared_highlights = EXCLUDED.shared_highlights,
        status = 'active',
        updated_at = now()
    RETURNING id INTO v_new_match_id;

    RETURN json_build_object(
        'success', true,
        'old_match_id', p_old_match_id,
        'new_match_id', v_new_match_id,
        'status', 'active'
    );
END;
$$;

COMMENT ON FUNCTION public.admin_reassign_match IS 'Admin RPC for safely reassigning a match: transitions old match to replaced and creates new canonical active pairing';
REVOKE EXECUTE ON FUNCTION public.admin_reassign_match FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reassign_match TO authenticated;

-- 9.3 ADMIN REVEAL OVERRIDE RPC (admin_set_match_reveal)
-- Admin can toggle manual reveal on any match. Immediately unlocks match partner for both users.
CREATE OR REPLACE FUNCTION public.admin_set_match_reveal(
    p_match_id UUID,
    p_reveal BOOLEAN
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    -- 1. Enforce admin privilege
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: caller does not have administrative privileges';
    END IF;

    -- 2. Update match reveal override
    UPDATE public.matches
    SET 
        admin_reveal = p_reveal,
        revealed_at = CASE WHEN p_reveal THEN COALESCE(revealed_at, now()) ELSE NULL END,
        updated_at = now()
    WHERE id = p_match_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match not found: %', p_match_id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'match_id', p_match_id,
        'admin_reveal', p_reveal
    );
END;
$$;

COMMENT ON FUNCTION public.admin_set_match_reveal IS 'Admin RPC to manually toggle admin reveal override on a match';
REVOKE EXECUTE ON FUNCTION public.admin_set_match_reveal FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_match_reveal TO authenticated;

-- 9.4 ADMIN PREMIUM MANAGEMENT RPC (admin_set_user_premium)
-- Admin can grant or revoke premium status for a user by user_code or UUID.
CREATE OR REPLACE FUNCTION public.admin_set_user_premium(
    p_user_code_or_id TEXT,
    p_is_premium BOOLEAN,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
BEGIN
    -- 1. Enforce admin privilege
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: caller does not have administrative privileges';
    END IF;

    -- 2. Update profile premium status
    UPDATE public.profiles
    SET 
        is_premium = p_is_premium,
        premium_started_at = CASE WHEN p_is_premium THEN COALESCE(premium_started_at, now()) ELSE NULL END,
        premium_expires_at = p_expires_at,
        updated_at = now()
    WHERE user_code = upper(trim(p_user_code_or_id)) OR id::text = trim(p_user_code_or_id)
    RETURNING * INTO v_profile;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found: %', p_user_code_or_id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'user_id', v_profile.id,
        'user_code', v_profile.user_code,
        'is_premium', v_profile.is_premium,
        'premium_started_at', v_profile.premium_started_at,
        'premium_expires_at', v_profile.premium_expires_at
    );
END;
$$;

COMMENT ON FUNCTION public.admin_set_user_premium IS 'Admin RPC to grant or revoke premium status for a student by user_code or UUID';
REVOKE EXECUTE ON FUNCTION public.admin_set_user_premium FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_premium TO authenticated;

-- 9.5 ADMIN USER VERIFICATION RPC (admin_verify_user)
-- Admin can approve or reject face verification for a student.
CREATE OR REPLACE FUNCTION public.admin_verify_user(
    p_user_code_or_id TEXT,
    p_verified BOOLEAN,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: caller does not have administrative privileges';
    END IF;

    UPDATE public.profiles
    SET 
        verification_status = CASE WHEN p_verified THEN 'verified' ELSE 'failed' END,
        face_verified_at = CASE WHEN p_verified THEN now() ELSE NULL END,
        verification_rejection_reason = CASE WHEN p_verified THEN NULL ELSE p_rejection_reason END,
        updated_at = now()
    WHERE user_code = upper(trim(p_user_code_or_id)) OR id::text = trim(p_user_code_or_id)
    RETURNING * INTO v_profile;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found: %', p_user_code_or_id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'user_id', v_profile.id,
        'user_code', v_profile.user_code,
        'verification_status', v_profile.verification_status
    );
END;
$$;

COMMENT ON FUNCTION public.admin_verify_user IS 'Admin RPC to approve or reject face selfie verification for a student';
REVOKE EXECUTE ON FUNCTION public.admin_verify_user FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_verify_user TO authenticated;

-- 9.6 CONNECTION REVEAL RPC (accept_string_connection)
-- Row-level locking (FOR UPDATE) prevents race conditions under concurrent acceptance.
CREATE OR REPLACE FUNCTION public.accept_string_connection(p_connection_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_conn RECORD;
    v_is_user_a BOOLEAN;
    v_is_user_b BOOLEAN;
    v_both_revealed BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_conn 
    FROM public.connections 
    WHERE id = p_connection_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Connection not found';
    END IF;
    
    v_is_user_a := (v_conn.user_a_id = auth.uid());
    v_is_user_b := (v_conn.user_b_id = auth.uid());
    
    IF NOT (v_is_user_a OR v_is_user_b) THEN
        RAISE EXCEPTION 'Access denied: caller is not a participant in this connection';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.user_blocks 
        WHERE (blocker_id = v_conn.user_a_id AND blocked_id = v_conn.user_b_id)
           OR (blocker_id = v_conn.user_b_id AND blocked_id = v_conn.user_a_id)
    ) THEN
        RAISE EXCEPTION 'Action blocked: connection is restricted by block policy';
    END IF;

    IF v_is_user_a THEN
        UPDATE public.connections 
        SET user_a_revealed = true 
        WHERE id = p_connection_id;
    ELSE
        UPDATE public.connections 
        SET user_b_revealed = true 
        WHERE id = p_connection_id;
    END IF;

    SELECT * INTO v_conn 
    FROM public.connections 
    WHERE id = p_connection_id;

    v_both_revealed := (v_conn.user_a_revealed AND v_conn.user_b_revealed);

    IF v_both_revealed AND v_conn.status <> 'connected' THEN
        UPDATE public.connections 
        SET status = 'connected', 
            connected_at = now() 
        WHERE id = p_connection_id;
    END IF;

    RETURN json_build_object(
        'success', true, 
        'is_connected', v_both_revealed,
        'user_a_revealed', v_conn.user_a_revealed,
        'user_b_revealed', v_conn.user_b_revealed
    );
END;
$$;

COMMENT ON FUNCTION public.accept_string_connection(UUID) IS 'Atomically accepts a string connection with row-level locking (FOR UPDATE) and transitions to connected when both agree';
REVOKE EXECUTE ON FUNCTION public.accept_string_connection(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_string_connection(UUID) TO authenticated;

-- 9.7 FACE VERIFICATION SUBMISSION RPC (submit_face_verification)
CREATE OR REPLACE FUNCTION public.submit_face_verification(p_storage_path TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_expected_prefix TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_expected_prefix := auth.uid()::text || '/';

    IF p_storage_path IS NULL OR NOT (p_storage_path LIKE v_expected_prefix || '%') THEN
        RAISE EXCEPTION 'Invalid storage path: must reside in user folder %', v_expected_prefix;
    END IF;

    UPDATE public.profiles
    SET 
        face_verification_path = p_storage_path,
        verification_status = 'pending',
        updated_at = now()
    WHERE id = auth.uid();

    RETURN json_build_object(
        'success', true,
        'verification_status', 'pending'
    );
END;
$$;

COMMENT ON FUNCTION public.submit_face_verification(TEXT) IS 'Submits face verification selfie for biometric review. Sets verification_status to pending only';
REVOKE EXECUTE ON FUNCTION public.submit_face_verification(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_face_verification(TEXT) TO authenticated;

-- 9.8 ONBOARDING COMPLETION RPC (complete_student_onboarding)
CREATE OR REPLACE FUNCTION public.complete_student_onboarding()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
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

    IF v_profile.face_verification_path IS NULL THEN
        RAISE EXCEPTION 'Cannot complete onboarding: face verification selfie is required';
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

COMMENT ON FUNCTION public.complete_student_onboarding() IS 'Validates all required student profile fields before atomically setting is_profile_completed = true';
REVOKE EXECUTE ON FUNCTION public.complete_student_onboarding() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_student_onboarding() TO authenticated;

-- 9.9 CANCEL EVENT REGISTRATION RPC (cancel_event_registration)
CREATE OR REPLACE FUNCTION public.cancel_event_registration(p_event_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    UPDATE public.event_registrations
    SET status = 'cancelled'
    WHERE event_id = p_event_id AND user_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration not found or already cancelled';
    END IF;

    RETURN json_build_object('success', true, 'status', 'cancelled');
END;
$$;

COMMENT ON FUNCTION public.cancel_event_registration(UUID) IS 'Cancels caller event registration. Setting status to checked_in is denied to clients';
REVOKE EXECUTE ON FUNCTION public.cancel_event_registration(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_event_registration(UUID) TO authenticated;

-- =============================================================================
-- SECTION 10: AUTH TRIGGER (handle_new_user)
-- Initializes profile stub upon SMS OTP verification with auto-generated user_code.
-- ZERO PHONE DUPLICATION: auth.users.phone remains single source of truth.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, onboarding_status, onboarding_step)
    VALUES (new.id, 'in_progress', 1)
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function creating minimal profile stub on new auth user creation with auto-generated user_code';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
