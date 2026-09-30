-- =============================================================================
-- Migration: 20261001000001_event_registration_match_sync.sql
-- Description: Phase 2 Matching Implementation:
--   1. Adds matched_with column to public.event_registrations referencing profiles(user_code)
--   2. Adds partial unique index preventing multi-matches on same partner in event
--   3. Implements public.sync_event_registration_match() trigger function
--   4. Creates trg_sync_event_registration_match for automatic 2-way sync
--   5. Synchronizes canonical matches (LEAST/GREATEST) and connections rows
--   6. Safely handles reassignments, partner collisions, clearing, and self-match rejection
--   7. Updates public.v_admin_users to expose registered_matched_with
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADD matched_with COLUMN TO public.event_registrations
-- -----------------------------------------------------------------------------
ALTER TABLE public.event_registrations
    ADD COLUMN IF NOT EXISTS matched_with TEXT
    REFERENCES public.profiles(user_code)
    ON DELETE SET NULL;

COMMENT ON COLUMN public.event_registrations.matched_with IS 'Admin-assigned partner user_code (e.g. SX005) for event matching. Automatically synced reciprocal pairings and canonical matches.';

-- -----------------------------------------------------------------------------
-- 2. PARTIAL UNIQUE INDEX (ONE REGISTRATION PER PARTNER IN EVENT)
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_event_registrations_matched_with
    ON public.event_registrations (event_id, matched_with)
    WHERE matched_with IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. SYNCHRONIZATION FUNCTION FOR EVENT REGISTRATIONS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_event_registration_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_1_code TEXT;
    v_target_user_id UUID;
    v_target_user_code TEXT;
    v_target_reg RECORD;
    v_old_partner_id UUID;
    v_target_old_partner_id UUID;
    v_user_a_id UUID;
    v_user_b_id UUID;
    v_match_id UUID;
