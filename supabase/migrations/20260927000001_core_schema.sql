-- =============================================================================
-- Migration: 20260927000001_core_schema.sql
-- Description: Core schema for STRING X
-- Tables: universities, hostels, courses, interests, profiles, profile_photos, user_interests
-- Standards: PostgreSQL 15+, Supabase Auth integration, strict zero phone duplication
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. UNIVERSITIES
-- Campus institutions supported by STRING X
-- -----------------------------------------------------------------------------
CREATE TABLE public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    campus_code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_universities_name UNIQUE (name),
    CONSTRAINT uq_universities_slug UNIQUE (slug)
);

COMMENT ON TABLE public.universities IS 'Campus institutions and collegiate deployment status';
COMMENT ON COLUMN public.universities.is_active IS 'True if live; false triggers Coming Soon / Not there yet modal';

-- -----------------------------------------------------------------------------
-- 2. HOSTELS
-- Residence halls belonging to specific universities
-- -----------------------------------------------------------------------------
CREATE TABLE public.hostels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender_designation TEXT NOT NULL DEFAULT 'coed',
    is_on_campus BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_hostels_gender CHECK (gender_designation IN ('female', 'male', 'coed')),
    CONSTRAINT uq_hostels_university_name UNIQUE (university_id, name),
    CONSTRAINT uq_hostels_id_university UNIQUE (id, university_id)
);

COMMENT ON TABLE public.hostels IS 'On-campus and off-campus residence halls tied to universities';
COMMENT ON CONSTRAINT uq_hostels_id_university ON public.hostels IS 'Composite key required for cross-university foreign key integrity';

-- -----------------------------------------------------------------------------
-- 3. COURSES
-- Academic degrees and diplomas offered across campuses
-- -----------------------------------------------------------------------------
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    academic_level TEXT NOT NULL DEFAULT 'undergraduate',
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_courses_level CHECK (academic_level IN ('undergraduate', 'postgraduate', 'diploma')),
    CONSTRAINT uq_courses_name_level_university UNIQUE (name, academic_level, university_id)
);

COMMENT ON TABLE public.courses IS 'Academic programs. If university_id is NULL, the degree is universal across campuses';

-- -----------------------------------------------------------------------------
-- 4. INTERESTS
-- Master catalog of lifestyle, cultural, and recreational passions (Page 14)
-- -----------------------------------------------------------------------------
CREATE TABLE public.interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_interests_name UNIQUE (name),
    CONSTRAINT uq_interests_slug UNIQUE (slug)
);

COMMENT ON TABLE public.interests IS 'Catalog of hobbies and interest chips for matching alignment';

-- -----------------------------------------------------------------------------
-- 5. USER CODE GENERATION & PROFILES
-- Sequence for human-readable STRING X user identifier (SX001, SX002, etc.)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE public.user_code_seq START WITH 1 INCREMENT BY 1;

-- Generator function for SX-prefixed zero-padded user codes
CREATE OR REPLACE FUNCTION public.generate_user_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_seq BIGINT;
BEGIN
    v_seq := nextval('public.user_code_seq');
    IF v_seq < 1000 THEN
        RETURN 'SX' || lpad(v_seq::text, 3, '0');
    ELSE
        RETURN 'SX' || v_seq::text;
    END IF;
END;
$$;

COMMENT ON SEQUENCE public.user_code_seq IS 'Monotonic sequence for human-readable user codes (SX001, SX002, ...)';
COMMENT ON FUNCTION public.generate_user_code() IS 'Generates safe, non-colliding human-readable user codes with minimum 3-digit zero padding';

