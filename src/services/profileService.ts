import { supabase } from '../lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase/env';
import { UserProfile, DatabaseProfile } from '../types/user';
import { ServiceResult, successResult, errorResult } from '../types/api';
import { INITIAL_USER_PROFILE } from '../data/mockData';
import { storageService } from './storageService';

const MOCK_PROFILE_STORAGE_KEY = 'stringx_mock_user_profile';

// =============================================================================
// DATABASE LOOKUP TYPES & IN-MEMORY CACHE
// =============================================================================

interface UniversityLookup {
  id: string;
  name: string;
  slug: string;
}

interface HostelLookup {
  id: string;
  name: string;
  university_id: string;
  gender_designation: string;
}

interface CourseLookup {
  id: string;
  name: string;
  academic_level: string;
}

let cachedUniversities: UniversityLookup[] | null = null;
let cachedHostels: HostelLookup[] | null = null;
let cachedCourses: CourseLookup[] | null = null;
let lookupLoadPromise: Promise<void> | null = null;

/**
 * Loads lookup tables (universities, hostels, courses) from Supabase once and caches them.
 */
export async function loadLookups(): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (cachedUniversities && cachedHostels && cachedCourses) return;
  if (lookupLoadPromise) return lookupLoadPromise;

  lookupLoadPromise = (async () => {
    try {
      const [uniRes, hostelRes, courseRes] = await Promise.all([
        supabase.from('universities').select('id, name, slug'),
        supabase.from('hostels').select('id, name, university_id, gender_designation'),
        supabase.from('courses').select('id, name, academic_level'),
      ]);

      if (uniRes.data) cachedUniversities = uniRes.data as UniversityLookup[];
      if (hostelRes.data) cachedHostels = hostelRes.data as HostelLookup[];
      if (courseRes.data) cachedCourses = courseRes.data as CourseLookup[];
    } catch (err) {
      console.warn('[profileService] Failed to load lookup tables:', err);
    } finally {
      lookupLoadPromise = null;
    }
  })();

  return lookupLoadPromise;
}

// Kick off eager preload in background if configured
if (typeof window !== 'undefined' && isSupabaseConfigured) {
  loadLookups();
}

// Seeded university UUID lookup for resilient resolution
const SEEDED_UNIVERSITIES: Record<string, string> = {
  'parul university': '110b37d5-599c-4921-be80-17645f3b36b8',
  'parul': '110b37d5-599c-4921-be80-17645f3b36b8',
  'sumandeep vidyapeeth': '5886d28b-2338-4ed0-b059-73324098b942',
  'sumandeep': '5886d28b-2338-4ed0-b059-73324098b942',
};

/**
 * Resolves frontend collegeName (e.g. 'Parul University') to public.universities(id).
 * Normalizes whitespace, compares case-insensitively, and supports seeded universities.
 */
export function resolveUniversityId(name?: string): string | null {
  if (!name) return null;
  const clean = name.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!clean) return null;

  // 1. Check cachedUniversities loaded from database
  if (cachedUniversities && cachedUniversities.length > 0) {
    const found = cachedUniversities.find((u) => {
      const uName = u.name.trim().replace(/\s+/g, ' ').toLowerCase();
      const uSlug = (u.slug || '').trim().toLowerCase();
      return (
        uName === clean ||
        uSlug === clean ||
        uSlug === clean.replace(/\s+/g, '-') ||
        uName.includes(clean) ||
        clean.includes(uName)
      );
    });
    if (found) return found.id;
  }

  // 2. Resilient static fallback to seeded university UUIDs
  if (SEEDED_UNIVERSITIES[clean]) {
    return SEEDED_UNIVERSITIES[clean];
  }
  for (const [key, id] of Object.entries(SEEDED_UNIVERSITIES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return id;
    }
  }

  return null;
}

export function resolveUniversityName(id?: string | null): string {
  if (!id) return 'Parul University';
  if (cachedUniversities && cachedUniversities.length > 0) {
    const found = cachedUniversities.find((u) => u.id === id);
    if (found?.name) return found.name;
  }
  if (id === '110b37d5-599c-4921-be80-17645f3b36b8') return 'Parul University';
  if (id === '5886d28b-2338-4ed0-b059-73324098b942') return 'Sumandeep Vidyapeeth';
  return 'Parul University';
}

