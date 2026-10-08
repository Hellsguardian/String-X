# STRING X — Messaging Architecture (V1)

> **Version:** 1.0.0  
> **Classification:** CANONICAL TECHNICAL SPECIFICATION  
> **Status:** LIVE AND VERIFIED  
> **Feature:** 1-to-1 Realtime Chat Between Revealed Matches  
> **Migration:** `supabase/migrations/20261006000001_messages_schema.sql`  

---

## 1. Overview

STRING X Messaging V1 provides direct, secure, 1-to-1 text communication between students whose active match pairing has been revealed. 

The messaging subsystem is built with defense-in-depth:
- **Canonical Conversation Identity:** Every conversation is 1:1 bound to an active pairing in `public.matches(id)`. No extraneous conversations or threads table is introduced.
- **Server-Side Authorization:** PostgreSQL Row Level Security (RLS) ensures only authenticated match participants can read or insert messages.
- **Reveal Gatekeeping:** Access requires `public.is_match_revealed(m.id) = true`.
- **Bidirectional Safety Guard:** Blocked pairs cannot communicate or inspect each other's messages via `public.is_pair_blocked()`.
- **Realtime Synchronization:** PostgreSQL INSERT changes are broadcast via Supabase Realtime (`supabase_realtime` publication) scoped to the match channel.

---

## 2. Database Schema

### 2.1 Table: `public.messages`

