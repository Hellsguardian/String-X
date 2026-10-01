# STRING X — Troubleshooting & Diagnostics Guide

> **Version:** 3.0.0  
> **Status:** APPROVED ARCHITECTURAL SPECIFICATION (DIAGNOSTICS & VERIFIED RESOLUTIONS)  

---

This document lists common issues, root causes, and verified solutions across authentication, Supabase connectivity, build tools, camera access, and routing.

---

## 1. Authentication & Google OAuth Issues

### Issue: "Parul University Account Required" Error Notice on Sign-In
- **Symptom:** User clicks "Continue with Google", authenticates with their Google account, but is redirected back to Landing Page with modal notice: *"StringX is currently available only to Parul University students and approved developer accounts."*
- **Cause:** The Google email is not an official Parul University student address (`^[0-9]+@paruluniversity\.ac\.in$`) and is not present in `public.allowed_auth_emails`.
- **Solution:**
  1. For students: Sign in using your official `@paruluniversity.ac.in` student email.
  2. For developers / QA testers: Add the test email into `public.allowed_auth_emails` via the Supabase Dashboard SQL Editor:
     ```sql
     INSERT INTO public.allowed_auth_emails (email) VALUES ('developer@example.com') ON CONFLICT DO NOTHING;
     ```

---

### Issue: Intermittent "LOADING YOUR PROFILE..." Startup Deadlock
- **Symptom:** On initial application load or refresh, the app intermittently remains indefinitely on the profile loading screen.
- **Cause:** Duplicate concurrent `loadUserProfile` requests or unhandled rejection during lookup loading racing with auth state initialization.
- **Solution:**
  1. Ensure `AuthContext.tsx` includes promise deduplication (`inFlightProfilePromiseRef`) and the 8-second safety timeout.
  2. Ensure `loadLookups()` in `profileService.ts` contains bounded timeouts and static fallback data.

---

## 2. Onboarding & Registration Issues

### Issue: Face Verification Requires Geolocation
- **Symptom:** Submitting face verification fails with alert *"Please enable GPS location and retake your selfie"*.
- **Cause:** `submit_face_verification` RPC strictly requires non-null geolocation telemetry (`latitude`, `longitude`, `accuracy_m`) as a secondary security signal.
- **Solution:**
  1. Grant browser location permissions when prompted on Step 09.
  2. In development or local preview, the camera automatically captures browser coordinates or fallback coordinates.

---

### Issue: "Find My Match" Routing to Questionnaire Instead of Radar
- **Symptom:** User clicks "Find My Match" from Home (Page 12) and is routed to Step 09 (Partner Preference) instead of Radar.
- **Cause:** The student has not yet submitted their Navratri event questionnaire (`event_registrations` and `event_preferences` row not found in database).
- **Solution:** Complete the 9-step Navratri questionnaire to save the event registration. Once completed:
  - If `matched_with` is `NULL` $\to$ routes to Page 22 (Radar / `AppRoute.SUCCESS`).
  - If `matched_with` is assigned $\to$ routes to Page 23 (Countdown / `AppRoute.COUNTDOWN`).

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

---

### Issue: Profile Photo Fails to Upload to Supabase Storage
- **Symptom:** Console reports `Bucket 'profile-photos' not found` or `403 Access Denied`.
- **Cause:**
  1. The storage bucket `profile-photos` has not been created or configured in the Supabase Dashboard.
  2. Storage RLS policies do not allow authenticated uploads into `${userId}/*`.
- **Solution:**
  1. In Supabase Dashboard $\to$ **Storage**, ensure buckets `profile-photos` (Public), `verifications` (Private), and `event-assets` (Public) exist.
  2. Apply the storage RLS migration documented in `supabase/migrations/20260927000005_storage.sql`.

---

## 4. Build & Environment Variable Issues

### Issue: `npm install` Peer Dependency Conflict (`esbuild`)
- **Symptom:** `npm error ERESOLVE could not resolve peerOptional esbuild`.
- **Cause:** Vite 8 and Tailwind CSS v4 have overlapping peer dependencies on newer esbuild minor versions.
- **Solution:** Always install with `--legacy-peer-deps`:
  ```bash
  npm install --legacy-peer-deps
  ```

---

### Issue: `VITE_SUPABASE_URL` Not Defined in Production
- **Symptom:** App operates in mock fallback mode in production.
- **Cause:** Environment variables were added without the `VITE_` prefix or were not exposed in the hosting platform's build settings.
- **Solution:** Ensure variables are named exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and trigger a clean rebuild.
