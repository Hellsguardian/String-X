# STRING X — Service Layer Documentation

> **Version:** 3.0.0  
> **Status:** APPROVED ARCHITECTURAL SPECIFICATION (DOMAIN SERVICES & RESULT CONTRACTS)  
> **Location:** `src/services/`  

---

## 1. Overview

The service layer (`src/services/`) encapsulates all business logic, database queries, authentication requests, and cloud storage interactions.

Services return a uniform result contract:
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

## 2. Service Catalog

### 2.1 `authService`
- **File:** `src/services/authService.ts`
- **Responsibility:** Handles Google OAuth requests, email allowlist verification, session retrieval, account deletion RPC, sign out, and auth listeners.
- **Supabase Resources:** `supabase.auth`, `public.allowed_auth_emails`, `public.delete_user_account()`.

#### Public Functions:
1. `signInWithGoogle(): Promise<ServiceResult<{ url?: string }>>`
   - **Behavior:** Dispatches Supabase Google OAuth sign-in flow with redirect options.
2. `isEmailPermitted(email: string): Promise<boolean>`
   - **Behavior:** Evaluates email address validity. **PU EMAIL RESTRICTION: TEMPORARILY PAUSED.** Currently validates any standard email format (`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`) without enforcing the `@paruluniversity.ac.in` domain.
3. `getSession(): Promise<ServiceResult<{ user: User | null; session: Session | null }>>`
   - **Behavior:** Retrieves the active cached session via `supabase.auth.getSession()`.
4. `signOut(): Promise<ServiceResult<void>>`
   - **Behavior:** Calls `supabase.auth.signOut()` and purges local storage keys.
5. `deleteAccount(): Promise<ServiceResult<void>>`
   - **Behavior:** Invokes server-side RPC `public.delete_user_account()`, clears session, and purges user storage files.
6. `sendPhoneOtp(phone: string)` & `verifyPhoneOtp(phone: string, token: string)`
   - **Behavior:** *(Historical/prototype methods retained; phone auth option is locked in the UI).*
7. `onAuthStateChange(callback): () => void`
   - **Behavior:** Subscribes to Supabase auth state change events.

---

### 2.2 `profileService`
- **File:** `src/services/profileService.ts`
- **Responsibility:** Reading and persisting student profiles, mapping between database rows and frontend entities, photo submissions, lookup resolution, and computing completion milestones.
- **Supabase Resources:** Tables `public.profiles`, `public.profile_photos`, `public.verification`, `public.universities`, `public.hostels`, `public.courses`, `public.interests`.
- **Security Boundary:** `getProfile(userId)` can only be called for the authenticated user themselves (`auth.uid() = id`). Querying another user's profile is denied by `public.profiles` RLS. For revealed partner identity on Page 24, the application queries the secure database projection view `public.v_matched_profiles`.

#### Public Functions:
1. `getProfile(userId: string): Promise<ServiceResult<UserProfile>>`
   - **Params:** `userId` (Supabase auth UUID).
   - **Behavior:** Queries `public.profiles` where `id = userId` and latest verification attempt from `public.verification`.
2. `saveProfile(userId: string, updates: Partial<UserProfile>, currentProfile?: UserProfile, step?: number): Promise<ServiceResult<UserProfile>>`
   - **Behavior:** Maps fields to database schema via `mapProfileToDb` and executes an `update` or `upsert`.
3. `savePrimaryPhoto(userId: string, photoDataUrl: string): Promise<ServiceResult<{ publicUrl: string; photoId: string }>>`
   - **Behavior:** Uploads avatar image to `profile-photos` CDN bucket, records `public.profile_photos` row (`is_primary = true`), and triggers DP verification attempt via `submit_dp_verification(UUID)`.
4. `submitFaceVerification(userId: string, photoDataUrl: string, coordinates?: Coordinates): Promise<ServiceResult<{ storagePath: string }>>`
   - **Behavior:** Uploads live selfie to private `verifications` bucket and invokes `public.submit_face_verification(path, lat, lng, acc)`.
5. `completeStudentOnboarding(userId: string): Promise<ServiceResult<{ success: boolean }>>`
   - **Behavior:** Invokes `public.complete_student_onboarding()` RPC to atomically validate fields and set `is_profile_completed = true` and `onboarding_status = 'completed'`.
6. `loadLookups(): Promise<LookupData>`
   - **Behavior:** Fetches universities, hostels, courses, and interests with a 5-second timeout and deterministic static fallbacks.
7. `canUseMatching(profile: UserProfile): boolean`
   - **Behavior:** Evaluates matchmaking eligibility: returns `false` if `verification_status === 'rejected'` (or if DP/Face are explicitly rejected), `true` otherwise.
8. `isRegistrationCompleted(profile: UserProfile | null): boolean`
   - **Behavior:** Checks `onboarding_status === 'completed' || is_profile_completed === true`.