Defined in migration [`20261006000001_messages_schema.sql`](file:///d:/coder_cave/projects/string%20X/supabase/migrations/20261006000001_messages_schema.sql):

```sql
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
```

### Column Specifications

| Column | Type | Nullable | Default / Reference | Description |
|---|---|---|---|---|
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | Primary key |
| `match_id` | `UUID` | `NOT NULL` | `REFERENCES public.matches(id) ON DELETE CASCADE` | Foreign key referencing canonical pairing |
| `sender_user_id` | `UUID` | `NOT NULL` | `REFERENCES public.profiles(id) ON DELETE CASCADE` | Foreign key referencing message author in `public.profiles` |
| `body` | `TEXT` | `NOT NULL` | *None* | Text message content (1–2000 characters, trimmed, full Unicode/emoji support) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` | Message creation timestamp |

### Integrity Constraints

- **`chk_messages_body`**:
  ```sql
  CONSTRAINT chk_messages_body CHECK (
      char_length(trim(body)) > 0 
      AND char_length(body) <= 2000
  )
  ```
  - Rejects empty strings and whitespace-only submissions.
  - Enforces 2,000 character maximum payload.
  - Fully supports multi-byte Unicode and emojis (e.g., 🕺, ✨, 😊).

### Performance Index

```sql
CREATE INDEX idx_messages_match_created_at ON public.messages (match_id, created_at ASC);
```
Serves chronological query sorting (`ORDER BY created_at ASC`) and pagination per match.

### Realtime Publication

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```
Enables Supabase Realtime listeners for `INSERT` events.

---

## 3. Security Architecture & RLS

### 3.1 Authorization Invariants

An authenticated caller is authorized to access messages if and only if **all** of the following evaluate to `true`:
1. **Authenticated Session:** `auth.uid() IS NOT NULL`.
2. **Match Participant:** `m.user_a_id = auth.uid() OR m.user_b_id = auth.uid()`.
3. **Active Status:** `m.status = 'active'`.
4. **Reveal Gate:** `public.is_match_revealed(m.id) = true`.
5. **No Active Block:** `public.is_pair_blocked(m.user_a_id, m.user_b_id) = false`.

For message insertions, additionally:
- **Author Identity:** `auth.uid() = sender_user_id` (sender spoofing impossible).

### 3.2 RLS Policies

```sql
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
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

-- INSERT Policy
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

### 3.3 Mutation Restrictions

- **UPDATE:** Denied. No UPDATE policy exists on `public.messages`.
- **DELETE:** Denied. No DELETE policy exists on `public.messages`.
- **Anonymous Access:** Denied.
  ```sql
  REVOKE ALL ON public.messages FROM PUBLIC;
  REVOKE ALL ON public.messages FROM anon;
  GRANT SELECT, INSERT ON public.messages TO authenticated;
  ```

---

## 4. `public.is_pair_blocked()` Security Helper

### 4.1 SQL Implementation

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

REVOKE EXECUTE ON FUNCTION public.is_pair_blocked(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_pair_blocked(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_pair_blocked(UUID, UUID) TO authenticated;
```

### 4.2 Why It Exists Instead of Direct Querying

`public.user_blocks` enforces single-direction RLS:
```sql
CREATE POLICY "Users can manage their own blocks"
ON public.user_blocks FOR ALL
USING (auth.uid() = blocker_id);
```
Under this policy, User A can only see rows where User A is the blocker. If User B blocks User A, User A cannot read that row from `public.user_blocks` directly.

Therefore:
1. `public.is_pair_blocked()` runs with `SECURITY DEFINER` privileges to read `user_blocks` bidirectionally across both directions (`A blocks B` OR `B blocks A`).
2. **Participant Caller Guard:** It verifies that `auth.uid()` is either `p_user_a` or `p_user_b`. If an unrelated third-party User C calls `is_pair_blocked(A, B)`, the function returns `false` unconditionally. This prevents arbitrary users from probing block statuses between third parties.
3. **Safe Search Path:** `SET search_path = public, auth, pg_temp` protects against search path manipulation attacks.

---

## 5. Frontend Service Layer (`messagingService.ts`)

File: [`src/services/messagingService.ts`](file:///d:/coder_cave/projects/string%20X/src/services/messagingService.ts)

### 5.1 Service Methods

```typescript
export const messagingService = {
  // 1. Fetch chronological message history (limit 100)
  async getMessages(matchId: string): Promise<ServiceResult<MessageItem[]>>;

  // 2. Insert new message
  async sendMessage(
    matchId: string,
    senderUserId: string,
    body: string
  ): Promise<ServiceResult<MessageItem>>;

  // 3. Realtime subscription to new messages
  subscribeToMessages(
    matchId: string,
    onNewMessage: MessageListener,
    onError?: (err: any) => void
  ): () => void;
};
```

### 5.2 Realtime Subscription Mechanics

- **Channel Name:** `messages:${matchId}`
- **Postgres Changes Event:** `INSERT`
- **Filter:** `match_id=eq.${matchId}`
- **Channel Cleanup:** The method returns an unsubscription function calling `supabase.removeChannel(channel)` to guarantee clean teardown on component unmount or back navigation.

---

## 6. Frontend Navigation & Data Flow

```
Page 24 (MatchRevealPage)
  │
  ├── User clicks "Send a Message"
  │
  ▼
AppRoute.MESSAGES (Screen 25 / MessagingPage)
  │
  ├── Resolves active match (matchmakingService.checkActiveMatch)
  ├── Enforces isRevealed check (displays locked screen if not revealed)
  ├── Loads chronological message history (messagingService.getMessages)
  ├── Subscribes to realtime channel (messagingService.subscribeToMessages)
  │
  ▼
MessagingScreen
  ├── Renders campus night illustrated background
  ├── Auto-scrolls to bottom on message load and arrival
  ├── Displays starter chips if conversation is empty
  ├── Handles duplicate message protection via Set/ID check
  └── Sends messages via messagingService.sendMessage
```

### 6.1 Duplicate Message Protection
Both historical load and realtime listener guard against duplicates by checking `!prev.some((m) => m.id === incoming.id)` and sorting chronologically by `createdAt`.

### 6.2 Auto-Scroll Behavior
A `messagesEndRef` tracks the scroll container and smoothly scrolls down whenever `messages` updates.

### 6.3 Starter Prompt Chips
When `messages.length === 0`, suggested icebreaker chips are shown:
- *"Which Garba night are you going to? 🕺"*
- *"What's your favourite Garba song?"*
- *"Ready for Navratri? ✨"*

Tapping a chip pre-populates the input composer and focuses the text input.

---

## 7. V1 Feature Scope

| Feature | Included in V1 | Notes |
|---|---|---|
| 1-to-1 Text Chat | ✅ YES | Up to 2,000 characters per message |
| Chronological History | ✅ YES | Up to 100 messages |
| Realtime New Messages | ✅ YES | Supabase Realtime channel `messages:${matchId}` |
| Reveal Authorization Gate | ✅ YES | Requires `is_match_revealed = true` |
| Bi-Directional Block Exclusion | ✅ YES | Gated via `is_pair_blocked()` |
| Duplicate Message Protection | ✅ YES | ID-based deduplication |
| Auto-Scroll to Latest | ✅ YES | Smooth auto-scroll |
| Conversation Starters | ✅ YES | 3 festive icebreaker chips |
| Typing Indicators | ❌ NO | Deferred to V2 |
| Read Receipts | ❌ NO | Deferred to V2 |
| Reactions / Emojis | ❌ NO | Deferred to V2 |
| Media / Photos Upload | ❌ NO | Deferred to V2 |
| Message Editing / Deletion | ❌ NO | Immutable in V1 |