BEGIN
    -- 1. Recursion protection: only execute orchestration at depth 1
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    -- 2. Normalize matched_with (uppercase, trimmed; empty string becomes NULL)
    IF NEW.matched_with IS NOT NULL THEN
        NEW.matched_with := upper(trim(NEW.matched_with));
        IF NEW.matched_with = '' THEN
            NEW.matched_with := NULL;
        END IF;
    END IF;

    -- 3. If matched_with hasn't changed on UPDATE, exit early
    IF TG_OP = 'UPDATE' AND (NEW.matched_with IS NOT DISTINCT FROM OLD.matched_with) THEN
        RETURN NEW;
    END IF;

    -- 4. Resolve the user_code of User 1 (the current registrant)
    SELECT user_code INTO v_user_1_code
    FROM public.profiles
    WHERE id = NEW.user_id;

    IF v_user_1_code IS NULL THEN
        RAISE EXCEPTION 'Registrant profile not found for user_id: %', NEW.user_id;
    END IF;

    -- =========================================================================
    -- CASE A: CLEARING MATCH (NEW.matched_with IS NULL)
    -- =========================================================================
    IF NEW.matched_with IS NULL THEN
        IF TG_OP = 'UPDATE' AND OLD.matched_with IS NOT NULL THEN
            -- Resolve old partner user ID
            SELECT id INTO v_old_partner_id
            FROM public.profiles
            WHERE user_code = OLD.matched_with;

            -- Reciprocally clear old partner's registration if still pointing back to User 1
            IF v_old_partner_id IS NOT NULL THEN
                UPDATE public.event_registrations
                SET matched_with = NULL
                WHERE event_id = NEW.event_id
                  AND user_id = v_old_partner_id
                  AND matched_with = v_user_1_code;

                v_user_a_id := LEAST(NEW.user_id, v_old_partner_id);
                v_user_b_id := GREATEST(NEW.user_id, v_old_partner_id);

                -- Cancel active matches between this pair
                UPDATE public.matches
                SET status = 'cancelled', updated_at = now()
                WHERE event_id = NEW.event_id
                  AND user_a_id = v_user_a_id
                  AND user_b_id = v_user_b_id
                  AND status = 'active';

                -- Update connection to unmatched
                UPDATE public.connections
                SET status = 'unmatched', unmatched_at = now()
                WHERE event_id = NEW.event_id
                  AND user_a_id = v_user_a_id
                  AND user_b_id = v_user_b_id;
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    -- =========================================================================
    -- CASE B: ASSIGNING OR REASSIGNING MATCH (NEW.matched_with IS NOT NULL)
    -- =========================================================================

    -- Validation 1: Prevent self-matching
    IF NEW.matched_with = v_user_1_code THEN
        RAISE EXCEPTION 'Self-matching is not permitted: user % cannot match with themselves', v_user_1_code;
    END IF;

    -- Validation 2: Target partner profile exists in public.profiles
    SELECT id, user_code INTO v_target_user_id, v_target_user_code
    FROM public.profiles
    WHERE user_code = NEW.matched_with;

    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target partner % does not exist in profiles', NEW.matched_with;
    END IF;

    IF v_target_user_id = NEW.user_id THEN
        RAISE EXCEPTION 'Self-matching is not permitted: user % cannot match with themselves', v_user_1_code;
    END IF;

    -- Validation 3: Target partner is registered for the SAME event
    SELECT id, user_id, matched_with INTO v_target_reg
    FROM public.event_registrations
    WHERE event_id = NEW.event_id
      AND user_id = v_target_user_id;

    IF v_target_reg.id IS NULL THEN
        RAISE EXCEPTION 'Target partner % is not registered for event %', NEW.matched_with, NEW.event_id;
    END IF;

    -- -------------------------------------------------------------------------
    -- Safe Retirement / Collision Handling
    -- -------------------------------------------------------------------------

    -- 1. Retire User 1's previous active partner if reassigned
    IF TG_OP = 'UPDATE' AND OLD.matched_with IS NOT NULL AND OLD.matched_with <> NEW.matched_with THEN
        SELECT id INTO v_old_partner_id
        FROM public.profiles
        WHERE user_code = OLD.matched_with;

        IF v_old_partner_id IS NOT NULL THEN
            UPDATE public.event_registrations
            SET matched_with = NULL
            WHERE event_id = NEW.event_id
              AND user_id = v_old_partner_id;

            UPDATE public.matches
            SET status = 'replaced', updated_at = now()
            WHERE event_id = NEW.event_id
              AND status = 'active'
              AND ((user_a_id = NEW.user_id AND user_b_id = v_old_partner_id)
                OR (user_b_id = NEW.user_id AND user_a_id = v_old_partner_id));

            UPDATE public.connections
            SET status = 'unmatched', unmatched_at = now()
            WHERE event_id = NEW.event_id
              AND ((user_a_id = NEW.user_id AND user_b_id = v_old_partner_id)
                OR (user_b_id = NEW.user_id AND user_a_id = v_old_partner_id));
        END IF;
    END IF;

    -- 2. Retire Target Partner's previous active partner if target was already matched with someone else
    IF v_target_reg.matched_with IS NOT NULL AND v_target_reg.matched_with <> v_user_1_code THEN
        SELECT id INTO v_target_old_partner_id
        FROM public.profiles
        WHERE user_code = v_target_reg.matched_with;

        IF v_target_old_partner_id IS NOT NULL THEN
            UPDATE public.event_registrations
            SET matched_with = NULL
            WHERE event_id = NEW.event_id
              AND user_id = v_target_old_partner_id;

            UPDATE public.matches
            SET status = 'replaced', updated_at = now()
            WHERE event_id = NEW.event_id
              AND status = 'active'
              AND ((user_a_id = v_target_user_id AND user_b_id = v_target_old_partner_id)
                OR (user_b_id = v_target_user_id AND user_a_id = v_target_old_partner_id));

            UPDATE public.connections
            SET status = 'unmatched', unmatched_at = now()
            WHERE event_id = NEW.event_id
              AND ((user_a_id = v_target_user_id AND user_b_id = v_target_old_partner_id)
                OR (user_b_id = v_target_user_id AND user_a_id = v_target_old_partner_id));
        END IF;
    END IF;

    -- 3. Clear any existing registrations pointing to NEW.matched_with or v_user_1_code to guarantee partial unique index
    UPDATE public.event_registrations
    SET matched_with = NULL
    WHERE event_id = NEW.event_id
      AND id <> NEW.id
      AND id <> v_target_reg.id
      AND (matched_with = NEW.matched_with OR matched_with = v_user_1_code);

    -- 4. Retire any other active matches for either participant in this event to respect trg_check_single_active_match
    v_user_a_id := LEAST(NEW.user_id, v_target_user_id);
    v_user_b_id := GREATEST(NEW.user_id, v_target_user_id);

    UPDATE public.matches
    SET status = 'replaced', updated_at = now()
    WHERE event_id = NEW.event_id
      AND status = 'active'
      AND (
          (user_a_id IN (NEW.user_id, v_target_user_id) AND NOT (user_a_id = v_user_a_id AND user_b_id = v_user_b_id))
          OR (user_b_id IN (NEW.user_id, v_target_user_id) AND NOT (user_a_id = v_user_a_id AND user_b_id = v_user_b_id))
      );

    -- -------------------------------------------------------------------------
    -- Reciprocal Registration Update
    -- -------------------------------------------------------------------------
    UPDATE public.event_registrations
    SET matched_with = v_user_1_code
    WHERE id = v_target_reg.id
      AND (matched_with IS DISTINCT FROM v_user_1_code);

    -- -------------------------------------------------------------------------
    -- Canonical Match & Connection Upsert
    -- -------------------------------------------------------------------------
    INSERT INTO public.matches (
        event_id,
        user_a_id,
        user_b_id,
        match_source,
        compatibility_score,
        compatibility_reasons,
        shared_highlights,
        status,
        matched_at,
        created_by
    ) VALUES (
        NEW.event_id,
        v_user_a_id,
        v_user_b_id,
        'manual',
        85,
        '[]'::jsonb,
        '{}'::text[],
        'active',
        now(),
        auth.uid()
    )
    ON CONFLICT (event_id, user_a_id, user_b_id) DO UPDATE SET
        match_source = 'manual',
        status = 'active',
        matched_at = now(),
        updated_at = now()
    RETURNING id INTO v_match_id;

    INSERT INTO public.connections (
        match_id,
        event_id,
        user_a_id,
        user_b_id,
        user_a_revealed,
        user_b_revealed,
        status
    ) VALUES (
        v_match_id,
        NEW.event_id,
        v_user_a_id,
        v_user_b_id,
        false,
        false,
        'pending'
    )
    ON CONFLICT (match_id) DO UPDATE SET
        status = 'pending',
        user_a_revealed = false,
        user_b_revealed = false,
        unmatched_at = NULL;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_event_registration_match() IS 'Synchronizes reciprocal event_registrations.matched_with assignments and maintains canonical matches and connections records';

-- Function execution privilege protection
REVOKE EXECUTE ON FUNCTION public.sync_event_registration_match() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_event_registration_match() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_event_registration_match() FROM authenticated;

-- -----------------------------------------------------------------------------
-- 4. CREATE TRIGGER ON public.event_registrations
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_event_registration_match ON public.event_registrations;
CREATE TRIGGER trg_sync_event_registration_match
    BEFORE INSERT OR UPDATE OF matched_with
    ON public.event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_event_registration_match();

-- -----------------------------------------------------------------------------
-- 5. UPDATE public.v_admin_users TO EXPOSE registered_matched_with
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
LEFT JOIN LATERAL (
    SELECT er.matched_with
    FROM public.event_registrations er
    WHERE er.user_id = p.id
    ORDER BY er.registered_at DESC
    LIMIT 1
) act_reg ON true
WHERE public.is_admin() = true;

COMMENT ON VIEW public.v_admin_users IS 'Comprehensive admin master user directory with phone, weight, verification, premium, assigned match, and registered_matched_with status';
REVOKE ALL ON public.v_admin_users FROM PUBLIC;
GRANT SELECT ON public.v_admin_users TO authenticated;
