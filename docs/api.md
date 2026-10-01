# STRING X — Internal Service API Specification

> **Version:** 3.0.0  
> **Status:** APPROVED ARCHITECTURAL SPECIFICATION (TYPESCRIPT SERVICE APIS)  
> **Location:** `src/services/`  

---

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

### `authService.signInWithGoogle()`
- **Input:** None.
- **Output:** `Promise<ServiceResult<{ url?: string }>>`.
- **Behavior:** Initiates Supabase Google OAuth sign-in with client redirect.

### `authService.isEmailPermitted(email)`
- **Input:** `email: string`.
- **Output:** `Promise<boolean>`.
- **Behavior:** Validates official university regex (`^[0-9]+@paruluniversity\.ac\.in$`) or presence in `public.allowed_auth_emails`.

### `authService.getSession()`
- **Input:** None.
- **Output:** `Promise<ServiceResult<{ user: User | null; session: Session | null }>>`.
- **Behavior:** Reads active JWT session via `supabase.auth.getSession()`.

### `authService.signOut()`
- **Input:** None.
- **Output:** `Promise<ServiceResult<void>>`.
- **Behavior:** Calls `supabase.auth.signOut()` and purges local session tokens.

### `authService.deleteAccount()`
- **Input:** None.
- **Output:** `Promise<ServiceResult<void>>`.
- **Behavior:** Invokes `public.delete_user_account()` RPC and purges user storage assets.

---

## 2. `profileService` (`src/services/profileService.ts`)

### `profileService.getProfile(userId)`
- **Input:** `userId: string` (UUID).
- **Output:** `Promise<ServiceResult<UserProfile>>`.
- **Behavior:** Reads `public.profiles` where `id = userId` and latest verification attempt.

### `profileService.saveProfile(userId, updates, currentProfile?, step?)`
- **Input:**
  - `userId: string`
  - `updates: Partial<UserProfile>`
  - `currentProfile?: UserProfile`
  - `step?: number`
- **Output:** `Promise<ServiceResult<UserProfile>>`.
- **Behavior:** Maps frontend fields to `public.profiles` columns and executes SQL `update` / `upsert`.

### `profileService.savePrimaryPhoto(userId, photoDataUrl)`
- **Input:** `userId: string`, `photoDataUrl: string`.
- **Output:** `Promise<ServiceResult<{ publicUrl: string; photoId: string }>>`.
- **Behavior:** Uploads to `profile-photos` CDN bucket and creates record in `public.profile_photos`.

### `profileService.submitFaceVerification(userId, photoDataUrl, coordinates?)`
- **Input:** `userId: string`, `photoDataUrl: string`, `coordinates?: Coordinates`.
- **Output:** `Promise<ServiceResult<{ storagePath: string }>>`.
- **Behavior:** Uploads selfie to private `verifications` bucket and calls `public.submit_face_verification` RPC with GPS coordinates.

### `profileService.submitDpVerification(photoId)`
- **Input:** `photoId: string` (UUID).
- **Output:** `Promise<ServiceResult<{ success: boolean }>>`.
- **Behavior:** Calls `public.submit_dp_verification(UUID)` RPC to queue profile photo for moderation.

### `profileService.completeStudentOnboarding(userId)`
- **Input:** `userId: string`.
- **Output:** `Promise<ServiceResult<{ success: boolean }>>`.
- **Behavior:** Calls `public.complete_student_onboarding()` RPC to atomically validate fields and set `onboarding_status = 'completed'` and `is_profile_completed = true`.

### `profileService.loadLookups()`
- **Input:** None.
- **Output:** `Promise<LookupData>`.
- **Behavior:** Fetches universities, hostels, courses, and interests with a 5-second timeout and static fallback data.

### `profileService.canUseMatching(profile)`
- **Input:** `profile: UserProfile`.
- **Output:** `boolean`.
- **Behavior:** Returns `false` if `verification_status === 'rejected'` (or if DP/Face are explicitly rejected), `true` otherwise.

---

## 3. `onboardingService` (`src/services/onboardingService.ts`)

### `onboardingService.saveDraft(profile)`
- **Input:** `profile: Partial<UserProfile>`.
- **Output:** `void`.
- **Storage:** Writes JSON to `localStorage['stringx_onboarding_draft']`.

### `onboardingService.getDraft()`
- **Input:** None.
- **Output:** `Partial<UserProfile> | null`.
- **Storage:** Reads from `localStorage['stringx_onboarding_draft']`.

### `onboardingService.validateStep(step, profile)`
- **Input:** `step: number` (0 to 17), `profile: UserProfile`.
- **Output:** `boolean`.
- **Logic:** Validates required form inputs for the given step index.

---

## 4. `storageService` (`src/services/storageService.ts`)

### `storageService.uploadPhoto(fileOrBlob, userId, fileNamePrefix?)`
- **Input:** `fileOrBlob: File | Blob`, `userId: string`, `fileNamePrefix?: string`.
- **Output:** `Promise<ServiceResult<{ publicUrl: string; path: string }>>`.
- **Bucket:** Public CDN bucket `profile-photos`.

### `storageService.uploadFaceVerificationPhoto(fileOrBlob, userId)`
- **Input:** `fileOrBlob: File | Blob`, `userId: string`.
- **Output:** `Promise<ServiceResult<{ path: string }>>`.
- **Bucket:** Strictly private bucket `verifications`.

---

## 5. `eventService` (`src/services/eventService.ts`)

### `eventService.getEvents()`
- **Input:** None.
- **Output:** `Promise<ServiceResult<EventDefinition[]>>`.
- **Behavior:** Returns active campus events.

### `eventService.submitEventAnswers(eventId, userId, profile)`
- **Input:** `eventId: string`, `userId: string`, `profile: UserProfile`.
- **Output:** `Promise<ServiceResult<UserEventRegistration>>`.
- **Behavior:** Persists event registration in `public.event_registrations` and questionnaire telemetry in `public.event_preferences`.

### `eventService.getEventRegistration(eventId, userId)`
- **Input:** `eventId: string`, `userId: string`.
- **Output:** `Promise<ServiceResult<UserEventRegistration | null>>`.
- **Behavior:** Queries authoritative `public.event_registrations` and `public.event_preferences`.

---

## 6. `matchmakingService` (`src/services/matchmakingService.ts`)

### `matchmakingService.checkActiveMatch(userId, eventId?)`
- **Input:** `userId: string`, `eventId?: string`.
- **Output:** `Promise<ServiceResult<ActiveMatchResult | null>>`.
- **Behavior:** Queries `public.v_my_matches` and `public.matches` for an active pair.

### `matchmakingService.subscribeToMatches(userId, onMatchUpdate)`
- **Input:** `userId: string`, `onMatchUpdate: (match: any) => void`.
- **Output:** `() => void` (Unsubscribe function).
- **Behavior:** Subscribes to Supabase Realtime channel for match updates.

### `matchmakingService.getMatchesForEvent(eventId)`
- **Input:** `eventId: string`.
- **Output:** `Promise<ServiceResult<EventMatch[]>>`.
- **Behavior:** Returns candidate matches with compatibility score and shared highlights.
