# STRING X — Troubleshooting & Diagnostics Guide

This document lists common issues, root causes, and verified solutions across authentication, Supabase connectivity, build tools, camera access, and routing.

---

## 1. Authentication & OTP Issues

### Issue: OTP Code Never Arrives
- **Symptom:** User inputs 10-digit mobile number, bottom sheet opens, but no SMS is received.
- **Cause:**
  1. Supabase Auth SMS provider (e.g. Twilio / Twilio Verify) is not configured or has exhausted credits.
  2. The project is running without live Supabase credentials, where OTP is operating in offline mock simulation.
- **Solution:**
  1. In local dev / offline mode, enter any 6 digits (e.g. `123456`) to complete mock authentication.
  2. For live production, navigate to **Supabase Dashboard** $\to$ **Authentication** $\to$ **Providers** $\to$ **Phone**, ensure Phone Provider is enabled, and verify SMS API credentials.

---

### Issue: Existing User Trapped in Onboarding Loop
- **Symptom:** An existing user logs in with an already completed profile, but is shown Step 01 (Name & Gender) instead of Screen 12 (Home).
- **Cause:** `profileService.isCoreProfileCompleted(profile)` evaluates to `false` because one or more mandatory profile fields (e.g. `isFaceVerified`, `heightCm`, `collegeYear`) are null or zero in the database.
- **Solution:**
  1. Check the student's row in PostgreSQL:
     ```sql
     SELECT id, full_name, is_face_verified, height_cm, college_year, department 
     FROM public.profiles 
     WHERE user_id = '<user-id>';
     ```
  2. Ensure all 9 core onboarding fields have non-empty values.

---

## 2. Supabase Database & RLS Errors

### Issue: PostgreSQL 403 Forbidden / RLS Violation on Upsert
- **Symptom:** Console logs `new row violates row-level security policy for table "profiles"`.
- **Cause:**
  1. The user's active session token does not match the `user_id` specified in the profile payload (`auth.uid() != user_id`).
  2. User is unauthenticated (anonymous session) when calling `saveProfile()`.
- **Solution:**
  1. In `src/services/profileService.ts`, verify `mapProfileToDb` attaches the authenticated user's ID:
     ```typescript
     user_id: userId
     ```
  2. Ensure the RLS policy permits upsert with `auth.uid() = user_id`:
     ```sql
     CREATE POLICY "profiles_upsert_own" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
     ```

---

## 3. Storage & Camera Upload Errors

### Issue: Face Verification Camera Fails to Initialize
- **Symptom:** Red banner displaying "Camera access denied or unavailable".
- **Cause:**
  1. Browser blocked WebRTC webcam permissions.
  2. App is served over plain HTTP (`http://<ip>:3000`) instead of `localhost` or HTTPS. Browsers block `navigator.mediaDevices.getUserMedia` on insecure origins.
- **Solution:**
  1. Access the app via `http://localhost:3000/` or deploy with an SSL certificate.
  2. Click the camera lock icon in the browser address bar and grant camera permissions.

### Issue: Profile Photo Fails to Upload to Supabase Storage
- **Symptom:** Console reports `Bucket 'profile-photos' not found` or `403 Access Denied`.
- **Cause:**
  1. The storage bucket `profile-photos` has not been created in the Supabase Dashboard.
  2. Storage RLS policies do not allow authenticated uploads into `${userId}/*`.
- **Solution:**
  1. In Supabase Dashboard $\to$ **Storage**, create a new bucket named `profile-photos` and set it to **Public**.
  2. Run the storage RLS script documented in `docs/storage.md`.

---

## 4. Build & Environment Variable Issues

### Issue: `npm install` Peer Dependency Conflict (`esbuild`)
- **Symptom:** `npm error ERESOLVE could not resolve peerOptional esbuild`.
- **Cause:** Vite 8 and Tailwind CSS v4 have overlapping peer dependencies on newer esbuild minor versions.
- **Solution:**
  Always install with `--legacy-peer-deps`:
  ```bash
  npm install --legacy-peer-deps
  ```

### Issue: `VITE_SUPABASE_URL` Not Defined in Production
- **Symptom:** App stays in mock fallback mode in production.
- **Cause:** Environment variables were added without the `VITE_` prefix or were not exposed in the hosting platform's build settings.
- **Solution:**
  Ensure variables are named exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and trigger a clean rebuild.