/**
 * Resolves frontend hostel name and gender to public.hostels(id)
 */
export function resolveHostelId(name?: string, gender?: string): string | null {
  if (!name || !cachedHostels) return null;
  const clean = name.trim().toLowerCase();

  // 1. Exact match
  const exact = cachedHostels.find((h) => h.name.toLowerCase() === clean);
  if (exact) return exact.id;

  // 2. Gender-based wing match (e.g. Abraham Lincoln, Ratan Tata, Other / Off Campus)
  const isFemale = (gender || '').toLowerCase() === 'female';
  const targetGender = isFemale ? 'female' : 'male';
  const wingMatch = cachedHostels.find(
    (h) => h.gender_designation === targetGender && h.name.toLowerCase().startsWith(clean)
  );
  return wingMatch?.id || null;
}

export function resolveHostelName(id?: string | null): string {
  if (!id || !cachedHostels) return '';
  const found = cachedHostels.find((h) => h.id === id);
  if (!found) return '';
  return found.name
    .replace(' (Girls Wing)', '')
    .replace(' (Boys Wing)', '')
    .replace(' (Girls)', '')
    .replace(' (Boys)', '');
}

/**
 * Resolves frontend department name to public.courses(id)
 */
export function resolveCourseId(name?: string, year?: string): string | null {
  if (!name || !cachedCourses) return null;
  const clean = name.trim().toLowerCase();
  const exact = cachedCourses.find((c) => c.name.toLowerCase() === clean);
  if (exact) return exact.id;

  if (clean === 'other') {
    const isPg = year === 'PG' || year === '4th Year / PG';
    const target = isPg ? 'other postgraduate' : 'other undergraduate';
    const other = cachedCourses.find((c) => c.name.toLowerCase() === target);
    return other?.id || null;
  }
  return null;
}

export function resolveCourseName(id?: string | null): string {
  if (!id || !cachedCourses) return '';
  const found = cachedCourses.find((c) => c.id === id);
  if (!found) return '';
  if (found.name === 'Other Undergraduate' || found.name === 'Other Postgraduate') {
    return 'Other';
  }
  return found.name;
}

// =============================================================================
// =============================================================================
// DOMAIN <-> DATABASE MAPPERS
// =============================================================================

/**
 * Maps frontend application domain UserProfile to strictly valid public.profiles UPDATE columns.
 * Only sends columns permitted by GRANT UPDATE on public.profiles:
 * full_name, gender, birth_year, university_id, hostel_id, course_id,
 * study_year, home_state, height_cm, weight_kg, instagram_id, onboarding_step.
 *
 * CRITICAL: Incremental updates only produce keys for fields explicitly passed in `updates`,
 * preventing unmentioned fields from being reconstructed or erased with empty/default values.
 */