9. `isNavratriCompleted(profile: UserProfile | null): boolean`
   - **Behavior:** Checks if festival partner preference, interests, garba level, prompts, and Instagram ID are completed.

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
- **Responsibility:** Uploading user photos to Supabase Storage (`profile-photos`, `verifications`) and managing file URLs.
- **Supabase Resources:** Buckets `profile-photos`, `verifications`, `event-assets`.

#### Public Functions:
1. `uploadPhoto(fileOrBlob: File | Blob, userId: string, fileNamePrefix?: string): Promise<ServiceResult<{ publicUrl: string; path: string }>>`
   - **Path:** `${userId}/${fileNamePrefix}_${Date.now()}.${ext}` in `profile-photos`.
   - **Behavior:** Uploads to Supabase Storage and returns public CDN URL.
2. `uploadFaceVerificationPhoto(fileOrBlob: File | Blob, userId: string): Promise<ServiceResult<{ path: string }>>`
   - **Path:** `${userId}/face_verification_${Date.now()}.${ext}` in private `verifications` bucket.
   - **Behavior:** Uploads private selfie without generating a public URL.
3. `uploadDataUrl(dataUrl: string, userId: string, fileNamePrefix?: string)`
   - **Behavior:** Converts webcam canvas base64 image strings to Blobs before uploading.

---

### 2.5 `eventService`
- **File:** `src/services/eventService.ts`
- **Responsibility:** Managing campus events, checking database-backed registration status, and submitting questionnaire answers.
- **Supabase Resources:** Tables `public.events`, `public.event_registrations`, `public.event_preferences`, `public.user_interests`.

#### Public Functions:
1. `getEvents(): Promise<ServiceResult<EventDefinition[]>>`
   - **Behavior:** Returns active campus events list.
2. `getEventById(eventId: string): Promise<ServiceResult<EventDefinition>>`
   - **Behavior:** Returns definition for a specific event.
3. `submitEventAnswers(eventId: string, userId: string, answers: Record<string, any>): Promise<ServiceResult<UserEventRegistration>>`
   - **Behavior:** Saves registration in `public.event_registrations`, inlines partner preferences and vibe chips in `public.event_preferences`, and syncs tags to `public.user_interests`.
4. `getEventRegistration(eventId: string, userId: string): Promise<ServiceResult<UserEventRegistration | null>>`
   - **Behavior:** Authoritatively queries `public.event_registrations` and `public.event_preferences` for the user. Does not fall through to global unscoped mock data when Supabase returns no rows.

---

### 2.6 `matchmakingService`
- **File:** `src/services/matchmakingService.ts`
- **Responsibility:** Pair compatibility verification, active match polling, real-time subscription, and reveal state.
- **Supabase Resources:** View `public.v_my_matches`, Table `public.matches`, Table `public.connections`.

#### Public Functions:
1. `checkActiveMatch(userId?: string): Promise<ServiceResult<ActiveMatchResult | null>>`
   - **Behavior:** Queries `public.v_my_matches` and `public.matches` for an active pairing (`status = 'active'`). Resolves pair-level reveal status by querying `public.connections` for `user_a_revealed` and `user_b_revealed`. Sets `isRevealed = true` if and only if **BOTH** connection flags are `true`.
2. `subscribeToMatches(userId: string, onMatchUpdate: (match: any) => void): () => void`
   - **Behavior:** Establishes Supabase Realtime channel subscription listening for PostgreSQL updates to user's match rows.
3. `getMatchesForEvent(eventId: string): Promise<ServiceResult<EventMatch[]>>`
   - **Behavior:** Returns candidate matches with compatibility scores and shared highlights.
4. `getSneakPeekProfile(): typeof SAMPLE_MATCH_PROFILE`
   - **Behavior:** Returns demo match profile for reveal countdown sneak peeks (not used for real revealed matches).
5. `sendWave(matchId: string): Promise<ServiceResult<{ success: boolean; message: string }>>`
   - **Behavior:** Sends a wave to a potential partner.

---

### 2.7 `messagingService`
- **File:** `src/services/messagingService.ts`
- **Responsibility:** Direct 1-to-1 realtime text chat between revealed match participants.
- **Supabase Resources:** Table `public.messages`, Publication `supabase_realtime`, Helper function `public.is_pair_blocked()`.

#### Public Functions:
1. `getMessages(matchId: string): Promise<ServiceResult<MessageItem[]>>`
   - **Behavior:** Fetches up to 100 historical messages for `matchId` in chronological order (`created_at ASC`). Gated by RLS (requires caller participation, active revealed match, and no block).
2. `sendMessage(matchId: string, senderUserId: string, body: string): Promise<ServiceResult<MessageItem>>`
   - **Behavior:** Inserts new message into `public.messages`. Validates non-empty trimmed body and 2,000 character maximum. Enforces `auth.uid() = sender_user_id` via RLS.
3. `subscribeToMessages(matchId: string, onNewMessage: MessageListener, onError?: (err: any) => void): () => void`
   - **Behavior:** Connects to Supabase Realtime channel `messages:${matchId}` listening for `INSERT` events filtered by `match_id=eq.${matchId}`. Returns cleanup unsubscription function calling `supabase.removeChannel(channel)`.
