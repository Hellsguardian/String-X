-- =============================================================================
-- Migration: 20261005000002_verification_bidirectional_sync.sql
-- Description: Transactional migration implementing bidirectional convenience
--              synchronization for public.verification and propagating verification
--              status to public.profiles:
--
--              Step 1: DROP existing trg_sync_verification_states trigger so it
--                      cannot alter component states during data normalization.
--              Step 2: DROP restrictive chk_verification_status_invariants constraint.
--              Step 3: Normalize existing verification rows:
--                      - ANY child rejected => parent rejected
--                      - ELSE BOTH children verified => parent verified
--                      - ELSE => parent pending
--                      Preserves existing dp and face component states intact.
--              Step 4: Recreate public.sync_verification_states() BEFORE trigger function
--                      and re-attach trg_sync_verification_states:
--                      - INSERT: Deterministically forces new attempts to:
--                        * verification_status = pending
--                        * dp = pending
--                        * face = pending
--                      - UPDATE (Parent edit):
--                        * pending  => dp=pending, face=pending
--                        * verified => dp=verified, face=verified
--                        * rejected => defaults to (dp=verified, face=rejected)
--                      - UPDATE (Child edit):
--                        * ANY rejected => parent rejected
--                        * BOTH verified => parent verified
--                        * ELSE => parent pending
--              Step 5: Create public.sync_verification_to_profiles() AFTER trigger
--                      function and attach trg_sync_verification_to_profiles:
--                      - Synchronizes profiles.verification_status from latest verification attempt
--                      - Operates after the row operation, before transaction commit
--                      - Uses SECURITY DEFINER with fixed search_path = public, pg_temp
--              Step 6: One-time migration reconciliation updating public.profiles.verification_status
--                      for every user to match their authoritative latest verification attempt.
--
-- Security: SECURITY DEFINER with fixed search_path = public, pg_temp
-- Nature: Transactional migration designed for StringX
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. DROP EXISTING TRIGGER BEFORE NORMALIZATION
-- The existing trg_sync_verification_states trigger MUST NOT remain active while
-- historical data normalization runs to avoid modifying dp/face during normalization.
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_verification_states ON public.verification;

-- -----------------------------------------------------------------------------
-- 2. DROP RESTRICTIVE INVARIANT CHECK CONSTRAINT
-- The ENUM type natively enforces valid values ('pending', 'verified', 'rejected').
-- Removing chk_verification_status_invariants permits independent child editing in Table Editor.
-- -----------------------------------------------------------------------------
ALTER TABLE public.verification
    DROP CONSTRAINT IF EXISTS chk_verification_status_invariants;

-- -----------------------------------------------------------------------------
-- 3. NORMALIZE EXISTING VERIFICATION ROWS
-- Aligns parent status with child-derived priority while strictly preserving
-- existing dp and face component values:
-- 1. ANY child rejected => parent rejected
-- 2. ELSE BOTH children verified => parent verified
-- 3. ELSE => parent pending
-- -----------------------------------------------------------------------------
UPDATE public.verification
SET verification_status = CASE
    WHEN dp = 'rejected'::public.verification_state OR face = 'rejected'::public.verification_state
        THEN 'rejected'::public.verification_state
    WHEN dp = 'verified'::public.verification_state AND face = 'verified'::public.verification_state
        THEN 'verified'::public.verification_state
    ELSE 'pending'::public.verification_state
END
WHERE verification_status IS DISTINCT FROM (
    CASE
        WHEN dp = 'rejected'::public.verification_state OR face = 'rejected'::public.verification_state
            THEN 'rejected'::public.verification_state
        WHEN dp = 'verified'::public.verification_state AND face = 'verified'::public.verification_state
            THEN 'verified'::public.verification_state
        ELSE 'pending'::public.verification_state
    END
);

-- -----------------------------------------------------------------------------
-- 4. REDEFINE BIDIRECTIONAL SYNCHRONIZATION BEFORE TRIGGER FUNCTION & TRIGGER
-- Pure in-memory calculation on NEW row.
-- No UPDATE statements issued against public.verification (no recursive writes).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_verification_states()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_parent_changed BOOLEAN;
    v_children_changed BOOLEAN;