export function mapProfileToDb(
  updates: Partial<UserProfile>,
  fullProfile?: Partial<UserProfile>,
  step?: number
): Record<string, any> {
  const dbPayload: Record<string, any> = {};

  // Full Name: Only update if a valid non-empty name string is provided
  if (updates.fullName !== undefined) {
    const trimmed = String(updates.fullName).trim();
    if (trimmed.length > 0) {
      dbPayload.full_name = trimmed;
    }
  }

  // Gender
  if (updates.gender !== undefined && updates.gender !== '') {
    dbPayload.gender = updates.gender;
  }

  // Age -> birth_year (currentYear - age). Must be between 1990 and 2015.
  if (updates.age !== undefined && updates.age >= 15 && updates.age <= 35) {
    const currentYear = new Date().getFullYear();
    const calculatedYear = currentYear - updates.age;
    if (calculatedYear >= 1990 && calculatedYear <= 2015) {
      dbPayload.birth_year = calculatedYear;
    }
  }

  // Home State
  if (updates.homeState !== undefined && updates.homeState.trim().length > 0) {
    dbPayload.home_state = updates.homeState.trim();
  }

  // Study Year (collegeYear)
  if (updates.collegeYear !== undefined && updates.collegeYear !== '') {
    dbPayload.study_year = updates.collegeYear;
  }

  // Height (cm): Safe integer conversion, validated 100-250 cm
  if (updates.heightCm !== undefined && updates.heightCm !== null && (updates.heightCm as any) !== '') {
    const parsedHeight = typeof updates.heightCm === 'string'
      ? parseInt(updates.heightCm, 10)
      : Math.round(Number(updates.heightCm));
    if (!isNaN(parsedHeight) && parsedHeight >= 100 && parsedHeight <= 250) {
      dbPayload.height_cm = parsedHeight;
    }
  }

  // Weight (kg): Safe numeric conversion, validated 30.00-250.00 kg (PostgreSQL NUMERIC(5,2))
  if (updates.weightKg !== undefined && updates.weightKg !== null && (updates.weightKg as any) !== '') {
    const parsedWeight = typeof updates.weightKg === 'string'
      ? parseFloat(updates.weightKg)
      : Number(updates.weightKg);
    if (!isNaN(parsedWeight) && parsedWeight >= 30 && parsedWeight <= 250) {
      dbPayload.weight_kg = Math.round(parsedWeight * 100) / 100;
    }
  }

  // Instagram ID: Optional handle
  if (updates.instagramId !== undefined) {
    const raw = updates.instagramId ? updates.instagramId.trim().replace(/^@+/, '') : '';
    dbPayload.instagram_id = raw ? `@${raw}` : null;
  }

  // University FK resolution: Check if collegeName is in this update, or if hostel is being updated
  const candidateCollegeName = updates.collegeName !== undefined && updates.collegeName !== null
    ? updates.collegeName
    : (updates.hostel ? (fullProfile?.collegeName || 'Parul University') : undefined);

  if (candidateCollegeName !== undefined) {
    const trimmedCollege = candidateCollegeName.trim();
    if (trimmedCollege.length > 0) {
      const uniId = resolveUniversityId(trimmedCollege);
      if (uniId) {
        dbPayload.university_id = uniId;
        console.log(`[UNIVERSITY_SAVE] selected university: "${trimmedCollege}", resolved university_id: "${uniId}", payload: university_id="${uniId}"`);
      } else {
        console.error(`[UNIVERSITY_SAVE] ERROR: Failed to resolve university name: "${trimmedCollege}". Unresolved university name: "${trimmedCollege}". Preserving existing database value.`);
      }
    }
  }

  // Hostel FK resolution: Only if hostel is provided in this update
  if (updates.hostel !== undefined && updates.hostel.trim().length > 0) {
    const gender = updates.gender ?? fullProfile?.gender;
    const hId = resolveHostelId(updates.hostel, gender);
    if (hId) {
      dbPayload.hostel_id = hId;
    }
  }

  // Course FK resolution: Only if department is provided in this update
  if (updates.department !== undefined && updates.department.trim().length > 0) {
    const year = updates.collegeYear ?? fullProfile?.collegeYear;
    const cId = resolveCourseId(updates.department, year);
    if (cId) {
      dbPayload.course_id = cId;
    }
  }

  // Onboarding Step (bounded between 1 and 9 per chk_profiles_onboarding_step)
  if (step !== undefined && step >= 0 && step <= 8) {
    dbPayload.onboarding_step = Math.min(9, Math.max(1, step + 1));
  }

  return dbPayload;
}

/**
 * Maps database schema row to frontend application domain UserProfile
 */