-- -----------------------------------------------------------------------------
-- Core student application profile. Primary key is 1:1 with auth.users(id).
-- ZERO PHONE DUPLICATION: auth.users.phone remains single source of truth.
-- Admin-facing user_code provides human-readable SX001 format.
-- Complete records include height_cm and weight_kg (weight restricted to admin/owner).
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_code TEXT NOT NULL UNIQUE DEFAULT public.generate_user_code(),
    full_name TEXT NOT NULL DEFAULT '',
    nickname TEXT,
    pronouns TEXT,
    gender TEXT NOT NULL DEFAULT '',
    birth_year SMALLINT,
    university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    hostel_id UUID,
    is_day_scholar BOOLEAN NOT NULL DEFAULT false,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    study_year TEXT,
    home_state TEXT,
    height_cm SMALLINT,
    weight_kg NUMERIC(5,2),
    instagram_id TEXT,
    verification_status TEXT NOT NULL DEFAULT 'not_started',
    face_verification_path TEXT,
    face_verified_at TIMESTAMPTZ,
    verification_rejection_reason TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    premium_started_at TIMESTAMPTZ,
    premium_expires_at TIMESTAMPTZ,
    onboarding_status TEXT NOT NULL DEFAULT 'in_progress',
    onboarding_step SMALLINT NOT NULL DEFAULT 1,
    is_profile_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_profiles_user_code CHECK (user_code ~ '^SX[0-9]{3,}$'),
    CONSTRAINT chk_profiles_gender CHECK (gender IN ('', 'Female', 'Male', 'Non-binary', 'Prefer not to say')),
    CONSTRAINT chk_profiles_birth_year CHECK (birth_year IS NULL OR (birth_year >= 1990 AND birth_year <= 2015)),
    CONSTRAINT chk_profiles_height CHECK (height_cm IS NULL OR (height_cm >= 100 AND height_cm <= 250)),
    CONSTRAINT chk_profiles_weight CHECK (weight_kg IS NULL OR (weight_kg >= 30.00 AND weight_kg <= 250.00)),
    CONSTRAINT chk_profiles_verification CHECK (verification_status IN ('not_started', 'pending', 'verified', 'failed')),
    CONSTRAINT chk_profiles_onboarding_status CHECK (onboarding_status IN ('in_progress', 'completed', 'suspended')),
    CONSTRAINT chk_profiles_onboarding_step CHECK (onboarding_step >= 1 AND onboarding_step <= 9),
    CONSTRAINT uq_profiles_user_code UNIQUE (user_code),
    CONSTRAINT fk_profile_university_hostel 
        FOREIGN KEY (hostel_id, university_id) 
        REFERENCES public.hostels(id, university_id) 
        ON DELETE SET NULL
);

COMMENT ON TABLE public.profiles IS 'Primary student record. Keyed directly to auth.users(id) with human-readable user_code and zero phone duplication';
COMMENT ON COLUMN public.profiles.user_code IS 'Admin-facing human-readable unique identifier (SX001, SX002, ...)';
COMMENT ON COLUMN public.profiles.weight_kg IS 'Student weight in kg. Omitted from public/match views; restricted to admin review and account owner';
COMMENT ON COLUMN public.profiles.is_premium IS 'Authoritative active premium flag for Phase 1. Triggers synchronized reveal for match pairs';
COMMENT ON COLUMN public.profiles.premium_expires_at IS 'Retained for future subscription lifecycle and expiration enforcement';
COMMENT ON CONSTRAINT fk_profile_university_hostel ON public.profiles IS 'Guarantees student cannot select a hostel from a different university';

-- -----------------------------------------------------------------------------
-- 6. PROFILE PHOTOS
-- References to student photos stored in Supabase Storage (profile-photos bucket)
-- -----------------------------------------------------------------------------
CREATE TABLE public.profile_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL DEFAULT 'profile-photos',
    storage_path TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    order_index SMALLINT NOT NULL DEFAULT 0,
    upload_status TEXT NOT NULL DEFAULT 'completed',
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_profile_photos_status CHECK (upload_status IN ('pending', 'completed', 'failed'))
);

COMMENT ON TABLE public.profile_photos IS 'Metadata and storage paths for student gallery images';

-- Partial unique index ensuring exactly one primary photo per user
CREATE UNIQUE INDEX idx_profile_photos_primary 
ON public.profile_photos (user_id) 
WHERE is_primary = true;

-- -----------------------------------------------------------------------------
-- 7. USER INTERESTS
-- Junction table mapping students to selected interest chips (Page 14)
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_interests UNIQUE (user_id, interest_id)
);

COMMENT ON TABLE public.user_interests IS 'Junction linking students to their chosen interest chips';

-- -----------------------------------------------------------------------------
-- INDEX RECOMMENDATIONS FOR CORE SCHEMA
-- -----------------------------------------------------------------------------
CREATE INDEX idx_hostels_university_id ON public.hostels (university_id);
CREATE INDEX idx_courses_university_id ON public.courses (university_id);
CREATE INDEX idx_profiles_university_id ON public.profiles (university_id);
CREATE INDEX idx_profiles_course_id ON public.profiles (course_id);
CREATE INDEX idx_profiles_user_code ON public.profiles (user_code);
CREATE INDEX idx_profiles_is_premium ON public.profiles (is_premium);
CREATE INDEX idx_profiles_onboarding_state ON public.profiles (onboarding_status, is_profile_completed);
CREATE INDEX idx_profile_photos_user_id ON public.profile_photos (user_id);
CREATE INDEX idx_user_interests_user_id ON public.user_interests (user_id);
CREATE INDEX idx_user_interests_interest_id ON public.user_interests (interest_id);
