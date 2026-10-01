# STRING X — Cloud Storage Architecture

> **Version:** 3.0.0  
> **Status:** APPROVED ARCHITECTURAL SPECIFICATION (MULTI-BUCKET ISOLATION)  
> **Target Engine:** Supabase Storage (S3-compatible)  

---

## 1. Storage Overview

STRING X utilizes **Supabase Storage** for managing binary media across three isolated buckets:

```
┌────────────────────────────────────────────────────────────────────────┐
│                       SUPABASE STORAGE ARCHITECTURE                    │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ BUCKET NAME       │ ACCESS POLICY     │ SECURITY OBJECTIVE             │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ `profile-photos`  │ Public CDN Read   │ Avatars & Profile pictures     │
│ `verifications`   │ Strictly Private  │ Biometric selfie evidence      │
│ `event-assets`    │ Public CDN Read   │ Festival banners & promo media │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

**Critical Architectural Rule:**
Binary image blobs must **NEVER** be stored directly inside PostgreSQL columns. PostgreSQL only stores the sanitized URL or bucket storage path reference (`storage_path`, `face_verification_path`).

---

## 2. Bucket Configurations

### 2.1 `profile-photos` Bucket (Public CDN)
- **Access Level:** Public read, Authenticated owner upload/delete.
- **Max File Size:** 5 MB.
- **Accepted MIME Types:** `image/jpeg`, `image/png`, `image/webp`.
- **File Path Convention:** `${userId}/photo_${timestamp}.${ext}`.
- **Usage:** Main profile picture uploaded on Onboarding Step 04 (`Step04Photo`) and managed via `public.profile_photos`.

### 2.2 `verifications` Bucket (Strictly Private)
- **Access Level:** **Strictly Private.** Zero public CDN access. Authenticated owner upload; read permitted only to account owner and verified administrators (`public.is_admin()`).
- **Max File Size:** 5 MB.
- **Accepted MIME Types:** `image/jpeg`, `image/png`.
- **File Path Convention:** `${userId}/face_verification_${timestamp}.${ext}`.
- **Usage:** Live biometric selfies captured on Step 09 (`Step09FaceVerification`). Path referenced in `public.verification.face_verification_path`.
- **Privacy Guarantee:** Verification selfies are NEVER used as public avatars, cards, or match imagery.

### 2.3 `event-assets` Bucket (Public CDN)
- **Access Level:** Public read, Admin-only upload/delete (`public.is_admin()`).
- **Max File Size:** 10 MB.
- **Accepted MIME Types:** `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`.
- **Usage:** Festival banners, festival posters, and promotional graphics.

---

## 3. Storage Security & RLS Policies

Configured in Supabase SQL:

```sql
-- 1. profile-photos: Public read
CREATE POLICY "profile_photos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- 2. profile-photos: Owner upload
CREATE POLICY "profile_photos_owner_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. verifications: Private read (Owner + Admin)
CREATE POLICY "verifications_private_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verifications' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    public.is_admin() = true
  )
);

-- 4. verifications: Owner upload
CREATE POLICY "verifications_owner_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verifications' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 4. Offline / Mock Mode Handling

In `src/services/storageService.ts`:
- If Supabase environment variables are missing or unconfigured, `uploadPhoto()` automatically invokes `URL.createObjectURL(fileOrBlob)`.
- If an image is passed as a data URL (webcam capture), it returns the data URL directly in local development.
- The UI components remain completely agnostic to cloud storage latency or configuration.
