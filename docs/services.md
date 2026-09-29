# STRING X — Service Layer Documentation

## 1. Overview

The service layer (`src/services/`) encapsulates all business logic, database queries, authentication requests, and cloud storage interactions.

Services return a uniform result contract:
```typescript
export interface ServiceResult<T> {
  data: T | null;
  error: ServiceError | null;
}
```

---

## 2. Service Catalog

### 2.1 `authService`
- **File:** `src/services/authService.ts`
- **Responsibility:** Handles Supabase Auth phone OTP requests, verification, session retrieval, sign out, and auth listeners.
- **Supabase Resources:** `supabase.auth`.

#### Public Functions:
1. `sendPhoneOtp(phone: string): Promise<ServiceResult<{ message: string }>>`
   - **Params:** `phone` (10-digit mobile number or string with international prefix).
   - **Behavior:** Formats to E.164 (`+91...`) and calls `supabase.auth.signInWithOtp({ phone })`. In offline mode, succeeds locally.
   - **Errors:** Returns `errorResult` if network fails or rate limit is reached.
2. `verifyPhoneOtp(phone: string, token: string): Promise<ServiceResult<{ user: User | null; session: Session | null }>>`
   - **Params:** `phone`, `token` (6-digit OTP code).
   - **Behavior:** Calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`. In offline mode, creates a mock User and Session.
3. `getSession(): Promise<ServiceResult<{ user: User | null; session: Session | null }>>`
   - **Behavior:** Retrieves the active cached session via `supabase.auth.getSession()`.
4. `signOut(): Promise<ServiceResult<void>>`
   - **Behavior:** Calls `supabase.auth.signOut()` and purges local storage keys.
5. `onAuthStateChange(callback): () => void`
   - **Behavior:** Subscribes to Supabase auth state change events.

---

### 2.2 `profileService`
- **File:** `src/services/profileService.ts`
- **Responsibility:** Reading and persisting student profiles, mapping between database rows and frontend entities, and computing completion milestones.
- **Supabase Resources:** Table `profiles`.

#### Public Functions:
1. `getProfile(userId: string): Promise<ServiceResult<UserProfile>>`
   - **Params:** `userId` (Supabase auth UUID).
   - **Behavior:** Queries `supabase.from('profiles').select('*').eq('user_id', userId).single()`.
   - **Returns:** Mapped `UserProfile` entity. If no record exists, returns `INITIAL_USER_PROFILE`.
2. `saveProfile(userId: string, updates: Partial<UserProfile>): Promise<ServiceResult<UserProfile>>`
   - **Params:** `userId`, `updates` (Partial profile fields).
   - **Behavior:** Maps fields to database schema via `mapProfileToDb` and executes an `upsert` with `onConflict: 'user_id'`.
3. `isCoreProfileCompleted(profile: UserProfile | null): boolean`
   - **Behavior:** Synchronous validation checking if steps 0 to 8 have all been completed (name, gender, college, age, height, weight, state, year, department, face verification).
4. `isNavratriCompleted(profile: UserProfile | null): boolean`
   - **Behavior:** Checks if festival partner preference, interests, garba level, prompts, and Instagram ID are filled.

---

### 2.3 `onboardingService`
- **File:** `src/services/onboardingService.ts`
- **Responsibility:** Multi-step registration draft persistence and centralized field validation.
- **Resources:** Local browser storage (`stringx_onboarding_draft`).

#### Public Functions:
1. `saveDraft(profile: Partial<UserProfile>): void`
   - **Behavior:** Caches intermediate draft state to survive accidental browser refreshes.
2. `getDraft(): Partial<UserProfile> | null`
   - **Behavior:** Restores cached draft.
3. `clearDraft(): void`
   - **Behavior:** Purges draft on completion.
4. `validateStep(step: number, profile: UserProfile): boolean`
   - **Behavior:** Validates inputs for any specific step `0..17` without coupling to UI components.

---

### 2.4 `storageService`
- **File:** `src/services/storageService.ts`
- **Responsibility:** Uploading user photos to Supabase Storage and generating public asset URLs.
- **Supabase Resources:** Bucket `profile-photos`.

#### Public Functions:
1. `uploadPhoto(fileOrBlob: File | Blob, userId: string, fileNamePrefix?: string): Promise<ServiceResult<{ publicUrl: string; path: string }>>`
   - **Params:** Raw binary file/blob, `userId`, prefix.
   - **Path:** `${userId}/${fileNamePrefix}_${Date.now()}.${ext}`.
   - **Behavior:** Uploads to Supabase Storage and returns `publicUrl`. In offline mode, creates a temporary Object URL.
2. `uploadDataUrl(dataUrl: string, userId: string, fileNamePrefix?: string): Promise<ServiceResult<{ publicUrl: string; path: string }>>`
   - **Behavior:** Converts webcam canvas base64 image strings to Blobs before uploading.

---

### 2.5 `eventService`
- **File:** `src/services/eventService.ts`
- **Responsibility:** Managing campus events and submitting questionnaire vibe answers.
- **Supabase Resources:** Tables `events`, `event_participants`.

#### Public Functions:
1. `getEvents(): Promise<ServiceResult<EventDefinition[]>>`
   - **Behavior:** Returns active campus events list.
2. `getEventById(eventId: string): Promise<ServiceResult<EventDefinition>>`
   - **Behavior:** Returns definition for a specific event.
3. `submitEventAnswers(eventId: string, userId: string, answers: Record<string, any>): Promise<ServiceResult<UserEventRegistration>>`
   - **Behavior:** Saves answers to `event_participants`.
4. `getEventRegistration(eventId: string, userId: string): Promise<ServiceResult<UserEventRegistration | null>>`
   - **Behavior:** Checks whether user has already registered for an event.

---

### 2.6 `matchmakingService`
- **File:** `src/services/matchmakingService.ts`
- **Responsibility:** Match calculation, demo partner sneak peek, and wave dispatching.
- **Supabase Resources:** Table `matches`.

#### Public Functions:
1. `getMatchesForEvent(eventId: string): Promise<ServiceResult<EventMatch[]>>`
   - **Behavior:** Returns candidate matches with compatibility score and shared highlights.
2. `getSneakPeekProfile(): typeof SAMPLE_MATCH_PROFILE`
   - **Behavior:** Returns default demo match profile for reveal countdown.
3. `sendWave(matchId: string): Promise<ServiceResult<{ success: boolean; message: string }>>`
   - **Behavior:** Sends a wave to a potential partner.
