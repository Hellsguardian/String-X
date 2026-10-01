-- =============================================================================
-- Migration: 20261003000001_platform_statistics.sql
-- Description: Platform Statistics Table, Atomic Profile Count Sync & Realtime
--   1. Creates public.platform_statistics table (singleton 'global' row)
--   2. Initializes total_profiles count directly from COUNT(*) of public.profiles
--   3. Configures Row Level Security (public read-only for anon and authenticated)
--   4. Creates sync_platform_profile_count() trigger function (SECURITY DEFINER)
--   5. Attaches AFTER INSERT OR DELETE trigger on public.profiles
--   6. Adds public.platform_statistics to supabase_realtime publication
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATE PLATFORM STATISTICS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_statistics (
    id TEXT PRIMARY KEY DEFAULT 'global',
    total_profiles INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_single_platform_stats_row CHECK (id = 'global')
);

COMMENT ON TABLE public.platform_statistics IS 'Publicly readable platform-wide aggregate statistics (e.g. total registered profiles count). Contains zero PII.';
COMMENT ON COLUMN public.platform_statistics.total_profiles IS 'Authoritative count of total registered profiles in public.profiles. Automatically synchronized via trigger.';

-- -----------------------------------------------------------------------------
-- 2. INITIALIZE GLOBAL COUNT FROM EXISTING PROFILES
-- -----------------------------------------------------------------------------
INSERT INTO public.platform_statistics (id, total_profiles, updated_at)
VALUES (
    'global',
    (SELECT count(*)::integer FROM public.profiles),
    now()
)
ON CONFLICT (id) DO UPDATE
SET total_profiles = EXCLUDED.total_profiles,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.platform_statistics ENABLE ROW LEVEL SECURITY;

-- Revoke default table modifications from PUBLIC, anon, and authenticated
REVOKE ALL ON TABLE public.platform_statistics FROM PUBLIC;
REVOKE ALL ON TABLE public.platform_statistics FROM anon;
REVOKE ALL ON TABLE public.platform_statistics FROM authenticated;

-- Allow anonymous and authenticated users to read the aggregate count
DROP POLICY IF EXISTS p_platform_stats_read ON public.platform_statistics;
CREATE POLICY p_platform_stats_read
ON public.platform_statistics
FOR SELECT
TO anon, authenticated
USING (true);

-- Grant SELECT privilege to anon and authenticated
GRANT SELECT ON TABLE public.platform_statistics TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. PROFILE COUNT SYNCHRONIZATION TRIGGER FUNCTION
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_platform_profile_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.platform_statistics
        SET total_profiles = total_profiles + 1,
            updated_at = now()
        WHERE id = 'global';
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.platform_statistics
        SET total_profiles = GREATEST(0, total_profiles - 1),
            updated_at = now()
        WHERE id = 'global';
    END IF;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.sync_platform_profile_count() IS 'Atomically maintains platform_statistics.total_profiles on profile creation and deletion';

DROP TRIGGER IF EXISTS trg_sync_platform_profile_count ON public.profiles;
CREATE TRIGGER trg_sync_platform_profile_count
    AFTER INSERT OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_platform_profile_count();

-- -----------------------------------------------------------------------------
-- 5. REALTIME PUBLICATION REGISTRATION
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'platform_statistics'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_statistics;
    END IF;
END $$;
