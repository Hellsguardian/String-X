# STRING X — Internal Service API Specification

This document specifies the internal TypeScript service API contracts implemented in `src/services/`.

All services return the standard `ServiceResult<T>` wrapper:
```typescript
export interface ServiceResult<T> {
  data: T | null;
  error: ServiceError | null;
}

export interface ServiceError {
  message: string;
  code?: string;
  details?: unknown;
}
```

---

## 1. `authService` (`src/services/authService.ts`)

### `authService.sendPhoneOtp(phone)`
- **Input:** `phone: string` (e.g. `"+91 98251 44321"` or `"9825144321"`).
- **Output:** `Promise<ServiceResult<{ message: string }>>`.
- **Database Interaction:** Dispatches SMS verification code via `supabase.auth.signInWithOtp({ phone: formattedPhone })`.
- **Errors:** Returns `errorResult` if phone format is invalid, network fails, or SMS provider rate limits.

---

### `authService.verifyPhoneOtp(phone, token)`
- **Input:**
  - `phone: string`
  - `token: string` (6-digit numeric string).
- **Output:** `Promise<ServiceResult<{ user: User | null; session: Session | null }>>`.
- **Database Interaction:** Calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`.
- **Errors:** Returns `errorResult` on token mismatch, expiration, or maximum attempts exceeded.

---

### `authService.getSession()`
- **Input:** None.
- **Output:** `Promise<ServiceResult<{ user: User | null; session: Session | null }>>`.
- **Database Interaction:** Reads cached JWT session via `supabase.auth.getSession()`.
- **Errors:** Returns error if local session token is corrupted.

---

### `authService.signOut()`
- **Input:** None.
- **Output:** `Promise<ServiceResult<void>>`.
- **Database Interaction:** Calls `supabase.auth.signOut()` and purges local storage tokens.
- **Errors:** None (idempotent).

---

## 2. `profileService` (`src/services/profileService.ts`)

### `profileService.getProfile(userId)`
- **Input:** `userId: string` (UUID).
- **Output:** `Promise<ServiceResult<UserProfile>>`.
- **Database Interaction:** Executes SQL query:
  ```sql
  SELECT * FROM public.profiles WHERE user_id = $1 LIMIT 1;
  ```
- **Errors:** If no row exists (`PGRST116`), returns `INITIAL_USER_PROFILE` with zero error.

---

### `profileService.saveProfile(userId, updates)`
- **Input:**
  - `userId: string`
  - `updates: Partial<UserProfile>`
- **Output:** `Promise<ServiceResult<UserProfile>>`.
- **Database Interaction:** Executes PostgreSQL `UPSERT` into `public.profiles` with `onConflict: 'user_id'`.
- **Errors:** Returns `errorResult` on RLS policy rejection or database connection failure.

---

### `profileService.isCoreProfileCompleted(profile)`
- **Input:** `profile: UserProfile | null`.
- **Output:** `boolean`.
- **Database Interaction:** None (in-memory logic checking all 9 required fields).

---

### `profileService.isNavratriCompleted(profile)`
- **Input:** `profile: UserProfile | null`.
- **Output:** `boolean`.
- **Database Interaction:** None (in-memory validation).

---

## 3. `onboardingService` (`src/services/onboardingService.ts`)

### `onboardingService.saveDraft(profile)`
- **Input:** `profile: Partial<UserProfile>`.
- **Output:** `void`.
- **Storage:** Writes JSON to `localStorage['stringx_onboarding_draft']`.

---

### `onboardingService.getDraft()`
- **Input:** None.
- **Output:** `Partial<UserProfile> | null`.
- **Storage:** Reads from `localStorage['stringx_onboarding_draft']`.

---

### `onboardingService.validateStep(step, profile)`
- **Input:**
  - `step: number` (0 to 17).
  - `profile: UserProfile`.
- **Output:** `boolean`.
- **Logic:** Validates form inputs for the given step index according to campus rules.

---

## 4. `storageService` (`src/services/storageService.ts`)

### `storageService.uploadPhoto(fileOrBlob, userId, fileNamePrefix?)`
- **Input:**
  - `fileOrBlob: File | Blob`
  - `userId: string`
  - `fileNamePrefix?: string` (Default: `'photo'`)
- **Output:** `Promise<ServiceResult<{ publicUrl: string; path: string }>>`.
- **Storage Interaction:** Uploads binary payload to `profile-photos` bucket under `${userId}/${prefix}_${timestamp}.${ext}` and queries `getPublicUrl`.

---

### `storageService.uploadDataUrl(dataUrl, userId, fileNamePrefix?)`
- **Input:**
  - `dataUrl: string` (Base64 data URL from webcam canvas).
  - `userId: string`.
  - `fileNamePrefix?: string` (Default: `'face_verification'`).
- **Output:** `Promise<ServiceResult<{ publicUrl: string; path: string }>>`.
- **Storage Interaction:** Converts dataUrl string to a binary Blob before dispatching to `uploadPhoto`.

---

## 5. `eventService` (`src/services/eventService.ts`)

### `eventService.getEvents()`
- **Input:** None.
- **Output:** `Promise<ServiceResult<EventDefinition[]>>`.
- **Database Interaction:** Reads active events from `public.events` or returns static `STRINGX_EVENTS`.

---

### `eventService.submitEventAnswers(eventId, userId, answers)`
- **Input:**
  - `eventId: string`
  - `userId: string`
  - `answers: Record<string, any>`
- **Output:** `Promise<ServiceResult<UserEventRegistration>>`.
- **Database Interaction:** Upserts into `public.event_participants`.

---

## 6. `matchmakingService` (`src/services/matchmakingService.ts`)

### `matchmakingService.getMatchesForEvent(eventId)`
- **Input:** `eventId: string`.
- **Output:** `Promise<ServiceResult<EventMatch[]>>`.
- **Database Interaction:** Queries matches for the event or returns mock matches.

---

### `matchmakingService.sendWave(matchId)`
- **Input:** `matchId: string`.
- **Output:** `Promise<ServiceResult<{ success: boolean; message: string }>>`.
- **Database Interaction:** Dispatches a wave to partner record.