export function mapDbToProfile(
  db: DatabaseProfile | Record<string, any>,
  primaryPhotoUrl?: string
): UserProfile {
  const currentYear = new Date().getFullYear();
  const birthYear = db.birth_year ? Number(db.birth_year) : null;
  const age = birthYear ? Math.max(15, currentYear - birthYear) : 0;

  return {
    collegeEmail: '',
    phone: (db as any).phone || '',
    collegeName: resolveUniversityName(db.university_id),
    hostel: resolveHostelName(db.hostel_id),
    fullName: db.full_name || '',
    age,
    // Sourced strictly from dedicated profile photo, NEVER from face verification or Google OAuth
    photoUrl: primaryPhotoUrl || (db as any).photo_url || '',
    additionalPhotos: (db as any).additional_photos || [],
    gender: (db.gender as UserProfile['gender']) || '',
    heightCm: db.height_cm || 0,
    weightKg: db.weight_kg ? Number(db.weight_kg) : 0,
    homeState: db.home_state || '',
    collegeYear: (db.study_year as UserProfile['collegeYear']) || ((db as any).college_year as UserProfile['collegeYear']) || '',
    department: resolveCourseName(db.course_id),
    faceVerificationPhoto: db.face_verification_path || (db as any).face_verification_photo || '',
    isFaceVerified: Boolean(db.face_verification_path || db.verification_status === 'verified' || db.verification_status === 'pending'),
    garbaLevel: (db as any).garba_level || '',
    garbaLevelTitle: '',
    garbaEnergy: (db as any).garba_energy || '',
    navratriVibes: (db as any).navratri_vibes || [],
    interests: (db as any).interests || [],
    favouriteEveningSpot: (db as any).favourite_evening_spot || '',
    navratriExcitement: (db as any).navratri_excitement ?? 50,
    partnerGenderPreference: ((db as any).partner_gender_preference as UserProfile['partnerGenderPreference']) || '',
    partnerVibePreference: (db as any).partner_vibe_preference || '',
    answerLastRound: (db as any).answer_last_round || '',
    answerPersonality: (db as any).answer_personality || '',
    answerPartnerNewStep: (db as any).answer_partner_new_step || '',
    instagramId: db.instagram_id || '',
    onboardingStatus: (db as any).onboarding_status || 'in_progress',
    onboardingStep: db.onboarding_step ?? 1,
    isProfileCompleted: Boolean((db as any).is_profile_completed),
  };
}

// =============================================================================
// PROFILE SERVICE
// =============================================================================

