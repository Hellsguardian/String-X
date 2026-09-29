-- =============================================================================
-- Migration: 20260927000003_matchmaking.sql
-- Description: Matchmaking engine, string connections, and user safety
-- Tables: match_preferences, matches, connections, user_blocks, user_reports
-- Standards: Canonical pair ordering (user_a_id < user_b_id), default unrevealed
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 12. MATCH PREFERENCES
-- Criteria designated by students on Page 13 ("Who do you want to match with?")
-- -----------------------------------------------------------------------------
CREATE TABLE public.match_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    partner_gender_preference TEXT NOT NULL DEFAULT 'Open to Anyone',
    partner_vibe_preference TEXT,
    same_college_only BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_match_pref_gender CHECK (partner_gender_preference IN ('Girls', 'Guys', 'Open to Anyone')),
    CONSTRAINT uq_match_preferences UNIQUE (user_id, event_id)
);

COMMENT ON TABLE public.match_preferences IS 'Student match filtering criteria per festival';

-- -----------------------------------------------------------------------------
-- 13. MATCHES
-- Canonical pairings generated either manually (Phase 1 Admin) or by AI (Phase 2/3).
-- CANONICAL ORDERING: user_a_id < user_b_id prevents duplicate reciprocal pairs.
-- Pair-level reveal: admin_reveal flag and synchronized premium reveal.
-- -----------------------------------------------------------------------------
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_source TEXT NOT NULL DEFAULT 'manual',
    compatibility_score SMALLINT NOT NULL DEFAULT 85,
    compatibility_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    shared_highlights TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active',
    admin_reveal BOOLEAN NOT NULL DEFAULT false,
    revealed_at TIMESTAMPTZ,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_canonical_match_order CHECK (user_a_id < user_b_id),
    CONSTRAINT chk_matches_score CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
    CONSTRAINT chk_matches_source CHECK (match_source IN ('manual', 'ai')),
    CONSTRAINT chk_matches_status CHECK (status IN ('active', 'completed', 'cancelled', 'replaced', 'expired')),
    CONSTRAINT uq_matches_event_users UNIQUE (event_id, user_a_id, user_b_id)
);

COMMENT ON TABLE public.matches IS 'Pairings created via Phase 1 admin manual assignment or Phase 2/3 AI engine. Pair-level reveal and canonical ordering';
COMMENT ON CONSTRAINT chk_canonical_match_order ON public.matches IS 'Enforces deterministic pair order (user_a_id < user_b_id) to eliminate duplicate pairings';
COMMENT ON COLUMN public.matches.match_source IS 'Origin of match: manual (Phase 1 admin) or ai (Phase 2/3 algorithmic matchmaking)';
COMMENT ON COLUMN public.matches.admin_reveal IS 'Manual admin reveal override; immediately unlocks match partner details for both users';
COMMENT ON COLUMN public.matches.status IS 'Lifecycle state: active (current pairing), replaced (superseded by admin reassignment), cancelled, completed, expired';
COMMENT ON COLUMN public.matches.created_by IS 'Admin user ID who created or approved this pairing';

-- -----------------------------------------------------------------------------
-- SINGLE ACTIVE MATCH PER EVENT INTEGRITY TRIGGER
-- Guarantees a student can only be involved in at most one active match per event
-- across both user_a_id and user_b_id canonical positions.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_single_active_match_per_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'active' THEN
        -- Verify user_a has no other active match in this event
        IF EXISTS (
            SELECT 1 FROM public.matches
            WHERE event_id = NEW.event_id
              AND status = 'active'
              AND id <> NEW.id
              AND (user_a_id = NEW.user_a_id OR user_b_id = NEW.user_a_id)
        ) THEN
            RAISE EXCEPTION 'Integrity violation: user % already has an active match for event %', NEW.user_a_id, NEW.event_id;
        END IF;

        -- Verify user_b has no other active match in this event
        IF EXISTS (
            SELECT 1 FROM public.matches
            WHERE event_id = NEW.event_id
              AND status = 'active'
              AND id <> NEW.id
              AND (user_a_id = NEW.user_b_id OR user_b_id = NEW.user_b_id)
        ) THEN
            RAISE EXCEPTION 'Integrity violation: user % already has an active match for event %', NEW.user_b_id, NEW.event_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.check_single_active_match_per_event() IS 'Enforces that each user has at most one active match per event across user_a_id and user_b_id';

