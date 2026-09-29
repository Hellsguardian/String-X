-- =============================================================================
-- Migration: 20260927000006_seed_data.sql
-- Description: Deterministic initial seed data for STRING X
-- Seed items: Universities, Parul Hostels, Standard Courses, Catalog Interests, Navratri 2026 Event
-- Standards: Idempotent upserts (ON CONFLICT DO NOTHING / UPDATE)
-- =============================================================================

DO $$
DECLARE
    v_parul_id UUID;
    v_sumandeep_id UUID;
BEGIN

-- -----------------------------------------------------------------------------
-- 1. SEED UNIVERSITIES
-- -----------------------------------------------------------------------------
INSERT INTO public.universities (name, slug, city, state, campus_code, is_active)
VALUES 
    ('Parul University', 'parul-university', 'Vadodara', 'Gujarat', 'PU', true),
    ('Sumandeep Vidyapeeth', 'sumandeep-vidyapeeth', 'Piparia, Vadodara', 'Gujarat', 'SV', false)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    campus_code = EXCLUDED.campus_code,
    is_active = EXCLUDED.is_active;

SELECT id INTO v_parul_id FROM public.universities WHERE slug = 'parul-university';
SELECT id INTO v_sumandeep_id FROM public.universities WHERE slug = 'sumandeep-vidyapeeth';

-- -----------------------------------------------------------------------------
-- 2. SEED PARUL UNIVERSITY HOSTELS
-- Female Hostels
-- -----------------------------------------------------------------------------
INSERT INTO public.hostels (university_id, name, gender_designation, is_on_campus, display_order)
VALUES 
    (v_parul_id, 'Sarojini Bhawan', 'female', true, 1),
    (v_parul_id, 'Indira Bhawan', 'female', true, 2),
    (v_parul_id, 'Teresa Bhawan', 'female', true, 3),
    (v_parul_id, 'Janki Bhawan', 'female', true, 4),
    (v_parul_id, 'Kalpana Bhawan', 'female', true, 5),
    (v_parul_id, 'Shakuntala Bhawan', 'female', true, 6),
    (v_parul_id, 'Rani Laxmibai Bhawan', 'female', true, 7),
    (v_parul_id, 'Abraham Lincoln (Girls Wing)', 'female', true, 8),
    (v_parul_id, 'Ratan Tata Bhawan (Girls Wing)', 'female', true, 9),
    (v_parul_id, 'Other / Off Campus (Girls)', 'female', false, 10)
ON CONFLICT (university_id, name) DO NOTHING;

-- Male Hostels
INSERT INTO public.hostels (university_id, name, gender_designation, is_on_campus, display_order)
VALUES 
    (v_parul_id, 'Shastri Bhawan', 'male', true, 1),
    (v_parul_id, 'Kalam Bhawan', 'male', true, 2),
    (v_parul_id, 'Tagore Bhawan', 'male', true, 3),
    (v_parul_id, 'Dhyan Bhawan', 'male', true, 4),
    (v_parul_id, 'Sardar Bhawan', 'male', true, 5),
    (v_parul_id, 'Milkha Bhawan', 'male', true, 6),
    (v_parul_id, 'Atal Bhawan', 'male', true, 7),
    (v_parul_id, 'Azad Bhawan', 'male', true, 8),
    (v_parul_id, 'Tilak Bhawan', 'male', true, 9),
    (v_parul_id, 'Abraham Lincoln (Boys Wing)', 'male', true, 10),
    (v_parul_id, 'Ratan Tata Bhawan (Boys Wing)', 'male', true, 11),
    (v_parul_id, 'Other / Off Campus (Boys)', 'male', false, 12)
