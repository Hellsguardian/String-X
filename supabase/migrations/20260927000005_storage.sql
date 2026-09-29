-- =============================================================================
-- Migration: 20260927000005_storage.sql
-- Description: Supabase Storage buckets and security access policies
-- Buckets: profile-photos (public CDN), verifications (strictly private), event-assets (public CDN)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATE STORAGE BUCKETS
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'profile-photos', 
        'profile-photos', 
        true, 
        5242880, -- 5 MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    ),
    (
        'verifications', 
        'verifications', 
        false, -- Strictly private
        5242880, -- 5 MB limit
        ARRAY['image/jpeg', 'image/png']
    ),
    (
        'event-assets', 
        'event-assets', 
        true, 
        10485760, -- 10 MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- 2. STORAGE RLS POLICIES FOR 'profile-photos' (PUBLIC CDN WITH USER ISOLATION)
-- -----------------------------------------------------------------------------

-- Public Read: Anyone can view avatars through CDN
CREATE POLICY "Public read access for profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Authenticated Upload: Users can only upload into their own folder ({user_id}/*)
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated Update: Users can only modify photos in their own folder
CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'profile-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated Delete: Users can only delete photos from their own folder
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- -----------------------------------------------------------------------------
-- 3. STORAGE RLS POLICIES FOR 'verifications' (STRICTLY PRIVATE)
-- Never exposed via public CDN. Readable only by owner and service_role.
-- -----------------------------------------------------------------------------

-- Private Read: Restricted to the student who uploaded the selfie (or service_role)
CREATE POLICY "Users can view own verification selfies"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'verifications' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin Read: Administrators can view all verification selfies for student verification review
CREATE POLICY "Admins can view all verification selfies"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'verifications' 
    AND public.is_admin()
);

-- Private Upload: Student can upload selfie only to their own folder
CREATE POLICY "Users can upload own verification selfies"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'verifications' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- -----------------------------------------------------------------------------
-- 4. STORAGE RLS POLICIES FOR 'event-assets' (PUBLIC CDN)
-- Read-only for clients; uploads and management permitted for administrators.
-- -----------------------------------------------------------------------------

CREATE POLICY "Public read access for event assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-assets');

CREATE POLICY "Admins can manage event assets"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'event-assets'
    AND public.is_admin()
)
WITH CHECK (
    bucket_id = 'event-assets'
    AND public.is_admin()
);