BEGIN
    -- INSERT OPERATION: Deterministic clean start for all new verification attempts
    IF TG_OP = 'INSERT' THEN
        NEW.verification_status := 'pending'::public.verification_state;
        NEW.dp := 'pending'::public.verification_state;
        NEW.face := 'pending'::public.verification_state;
        RETURN NEW;
    END IF;

    -- UPDATE OPERATION: Distinguish Parent Edit vs Child Edit
    v_parent_changed := (NEW.verification_status IS DISTINCT FROM OLD.verification_status);
    v_children_changed := (NEW.dp IS DISTINCT FROM OLD.dp) OR (NEW.face IS DISTINCT FROM OLD.face);

    -- SCENARIO 1: Parent was explicitly edited while children remained unchanged
    IF v_parent_changed AND NOT v_children_changed THEN
        IF NEW.verification_status = 'pending'::public.verification_state THEN
            NEW.dp := 'pending'::public.verification_state;
            NEW.face := 'pending'::public.verification_state;
        ELSIF NEW.verification_status = 'verified'::public.verification_state THEN
            NEW.dp := 'verified'::public.verification_state;
            NEW.face := 'verified'::public.verification_state;
        ELSIF NEW.verification_status = 'rejected'::public.verification_state THEN
            -- Parent changed to rejected: if neither child was already rejected, default to dp=verified, face=rejected
            IF NEW.dp <> 'rejected'::public.verification_state AND NEW.face <> 'rejected'::public.verification_state THEN
                NEW.dp := 'verified'::public.verification_state;
                NEW.face := 'rejected'::public.verification_state;
            END IF;
        END IF;

    -- SCENARIO 2: Both Parent AND Children were modified in the same UPDATE
    ELSIF v_parent_changed AND v_children_changed THEN
        IF NEW.verification_status = 'pending'::public.verification_state THEN
            NEW.dp := 'pending'::public.verification_state;
            NEW.face := 'pending'::public.verification_state;
        ELSIF NEW.verification_status = 'verified'::public.verification_state THEN
            NEW.dp := 'verified'::public.verification_state;
            NEW.face := 'verified'::public.verification_state;
        ELSIF NEW.verification_status = 'rejected'::public.verification_state THEN
            -- Parent rejected: preserve any supplied child rejection; if neither is rejected, default
            IF NEW.dp <> 'rejected'::public.verification_state AND NEW.face <> 'rejected'::public.verification_state THEN
                NEW.dp := 'verified'::public.verification_state;
                NEW.face := 'rejected'::public.verification_state;
            END IF;
        END IF;

    -- SCENARIO 3: Children were edited independently (or parent was not altered)
    ELSE
        -- Apply Child-Derived Priority:
        -- 1. ANY child rejected => parent rejected
        -- 2. ELSE BOTH children verified => parent verified
        -- 3. ELSE => parent pending
        IF NEW.dp = 'rejected'::public.verification_state OR NEW.face = 'rejected'::public.verification_state THEN
            NEW.verification_status := 'rejected'::public.verification_state;
        ELSIF NEW.dp = 'verified'::public.verification_state AND NEW.face = 'verified'::public.verification_state THEN
            NEW.verification_status := 'verified'::public.verification_state;
        ELSE
            NEW.verification_status := 'pending'::public.verification_state;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_verification_states()
IS 'BEFORE trigger implementing bidirectional synchronization between verification_status (parent) and dp/face (children)';

CREATE TRIGGER trg_sync_verification_states
BEFORE INSERT OR UPDATE ON public.verification
FOR EACH ROW
EXECUTE FUNCTION public.sync_verification_states();

-- -----------------------------------------------------------------------------
-- 5. AFTER TRIGGER TO SYNCHRONIZE profiles.verification_status
-- Ensures Table Editor changes and manual updates to public.verification
-- automatically synchronize to public.profiles.verification_status.
-- Operates after the row operation, before transaction commit.
-- Guarantees the application summary reflects the latest attempt.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_verification_to_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_latest_rec RECORD;
BEGIN
    -- Determine the current authoritative status of the user's latest attempt
    -- with deterministic tie-breaking (created_at DESC, id DESC).
    SELECT verification_status INTO v_latest_rec
    FROM public.verification
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    IF v_latest_rec.verification_status IS NOT NULL THEN
        -- Only issue the update if profiles.verification_status differs to prevent redundant writes
        UPDATE public.profiles
        SET 
            verification_status = v_latest_rec.verification_status::text,
            updated_at = now()
        WHERE id = NEW.user_id
          AND verification_status IS DISTINCT FROM v_latest_rec.verification_status::text;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_verification_to_profiles()
IS 'AFTER trigger synchronizing public.profiles.verification_status from the authoritative latest verification record';

DROP TRIGGER IF EXISTS trg_sync_verification_to_profiles ON public.verification;

CREATE TRIGGER trg_sync_verification_to_profiles
AFTER INSERT OR UPDATE OF verification_status, dp, face ON public.verification
FOR EACH ROW
EXECUTE FUNCTION public.sync_verification_to_profiles();

-- -----------------------------------------------------------------------------
-- 6. ONE-TIME MIGRATION PROFILE RECONCILIATION
-- Synchronizes public.profiles.verification_status with the authoritative latest
-- verification record for every existing user using deterministic tie-breaking:
-- (ORDER BY user_id, created_at DESC, id DESC).
-- Only modifies rows where verification_status differs, setting updated_at = now().
-- -----------------------------------------------------------------------------
UPDATE public.profiles p
SET 
    verification_status = latest_v.verification_status::text,
    updated_at = now()
FROM (
    SELECT DISTINCT ON (user_id) 
        user_id, 
        verification_status
    FROM public.verification
    ORDER BY user_id, created_at DESC, id DESC
) latest_v
WHERE p.id = latest_v.user_id
  AND p.verification_status IS DISTINCT FROM latest_v.verification_status::text;

COMMIT;

-- =============================================================================
-- POST-MIGRATION VERIFICATION QUERIES (MANUAL AUDIT ONLY - DO NOT AUTO-EXECUTE)
-- =============================================================================
/*
-- 1. Confirm invariant check constraint has been dropped:
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.verification'::regclass
  AND conname = 'chk_verification_status_invariants';

-- 2. Confirm both triggers exist on public.verification:
SELECT trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'verification'
ORDER BY trigger_name;

-- 3. Verify data normalization consistency:
SELECT verification_status, dp, face, COUNT(*)
FROM public.verification
GROUP BY verification_status, dp, face
ORDER BY verification_status, dp, face;

-- 4. Verify reconciliation alignment between profiles and latest verification attempt:
SELECT 
    COUNT(*) AS mismatch_count
FROM public.profiles p
JOIN (
    SELECT DISTINCT ON (user_id) 
        user_id, 
        verification_status
    FROM public.verification
    ORDER BY user_id, created_at DESC, id DESC
) latest_v ON latest_v.user_id = p.id
WHERE p.verification_status IS DISTINCT FROM latest_v.verification_status::text;
-- Expected: mismatch_count = 0
*/