ON CONFLICT (university_id, name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. SEED STANDARD COURSES (UNDERGRADUATE & POSTGRADUATE)
-- -----------------------------------------------------------------------------
-- Undergraduate Courses
INSERT INTO public.courses (name, academic_level, is_popular, display_order)
VALUES 
    ('B.Tech', 'undergraduate', true, 1),
    ('BCA', 'undergraduate', true, 2),
    ('BBA', 'undergraduate', true, 3),
    ('B.Com', 'undergraduate', true, 4),
    ('B.Sc', 'undergraduate', true, 5),
    ('B.Pharm', 'undergraduate', false, 6),
    ('B.Sc Nursing', 'undergraduate', false, 7),
    ('BPT', 'undergraduate', false, 8),
    ('B.Sc Agriculture', 'undergraduate', false, 9),
    ('B.Arch', 'undergraduate', false, 10),
    ('B.A.', 'undergraduate', false, 11),
    ('B.Des', 'undergraduate', false, 12),
    ('BAMS', 'undergraduate', false, 13),
    ('BHMS', 'undergraduate', false, 14),
    ('Diploma', 'undergraduate', false, 15),
    ('Other Undergraduate', 'undergraduate', false, 99)
ON CONFLICT (name, academic_level, university_id) DO NOTHING;

-- Postgraduate Courses
INSERT INTO public.courses (name, academic_level, is_popular, display_order)
VALUES 
    ('MBA', 'postgraduate', true, 1),
    ('MCA', 'postgraduate', true, 2),
    ('M.Tech', 'postgraduate', true, 3),
    ('M.Sc', 'postgraduate', true, 4),
    ('M.Com', 'postgraduate', true, 5),
    ('M.Pharm', 'postgraduate', false, 6),
    ('M.A.', 'postgraduate', false, 7),
    ('MPT', 'postgraduate', false, 8),
    ('M.Sc Nursing', 'postgraduate', false, 9),
    ('LL.M', 'postgraduate', false, 10),
    ('M.Des', 'postgraduate', false, 11),
    ('M.Arch', 'postgraduate', false, 12),
    ('MD / MS', 'postgraduate', false, 13),
    ('Other Postgraduate', 'postgraduate', false, 99)
ON CONFLICT (name, academic_level, university_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. SEED CAMPUS INTERESTS
-- -----------------------------------------------------------------------------
INSERT INTO public.interests (name, slug, category, icon)
VALUES 
    ('Late Night Chai', 'late-night-chai', 'Lifestyle', '☕'),
    ('Gaming', 'gaming', 'Lifestyle', '🎮'),
    ('Anime', 'anime', 'Lifestyle', '⛩️'),
    ('Movies', 'movies', 'Entertainment', '🎬'),
    ('Music', 'music', 'Creative', '🎵'),
    ('Dance', 'dance', 'Creative', '💃'),
    ('Photography', 'photography', 'Creative', '📸'),
    ('Fitness & Gym', 'fitness-gym', 'Sports', '💪'),
    ('Sports', 'sports', 'Sports', '⚽'),
    ('Coding', 'coding', 'Lifestyle', '💻'),
    ('Food & Cafés', 'food-cafes', 'Lifestyle', '🍜'),
    ('Travel & Trips', 'travel-trips', 'Lifestyle', '✈️'),
    ('Content Creation & Reels', 'content-creation', 'Creative', '📱'),
    ('Reading', 'reading', 'Lifestyle', '📚'),
    ('Art & Design', 'art-design', 'Creative', '🎨'),
    ('Making New Friends', 'making-friends', 'Social', '🤝')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon;

-- -----------------------------------------------------------------------------
-- 5. SEED NAVRATRI 2026 EVENT
-- -----------------------------------------------------------------------------
INSERT INTO public.events (
    slug, 
    title, 
    tagline, 
    short_desc, 
    university_id, 
    category, 
    emoji, 
    start_date, 
    end_date, 
    countdown_target, 
    location, 
    status, 
    is_active
)
VALUES (
    'pu-navratri-2026',
    'NAVRATRI 2026',
    '9 Nights. Infinite Strings.',
    'Find your Garba partner for Vadodara''s biggest collegiate Navratri celebration.',
    v_parul_id,
    'cultural',
    '🪩',
    '2026-10-10 18:00:00+05:30',
    '2026-10-19 02:00:00+05:30',
    '2026-10-10 18:00:00+05:30',
    'Parul University Campus Ground, Vadodara',
    'active',
    true
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    tagline = EXCLUDED.tagline,
    short_desc = EXCLUDED.short_desc,
    university_id = EXCLUDED.university_id,
    category = EXCLUDED.category,
    emoji = EXCLUDED.emoji,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    countdown_target = EXCLUDED.countdown_target,
    location = EXCLUDED.location,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active;

END $$;