DROP TRIGGER IF EXISTS trg_check_single_active_match ON public.matches;
CREATE TRIGGER trg_check_single_active_match
    BEFORE INSERT OR UPDATE OF status, user_a_id, user_b_id, event_id
    ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.check_single_active_match_per_event();

-- -----------------------------------------------------------------------------
-- 14. CONNECTIONS
-- Established "string attached" relationships.
-- Individual reveal flags MUST default to false until both explicitly accept.
-- -----------------------------------------------------------------------------
CREATE TABLE public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_a_revealed BOOLEAN NOT NULL DEFAULT false,
    user_b_revealed BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending',
    connected_at TIMESTAMPTZ,
    unmatched_at TIMESTAMPTZ,
    CONSTRAINT chk_canonical_connection_order CHECK (user_a_id < user_b_id),
    CONSTRAINT chk_connections_status CHECK (status IN ('pending', 'connected', 'declined', 'unmatched')),
    CONSTRAINT uq_connections_match UNIQUE (match_id),
    CONSTRAINT uq_connections_event_users UNIQUE (event_id, user_a_id, user_b_id)
);

COMMENT ON TABLE public.connections IS 'Active string connections. Reveal flags default to false; updated atomically via RPC';

-- -----------------------------------------------------------------------------
-- 15. USER BLOCKS
-- Hard block records preventing pairing, discovery, and communication
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_user_blocks_distinct CHECK (blocker_id <> blocked_id),
    CONSTRAINT uq_user_blocks UNIQUE (blocker_id, blocked_id)
);

COMMENT ON TABLE public.user_blocks IS 'Bi-directional block records for user harassment protection';

-- -----------------------------------------------------------------------------
-- 16. USER REPORTS
-- Safety reports submitted for moderation review
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason_category TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    moderator_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    CONSTRAINT chk_user_reports_distinct CHECK (reporter_id <> reported_id),
    CONSTRAINT chk_user_reports_category CHECK (reason_category IN ('harassment', 'inappropriate_media', 'fake_account', 'other')),
    CONSTRAINT chk_user_reports_status CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed'))
);

COMMENT ON TABLE public.user_reports IS 'Moderation flags submitted by students against suspicious accounts';

-- -----------------------------------------------------------------------------
-- INDEX RECOMMENDATIONS FOR MATCHMAKING & SAFETY
-- -----------------------------------------------------------------------------
CREATE INDEX idx_match_preferences_user_id ON public.match_preferences (user_id);
CREATE INDEX idx_matches_event_user_a ON public.matches (event_id, user_a_id);
CREATE INDEX idx_matches_event_user_b ON public.matches (event_id, user_b_id);
CREATE INDEX idx_matches_active_user_a ON public.matches (event_id, user_a_id) WHERE status = 'active';
CREATE INDEX idx_matches_active_user_b ON public.matches (event_id, user_b_id) WHERE status = 'active';
CREATE INDEX idx_matches_status ON public.matches (status);
CREATE INDEX idx_matches_source ON public.matches (match_source);
CREATE INDEX idx_matches_admin_reveal ON public.matches (admin_reveal);
CREATE INDEX idx_matches_created_by ON public.matches (created_by);
CREATE INDEX idx_connections_match_id ON public.connections (match_id);
CREATE INDEX idx_connections_users ON public.connections (user_a_id, user_b_id);
CREATE INDEX idx_user_blocks_lookup ON public.user_blocks (blocker_id, blocked_id);
CREATE INDEX idx_user_reports_status ON public.user_reports (status);
