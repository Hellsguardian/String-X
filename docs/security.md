# STRING X — Security & Data Protection Architecture

## 1. Security Principles

1. **Zero Trust Client:** The frontend runs in an untrusted browser environment. Client-side validation exists for user experience; security is enforced at the PostgreSQL and Storage layer.
2. **Never Expose Service-Role Keys:** Only the anonymous public key (`VITE_SUPABASE_ANON_KEY`) is bundled into the client build. The Supabase `service_role` key must **NEVER** be committed to git, imported in frontend code, or bundled in Vite.
3. **Strict Row Level Security (RLS):** Every PostgreSQL table has RLS enabled by default. Without an explicit policy matching `auth.uid()`, access is completely denied.

---

## 2. Row Level Security (RLS) Policy Blueprint

### 2.1 `profiles` Table Policies
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Students can read their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Students can only insert their own record
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Students can only update their own record
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 2.2 `event_participants` Table Policies
```sql
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_read_own"
ON public.event_participants FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "participants_upsert_own"
ON public.event_participants FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 3. Data Privacy: Public vs. Private Fields

| Field Name | Classification | Visibility Policy |
|---|---|---|
| `phone` | **Confidential / Private** | Visible ONLY to account owner. Never revealed to matched partner. |
| `face_verification_photo` | **Sensitive Security** | Used exclusively for facial authenticity checking. Never shared publicly. |
| `full_name`, `age`, `college_year` | **Match Visible** | Shared with paired partner only upon reveal milestone. |
| `instagram_id` | **Milestone Protected** | Held in escrow until the partner countdown reaches zero and reveal is unlocked. |
| `height_cm`, `weight_kg` | **Algorithm Only** | Used internally for dance sync; never displayed as raw numbers to other users. |

---

## 4. Input Sanitization & Anti-Abuse Measures

1. **Phone Number Cleaning:** Input strings are stripped of whitespace and non-digit characters via `.replace(/\D/g, '')`.
2. **Instagram Handle Sanitization:** Stripped of leading `@` symbols and checked against strict handle regex `/^[a-zA-Z0-9._]+$/` to prevent XSS injection.
3. **Face Verification Liveness:** The client utilizes local Pico cascade geometry tracking with a 1.25s continuous stability gate, ensuring users cannot upload synthetic or inanimate objects via webcam spoofing.
4. **SMS Rate Limiting:** Enforced at the Supabase Auth tier to prevent SMS bombing.
