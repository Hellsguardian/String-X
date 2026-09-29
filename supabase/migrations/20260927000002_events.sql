-- =============================================================================
-- Migration: 20260927000002_events.sql
-- Description: Campus event management and festival vibe engine
-- Tables: events, event_registrations, event_preferences, event_vibe_tags
-- Standards: Explicit event participation (no auto-registration on browse)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 8. EVENTS
-- Master registry of campus festivals and gatherings (e.g. Navratri 2026)
-- -----------------------------------------------------------------------------
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT,
    short_desc TEXT,
    university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'cultural',
    emoji TEXT NOT NULL DEFAULT '🪩',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    countdown_target TIMESTAMPTZ,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_events_slug UNIQUE (slug),
    CONSTRAINT chk_events_category CHECK (category IN ('cultural', 'techfest', 'sports', 'social')),
    CONSTRAINT chk_events_status CHECK (status IN ('upcoming', 'active', 'reveal_phase', 'completed'))
);

COMMENT ON TABLE public.events IS 'Master catalog of campus events and multi-night festivals';
COMMENT ON COLUMN public.events.countdown_target IS 'Timestamp when the countdown timer ends and match reveals unlock';

-- -----------------------------------------------------------------------------
-- 9. EVENT REGISTRATIONS
-- Explicit enrollment into a festival. Page 12 visits DO NOT auto-register.
-- -----------------------------------------------------------------------------
CREATE TABLE public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_event_registrations_status CHECK (status IN ('registered', 'checked_in', 'cancelled')),
    CONSTRAINT uq_event_registrations UNIQUE (event_id, user_id)
);

COMMENT ON TABLE public.event_registrations IS 'Student registration records. Created strictly when user taps CTA on Page 12';

-- -----------------------------------------------------------------------------
-- 10. EVENT PREFERENCES
-- Festival questionnaire responses (Pages 15–20). Kept separate from profiles.
-- -----------------------------------------------------------------------------
CREATE TABLE public.event_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
    favourite_evening_spot TEXT,
    navratri_excitement SMALLINT DEFAULT 50,
    garba_level TEXT,
    garba_energy TEXT,
    answer_last_round TEXT,
    answer_persona TEXT,
    answer_partner_new_step TEXT,
    is_submitted BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_event_preferences_reg UNIQUE (registration_id),
    CONSTRAINT chk_event_pref_excitement CHECK (navratri_excitement IS NULL OR (navratri_excitement >= 0 AND navratri_excitement <= 100))
);

COMMENT ON TABLE public.event_preferences IS 'Festival questionnaire telemetry. Kept private to registrant to avoid profile bloat';

-- -----------------------------------------------------------------------------
-- 11. EVENT VIBE TAGS
-- Junction table for multi-selected festival excitement chips (Page 18)
-- -----------------------------------------------------------------------------
CREATE TABLE public.event_vibe_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preference_id UUID NOT NULL REFERENCES public.event_preferences(id) ON DELETE CASCADE,
    vibe_tag TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_event_vibe_tags UNIQUE (preference_id, vibe_tag)
);

COMMENT ON TABLE public.event_vibe_tags IS 'Multi-selected vibe chips chosen by student during event onboarding';

-- -----------------------------------------------------------------------------
-- INDEX RECOMMENDATIONS FOR EVENT SCHEMA
-- -----------------------------------------------------------------------------
CREATE INDEX idx_events_slug ON public.events (slug);
CREATE INDEX idx_events_status ON public.events (status, is_active);
CREATE INDEX idx_event_registrations_event_user ON public.event_registrations (event_id, user_id);
CREATE INDEX idx_event_registrations_user_id ON public.event_registrations (user_id);
CREATE INDEX idx_event_preferences_registration_id ON public.event_preferences (registration_id);
CREATE INDEX idx_event_vibe_tags_preference_id ON public.event_vibe_tags (preference_id);
