# String X — V1 Messaging Implementation Checkpoint

- **Feature**: 1-to-1 messaging between revealed String X matches
- **Current Phase**: Frontend implementation
- **Database Phase**: COMPLETE
- **Security Review**: COMPLETE
- **Migration**: EXECUTED AND VERIFIED

---

## 1. DOCUMENT PURPOSE

This document serves as the authoritative technical checkpoint and resumption guide for the STRING X V1 1-to-1 messaging feature. A future Antigravity session can resume implementation from the exact current state without repeating completed security reviews, re-executing migrations, or making assumptions.

---

## 2. CURRENT STATUS

### DATABASE
- ✅ Messaging migration executed successfully against linked Supabase project (`nutavlypeasbadcaqobw`).
- ✅ Post-execution database verification completed.
- ✅ `0` execution errors.
- ✅ `0` execution warnings.

### SECURITY
- ✅ Messaging RLS model reviewed and verified.
- ✅ Bidirectional block handling reviewed and verified.
- ✅ `SECURITY DEFINER` helper hardened with participant scope guard.
- ✅ Arbitrary third-party block probing via Supabase RPC prevented.

### FRONTEND
- ⏸️ Messaging UI ([MessagingScreen.tsx](file:///d:/coder_cave/projects/string%20X/src/components/screens/MessagingScreen.tsx)) is still using local/mock state.
- ⏸️ Frontend integration has NOT started.
- ⏭️ Next step is **STEP 8.1**.

---

## 3. DATABASE MIGRATION

- **Migration File**: [`supabase/migrations/20261006000001_messages_schema.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261006000001_messages_schema.sql)
- **Status**: Executed on remote database and recorded in migration history table (`applied`).

### Created Table: `public.messages`
| Column | Type | Nullable | Default / Reference |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `NOT NULL` | `PRIMARY KEY DEFAULT gen_random_uuid()` |
| `match_id` | `UUID` | `NOT NULL` | `REFERENCES public.matches(id) ON DELETE CASCADE` |
| `sender_user_id` | `UUID` | `NOT NULL` | `REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `body` | `TEXT` | `NOT NULL` | *None* |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `DEFAULT now()` |

### Constraint: `chk_messages_body`
```sql
CONSTRAINT chk_messages_body CHECK (
    char_length(trim(body)) > 0 
    AND char_length(body) <= 2000
)
```
- Trimmed body must contain at least 1 character.
- Maximum length 2000 characters.
- Full multi-byte Unicode and emoji support.

### Index: `idx_messages_match_created_at`
```sql
CREATE INDEX idx_messages_match_created_at ON public.messages (match_id, created_at ASC);
```

### Realtime
- `public.messages` is officially added to publication `supabase_realtime`:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

---

## 4. FINAL SECURITY ARCHITECTURE

A user is authorized to access messages if and only if **all** of the following conditions evaluate to `true`:
1. The user is **authenticated** (`auth.uid() IS NOT NULL`).
2. The user is a **participant** of the match (`m.user_a_id = auth.uid() OR m.user_b_id = auth.uid()`).
3. The match is active (`m.status = 'active'`).
4. The match is revealed (`public.is_match_revealed(m.id) = true`).
5. Neither participant has blocked the other (`public.is_pair_blocked(m.user_a_id, m.user_b_id) = false`).

For **INSERT**, additionally:
- `auth.uid() = sender_user_id` (sender spoofing impossible).

### Critical Product Decision on Connection Status
- **Rule**: Do **NOT** require `connections.status = 'connected'`.
- **Reason**: In STRING X, `connections.status = 'connected'` represents mutual acceptance of the separate social/Instagram exchange flow. Messaging is intentionally available immediately after a match identity is revealed. Therefore, `public.is_match_revealed()` is the authoritative messaging reveal gate.

---

## 5. `public.is_pair_blocked()` HELPER FUNCTION

```sql
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
```

### Safety Features
- Checks blocks in **both directions** (`A blocks B` OR `B blocks A`).
- Operates under `SECURITY DEFINER` to bypass the single-direction RLS filter on `public.user_blocks`.
- Enforces the **participant scope guard**:
  - Participant A checking `(A, B)` → Returns real block status.
  - Participant B checking `(A, B)` → Returns real block status.
  - Unrelated User C probing `(A, B)` → Returns `false` unconditionally.
  - Unauthenticated caller → Returns `false` unconditionally.
- Prevents arbitrary users from using the function as a block-status oracle through Supabase RPC.
- **Privileges**: Explicitly granted to `authenticated` (required by PostgreSQL for RLS evaluation), revoked from `PUBLIC` and `anon`.

---

## 6. MESSAGES RLS POLICIES

### SELECT Policy: `"Participants can read messages for active revealed unblocked matches"`
```sql
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
```

### INSERT Policy: `"Participants can insert messages into active revealed unblocked match"`
```sql
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
```

### Mutation Restrictions
- No `UPDATE` policy exists.
- No `DELETE` policy exists.
- Normal `authenticated` clients have `SELECT + INSERT` only.

---

## 7. EXISTING SYSTEMS VERIFIED UNCHANGED

Post-execution database verification confirmed zero regression:
- `connections` (intact, untouched)
- `matches` (intact, untouched)
- `profiles` (intact, untouched)
- `events` (intact, untouched)
- `user_blocks` (intact, untouched)
- Views: `v_admin_users`, `v_matched_profiles`, `v_my_matches` (intact, functional)
- Functions: `is_match_revealed()`, `accept_string_connection()`, `admin_assign_match()` (intact)
- Triggers: `trg_check_single_active_match`, `trg_enforce_profile_email_identity` (intact)

The messaging migration was 100% additive.

---

## 8. FRONTEND CURRENT STATE

### Structure
- **Screen UI**: [src/components/screens/MessagingScreen.tsx](file:///d:/coder_cave/projects/string%20X/src/components/screens/MessagingScreen.tsx)
- **Container Page**: [src/pages/matchmaking/MessagingPage.tsx](file:///d:/coder_cave/projects/string%20X/src/pages/matchmaking/MessagingPage.tsx)
- **App Shell Mounting**: [src/app/AppShell.tsx](file:///d:/coder_cave/projects/string%20X/src/app/AppShell.tsx) under `screen === AppRoute.MESSAGES`.
- **Route Enum**: `AppRoute.MESSAGES = 'messages'`.
- **Back Navigation**: `navigateTo(AppRoute.MATCH_REVEAL)`.

### Current Implementation State
- Page 25 is currently a **local UI mock**.
- Local state includes `messages` array, `inputText`, and `isTyping`.
- Fake partner auto-replies are generated with `setTimeout` (lines 68–99 of `MessagingScreen.tsx`).
- These fake replies have **NOT** yet been removed.

---

## 9. FRONTEND AUDIT RESULTS

- **Authentication**: `useAuth()` provides `user`, `profile`, `isAuthenticated`, `loading`, and `profileLoading`.
- **Identity Guarantee**: `user.id = auth.uid()` and `profile.id = user.id`. They represent the exact same UUID.
- **Match Identity**: Obtained via `matchmakingService.checkActiveMatch(userId)` (backed by `v_my_matches` and `public.matches`).
- **Canonical Conversation ID**: `public.matches.id` (`UUID`). Do **NOT** create a separate conversation table or conversation ID.

---

## 10. FRONTEND IMPLEMENTATION PLAN

```
STEP 8.1 ──► Add messaging types (src/lib/supabase/types.ts & src/types/messaging.ts)
     │
STEP 8.2 ──► Create messagingService.ts (getMessages, sendMessage, subscribeToMessages)
     │
STEP 8.3 ──► Update MessagingPage.tsx (resolve matchId, partner details)
     │
STEP 8.4 ──► Update MessagingScreen.tsx (real history, real send, realtime, remove fake replies)
     │
STEP 8.5 ──► Verification (TypeScript, end-to-end messaging, realtime, regression check)
```

---

## 11. APPROVED MESSAGE DOMAIN TYPE

File: `src/types/messaging.ts`

```ts
export interface MessageItem {
  id: string;
  matchId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
}

export type MessageListener = (message: MessageItem) => void;
```

### Critical Rule on Domain Type
- Do **NOT** add UI-specific fields to `MessageItem` (e.g. `isUser`, `timestamp`, `sender: 'user' | 'partner'`).
- The UI layer must derive display properties from `message.senderUserId === currentUserId` and `message.createdAt`.

---

## 12. APPROVED SERVICE DESIGN

File: `src/services/messagingService.ts`

- Follow existing String X service conventions (`ServiceResult<T>`, `successResult()`, `errorResult()`, `isSupabaseConfigured`).
- Use the singleton `supabase` client from `src/lib/supabase/client`.
- Functions:
  1. `getMessages(matchId: string): Promise<ServiceResult<MessageItem[]>>`
  2. `sendMessage(matchId: string, senderUserId: string, body: string): Promise<ServiceResult<MessageItem>>`
  3. `subscribeToMessages(matchId: string, onNewMessage: MessageListener, onError?: (err: any) => void): () => void`

### Realtime Subscription Parameters
- **Channel**: `messages:${matchId}`
- **Postgres Changes**:
  - `event: 'INSERT'`
  - `schema: 'public'`
  - `table: 'messages'`
  - `filter: match_id=eq.<matchId>`
- **Cleanup**: Explicit `supabase.removeChannel(channel)` returned from subscription method.

---

## 13. V1 SCOPE

### Included in V1:
- ✅ 1-to-1 text messaging
- ✅ Message history loading (up to 100 messages chronological)
- ✅ Sending real text messages to Supabase
- ✅ Realtime incoming message subscription
- ✅ Message timestamps
- ✅ In-flight send state
- ✅ Error handling and alerts
- ✅ Auto-scroll to latest message
- ✅ Clean subscription teardown on unmount / navigation

### Excluded from V1:
- ❌ Typing indicators
- ❌ Read receipts
- ❌ Reactions
- ❌ Threaded replies
- ❌ Message editing
- ❌ Message deletion
- ❌ Images / media uploads
- ❌ Voice messages
- ❌ GIFs
- ❌ Group chat
- ❌ Online presence
- ❌ Message search

---

## 14. UI PRESERVATION

The existing visual design of Page 25 ([MessagingScreen.tsx](file:///d:/coder_cave/projects/string%20X/src/components/screens/MessagingScreen.tsx)) must remain **100% intact**:
- `<CampusNightChatBackground />` evening campus illustration
- Top header with back button, partner avatar, online green dot, partner name, subtitle, and three-dot menu
- Message bubble styling:
  - User: Electric purple (`bg-[#894EFF]`, `rounded-2xl rounded-br-xs`), white text, timestamp, and green double-check icon
  - Partner: Deep plum (`bg-[#1B0B2A] border border-[#894EFF]/30`, `rounded-2xl rounded-bl-xs`), lavender text, and timestamp
- Conversation starter prompt chips displayed when conversation is empty
- Bottom pill composer input with send button and SVG icon
- Spacing, padding, responsive safe-area insets, and animations

Only the data layer and fake reply simulations are to be replaced.

---

## 15. IMPORTANT SAFETY RULES

1. Do **NOT** redo the completed database migration.
2. Do **NOT** create another messages migration.
3. Do **NOT** alter existing matching tables (`matches`, `profiles`, `connections`, etc.).
4. Do **NOT** alter connections logic or require `connections.status = 'connected'`.
5. Do **NOT** replace `is_match_revealed()` with client-side-only checks.
6. Do **NOT** duplicate RLS security logic in the frontend.
7. Do **NOT** create a `conversations` table for V1. Use `matches.id` as conversation identity.
8. Do **NOT** redesign Page 25.
9. Work **one step at a time**.
10. After each step, stop and report results before continuing.

---

## 16. EXACT RESUME POINT

> [!IMPORTANT]
> **DO NOT start from database migration or security review.**
> The database is live, verified, and active.

### The exact next task is:
### **STEP 8.1 — ADD MESSAGING TYPES ONLY**

Modify **ONLY**:
1. [`src/lib/supabase/types.ts`](file:///d:/coder_cave/projects/string%20X/src/lib/supabase/types.ts) (add `messages` table schema to `Database['public']['Tables']`)
2. `src/types/messaging.ts` (create application domain `MessageItem` interface)

**Do NOT** create `messagingService.ts` yet.  
**Do NOT** modify `MessagingPage.tsx` yet.  
**Do NOT** modify `MessagingScreen.tsx` yet.  
**Do NOT** modify Supabase.  

After completing STEP 8.1, stop and report.

---

## 17. RESUME INSTRUCTION

When a future session opens this document, read this checkpoint completely and confirm:

> *"String X V1 messaging database is already live and verified. Frontend implementation has not started. Resume from STEP 8.1."*
