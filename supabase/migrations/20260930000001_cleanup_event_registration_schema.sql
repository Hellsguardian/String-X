-- =============================================================================
-- Migration: 20260930000001_cleanup_event_registration_schema.sql
-- Description: Phase 1 Database Cleanup:
--   1. Safely removes obsolete junction table public.event_vibe_tags
--   2. Safely removes public.match_preferences (inlined to event_preferences)
--   3. Inlines partner_gender_preference into public.event_preferences
--   4. Adds most_excited_1, most_excited_2, most_excited_3 columns
--   5. Drops unused tracking columns: is_submitted, submitted_at, updated_at
--   6. Preserves created_at, foreign keys, and existing RLS policies on event_preferences
--   7. Leaves public.interests and public.user_interests untouched
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SAFELY REMOVE OBSOLETE TABLES
-- -----------------------------------------------------------------------------

-- Drop index and table for event_vibe_tags
DROP INDEX IF EXISTS public.idx_event_vibe_tags_preference_id;
DROP TABLE IF EXISTS public.event_vibe_tags;

-- Drop index and table for match_preferences
DROP INDEX IF EXISTS public.idx_match_preferences_user_id;
DROP TABLE IF EXISTS public.match_preferences;

-- -----------------------------------------------------------------------------
-- 2. ALTER public.event_preferences
-- -----------------------------------------------------------------------------

-- 2.1 Add partner_gender_preference with default 'Open to Anyone'
ALTER TABLE public.event_preferences
    ADD COLUMN IF NOT EXISTS partner_gender_preference TEXT NOT NULL DEFAULT 'Open to Anyone';

-- Apply check constraint if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_event_pref_gender' 
          AND conrelid = 'public.event_preferences'::regclass
    ) THEN
        ALTER TABLE public.event_preferences
            ADD CONSTRAINT chk_event_pref_gender 
            CHECK (partner_gender_preference IN ('Girls', 'Guys', 'Open to Anyone'));
    END IF;
END $$;

-- 2.2 Add the three 'Most excited about' option columns
ALTER TABLE public.event_preferences
    ADD COLUMN IF NOT EXISTS most_excited_1 TEXT,
    ADD COLUMN IF NOT EXISTS most_excited_2 TEXT,
    ADD COLUMN IF NOT EXISTS most_excited_3 TEXT;

-- 2.3 Drop obsolete submission and update columns
ALTER TABLE public.event_preferences
    DROP COLUMN IF EXISTS is_submitted,
    DROP COLUMN IF EXISTS submitted_at,
    DROP COLUMN IF EXISTS updated_at;

-- -----------------------------------------------------------------------------
-- 3. SCHEMA DOCUMENTATION & COMMENTS
-- -----------------------------------------------------------------------------
COMMENT ON TABLE public.event_preferences IS 'Consolidated festival questionnaire telemetry and partner preferences per event registration';
COMMENT ON COLUMN public.event_preferences.partner_gender_preference IS 'Partner gender preference for festival matching: Girls, Guys, or Open to Anyone';
COMMENT ON COLUMN public.event_preferences.most_excited_1 IS 'First chosen excitement vibe chip (exact option text from UI)';
COMMENT ON COLUMN public.event_preferences.most_excited_2 IS 'Second chosen excitement vibe chip (exact option text from UI)';
COMMENT ON COLUMN public.event_preferences.most_excited_3 IS 'Third chosen excitement vibe chip (exact option text from UI)';
