-- =============================================================================
-- Migration: 20261006000001_messages_schema.sql
-- Description: Basic 1-to-1 text messaging for revealed/connected String X matches.
-- Tables: public.messages
-- Functions: public.is_pair_blocked
-- Standards: PostgreSQL 15+, Supabase Auth integration, RLS defense-in-depth,
--            scoped Realtime publication, strict pair-level reveal enforcement.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. MESSAGES TABLE
-- Direct 1-to-1 conversation messages keyed to canonical public.matches(id).
-- -----------------------------------------------------------------------------
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_messages_body CHECK (
        char_length(trim(body)) > 0 
        AND char_length(body) <= 2000
    )
);

COMMENT ON TABLE public.messages IS '1-to-1 direct messages exchanged between revealed match participants';
COMMENT ON COLUMN public.messages.match_id IS 'Foreign key referencing the canonical pairing in public.matches';
COMMENT ON COLUMN public.messages.sender_user_id IS 'Foreign key referencing the message author in public.profiles';
COMMENT ON COLUMN public.messages.body IS 'Message text content (1-2000 chars, non-whitespace, full Unicode/emoji support)';
COMMENT ON COLUMN public.messages.created_at IS 'Timestamp when the message was recorded in the database';

-- -----------------------------------------------------------------------------
-- 2. APPLICATION INDEX
-- Serves chronological message history and pagination per match.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_messages_match_created_at ON public.messages (match_id, created_at ASC);

-- -----------------------------------------------------------------------------
-- 3. PAIR-BLOCK HELPER FUNCTION
-- Evaluates bi-directional block status between two users under SECURITY DEFINER
-- to bypass single-direction RLS on public.user_blocks safely.
-- Scoped strictly to callers who are participants in the pair.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_pair_blocked(
    p_user_a UUID,
    p_user_b UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT CASE
        WHEN auth.uid() IS NULL
             OR (auth.uid() <> p_user_a AND auth.uid() <> p_user_b)
        THEN false
        ELSE EXISTS (
            SELECT 1
            FROM public.user_blocks
            WHERE
                (blocker_id = p_user_a AND blocked_id = p_user_b)
                OR
                (blocker_id = p_user_b AND blocked_id = p_user_a)
        )
    END;
$$;

COMMENT ON FUNCTION public.is_pair_blocked(UUID, UUID)
IS 'Evaluates bi-directional block status between two users under SECURITY DEFINER privileges, scoped strictly to callers who are participants in the pair';

REVOKE EXECUTE ON FUNCTION public.is_pair_blocked(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_pair_blocked(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_pair_blocked(UUID, UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- Enables strict 1-to-1 isolation, active match verification, pair-level reveal
-- gatekeeping via public.is_match_revealed(), and bi-directional block exclusion
-- via public.is_pair_blocked().
-- -----------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4.1 SELECT Policy: Participants can read messages if match is active, revealed, and unblocked
CREATE POLICY "Participants can read messages for active revealed unblocked matches"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = messages.match_id
          AND m.status = 'active'
          AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
          AND public.is_match_revealed(m.id) = true
          AND public.is_pair_blocked(m.user_a_id, m.user_b_id) = false
    )
);

-- 4.2 INSERT Policy: Participants can insert own messages if match is active, revealed, and unblocked
CREATE POLICY "Participants can insert messages into active revealed unblocked match"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_user_id
    AND EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = messages.match_id
          AND m.status = 'active'
          AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
          AND public.is_match_revealed(m.id) = true
          AND public.is_pair_blocked(m.user_a_id, m.user_b_id) = false
    )
);

-- -----------------------------------------------------------------------------
-- 5. PRIVILEGE MODEL
-- Disallows unauthenticated access (anon) and forbids UPDATE / DELETE for V1.
-- -----------------------------------------------------------------------------
REVOKE ALL ON public.messages FROM PUBLIC;
REVOKE ALL ON public.messages FROM anon;
GRANT SELECT, INSERT ON public.messages TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. REALTIME PUBLICATION
-- Adds public.messages to the existing supabase_realtime publication for INSERT events.
-- -----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