export const profileService = {
  /**
   * Fetch user profile from Supabase (or local fallback)
   */
  async getProfile(userId: string): Promise<ServiceResult<UserProfile>> {
    try {
      if (isSupabaseConfigured) {
        await loadLookups();

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.warn('[profileService] Profile query issue:', error.message);
          return errorResult(error.message, error.code, error);
        }

        if (data) {
          // Fetch primary photo from public.profile_photos table
          let primaryPhotoUrl = '';
          try {
            const { data: photoData } = await (supabase.from('profile_photos') as any)
              .select('storage_path')
              .eq('user_id', userId)
              .eq('is_primary', true)
              .maybeSingle();

            if (photoData?.storage_path) {
              if (photoData.storage_path.startsWith('http')) {
                primaryPhotoUrl = photoData.storage_path;
              } else {
                const { data: publicUrlData } = supabase.storage
                  .from('profile-photos')
                  .getPublicUrl(photoData.storage_path);
                primaryPhotoUrl = publicUrlData?.publicUrl || '';
              }
            }
          } catch (photoErr) {
            console.warn('[profileService] Could not fetch primary profile photo:', photoErr);
          }

          return successResult(mapDbToProfile(data, primaryPhotoUrl));
        }

        // No profile row found yet
        return successResult({ ...INITIAL_USER_PROFILE });
      }

      // Mock fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MOCK_PROFILE_STORAGE_KEY);
        if (stored) {
          return successResult(JSON.parse(stored));
        }
      }

      return successResult({ ...INITIAL_USER_PROFILE });
    } catch (err: any) {
      return errorResult(err.message || 'Failed to fetch profile');
    }
  },

  /**
   * Save or update user profile via UPDATE on existing public.profiles row.
   * Only sends permitted columns to prevent permission / schema errors.
   */
  async saveProfile(
    userId: string,
    updates: Partial<UserProfile>,
    fullProfile?: Partial<UserProfile>,
    step?: number
  ): Promise<ServiceResult<UserProfile>> {
    try {
      if (isSupabaseConfigured) {
        if (!cachedUniversities || !cachedHostels || !cachedCourses) {
          await loadLookups();
        }

        const dbPayload = mapProfileToDb(updates, fullProfile, step);
        const payloadKeys = Object.keys(dbPayload);

        // If no valid DB columns need updating in this call, return success with current state
        if (payloadKeys.length === 0) {
          return successResult({ ...(fullProfile || {}), ...updates } as UserProfile);
        }

        const { data, error } = await (supabase.from('profiles') as any)
          .update(dbPayload)
          .eq('id', userId)
          .select()
          .maybeSingle();

        if (error) {
          console.error('[ONBOARDING_SAVE] FAILED');
          console.error('[ONBOARDING_SAVE] userId:', userId);
          console.error('[ONBOARDING_SAVE] updates:', payloadKeys);
          console.error('[ONBOARDING_SAVE] error:', error);
          return errorResult(error.message, error.code, error);
        }

        console.log('[ONBOARDING_SAVE] SUCCESS');
        console.log('[ONBOARDING_SAVE] userId:', userId);
        console.log('[ONBOARDING_SAVE] saved fields:', payloadKeys);

        return successResult(mapDbToProfile(data as any));
      }

      // Local mock persistence
      let current = { ...INITIAL_USER_PROFILE };
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MOCK_PROFILE_STORAGE_KEY);
        if (stored) {
          current = JSON.parse(stored);
        }
        const updated = { ...current, ...updates };
        localStorage.setItem(MOCK_PROFILE_STORAGE_KEY, JSON.stringify(updated));
        return successResult(updated);
      }

      return successResult({ ...current, ...updates });
    } catch (err: any) {
      console.error('[ONBOARDING_SAVE] Exception:', err);
      return errorResult(err.message || 'Failed to update profile');
    }
  },

  /**
   * Securely saves the primary profile photo to the public 'profile-photos' bucket
   * and records it in public.profile_photos table with is_primary = true.
   * Strictly isolated from face verification storage and RPCs.
   */
  async savePrimaryPhoto(
    userId: string,
    photoDataUrlOrBlob: string | Blob
  ): Promise<ServiceResult<{ publicUrl: string; path: string }>> {
    try {
      if (!isSupabaseConfigured) {
        const mockUrl = typeof photoDataUrlOrBlob === 'string'
          ? photoDataUrlOrBlob
          : URL.createObjectURL(photoDataUrlOrBlob);
        return successResult({ publicUrl: mockUrl, path: mockUrl });
      }

      // 1. Upload to public 'profile-photos' CDN bucket
      let uploadRes;
      if (typeof photoDataUrlOrBlob === 'string') {
        uploadRes = await storageService.uploadDataUrl(photoDataUrlOrBlob, userId, 'avatar');
      } else {
        uploadRes = await storageService.uploadPhoto(photoDataUrlOrBlob, userId, 'avatar');
      }

      if (uploadRes.error || !uploadRes.data) {
        return errorResult(uploadRes.error?.message || 'Failed to upload profile photo');
      }

      const { publicUrl, path } = uploadRes.data;

      // 2. Remove existing primary photo record for user
      await (supabase.from('profile_photos') as any)
        .delete()
        .eq('user_id', userId)
        .eq('is_primary', true);

      // 3. Insert new primary photo record
      const { error: insertErr } = await (supabase.from('profile_photos') as any)
        .insert({
          user_id: userId,
          bucket_id: 'profile-photos',
          storage_path: path,
          is_primary: true,
          upload_status: 'completed',
        });

      if (insertErr) {
        console.warn('[profileService] Warning recording primary photo to profile_photos:', insertErr.message);
      }

      return successResult({ publicUrl, path });
    } catch (err: any) {
      console.error('[profileService] Exception in savePrimaryPhoto:', err);
      return errorResult(err.message || 'Failed to save primary photo');
    }
  },

  /**
   * Submits face verification selfie to private 'verifications' storage and calls submit_face_verification RPC.
   */
  async submitFaceVerification(
    userId: string,
    photoDataUrl: string
  ): Promise<ServiceResult<{ path: string }>> {
    try {
      if (!isSupabaseConfigured) {
        return successResult({ path: `${userId}/mock_face_verification.jpg` });
      }

      // 1. Upload to Supabase Storage in private 'verifications' bucket
      const uploadRes = await storageService.uploadVerificationDataUrl(photoDataUrl, userId);
      const storagePath = uploadRes.data?.path || `${userId}/face_verification_${Date.now()}.jpg`;

      // 2. Call secure server-side RPC submit_face_verification
      const { data, error } = await (supabase.rpc as any)('submit_face_verification', {
        p_storage_path: storagePath,
      });

      if (error) {
        console.error('[FACE_VERIFICATION] submit_face_verification RPC error:', error);
        return errorResult(error.message, error.code, error);
      }

      console.log('[FACE_VERIFICATION] submit_face_verification RPC SUCCESS:', data);
      return successResult({ path: storagePath });
    } catch (err: any) {
      console.error('[FACE_VERIFICATION] Exception in submitFaceVerification:', err);
      return errorResult(err.message || 'Face verification submission failed');
    }
  },

  /**
   * Validates required columns and atomically calls complete_student_onboarding() RPC.
   * Required columns per RPC:
   * full_name, gender, university_id, course_id, study_year, home_state, height_cm, face_verification_path.
   */
  async completeStudentOnboarding(userId: string): Promise<ServiceResult<any>> {
    try {
      if (!isSupabaseConfigured) {
        return successResult({ success: true, onboarding_status: 'completed' });
      }

      // 1. Verify required fields exist on public.profiles
      const { data: profileRow, error: fetchError } = await (supabase.from('profiles') as any)
        .select('full_name, gender, university_id, course_id, study_year, home_state, height_cm, face_verification_path')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError || !profileRow) {
        console.warn('[COMPLETE_ONBOARDING] Could not fetch profile to verify required fields:', fetchError);
        return errorResult(fetchError?.message || 'Profile not found');
      }

      const missing: string[] = [];
      if (!profileRow.full_name?.trim()) missing.push('full_name');
      if (!profileRow.gender?.trim()) missing.push('gender');
      if (!profileRow.university_id) missing.push('university_id');
      if (!profileRow.course_id) missing.push('course_id');
      if (!profileRow.study_year?.trim()) missing.push('study_year');
      if (!profileRow.home_state?.trim()) missing.push('home_state');
      if (!profileRow.height_cm || profileRow.height_cm <= 0) missing.push('height_cm');
      if (!profileRow.face_verification_path) missing.push('face_verification_path');

      if (missing.length > 0) {
        console.warn('[COMPLETE_ONBOARDING] Cannot call complete_student_onboarding yet. Missing fields:', missing);
        return errorResult(`Cannot complete onboarding. Missing required fields: ${missing.join(', ')}`);
      }

      // 2. Call public.complete_student_onboarding() RPC
      const { data, error } = await (supabase.rpc as any)('complete_student_onboarding');
      if (error) {
        console.error('[COMPLETE_ONBOARDING] RPC complete_student_onboarding error:', error);
        return errorResult(error.message, error.code, error);
      }

      console.log('[COMPLETE_ONBOARDING] RPC complete_student_onboarding SUCCESS:', data);
      return successResult(data);
    } catch (err: any) {
      console.error('[COMPLETE_ONBOARDING] Exception in completeStudentOnboarding:', err);
      return errorResult(err.message || 'Failed to complete onboarding');
    }
  },

  /**
   * Evaluates whether the user has completely registered according to database truth:
   * onboarding_status = 'completed' AND is_profile_completed = true
   */
  isRegistrationCompleted(profile: UserProfile | null): boolean {
    return isRegistrationCompleted(profile);
  },

  /**
   * Evaluates whether the core profile (steps 0 to 8) is completed
   */
  isCoreProfileCompleted(profile: UserProfile | null): boolean {
    if (!profile) return false;
    return Boolean(
      profile.fullName?.trim() &&
      profile.gender &&
      profile.collegeName &&
      profile.age >= 15 &&
      profile.heightCm > 0 &&
      profile.weightKg > 0 &&
      profile.homeState &&
      profile.collegeYear &&
      profile.department &&
      profile.isFaceVerified
    );
  },

  /**
   * Evaluates whether the Navratri event registration (steps 9 to 17) is completed
   */
  isNavratriCompleted(profile: UserProfile | null): boolean {
    if (!profile) return false;
    return Boolean(
      profile.partnerGenderPreference &&
      profile.interests &&
      profile.interests.length > 0 &&
      profile.garbaLevel &&
      profile.answerLastRound &&
      profile.answerPersonality &&
      profile.instagramId
    );
  },
};

/**
 * Helper to determine whether onboarding is completely registered based on database state:
 * onboarding_status === 'completed' AND is_profile_completed === true
 */
export function isRegistrationCompleted(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.onboardingStatus === 'completed' && Boolean(profile.isProfileCompleted);
}
