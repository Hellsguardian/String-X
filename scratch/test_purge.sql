DO $$
DECLARE
    v_test_id UUID := gen_random_uuid();
    v_res jsonb;
    v_archive_count INT;
BEGIN
    -- 1. Insert an artificial expired deleted account (35 days ago)
    INSERT INTO public.deleted_accounts (
        id, user_code, full_name, gender, birth_year, university_id, hostel_id, course_id,
        study_year, home_state, height_cm, weight_kg, instagram_id, verification_status,
        face_verification_path, face_verified_at, verification_rejection_reason, is_premium,
        premium_started_at, premium_expires_at, onboarding_status, onboarding_step,
        is_profile_completed, created_at, updated_at, deleted_at
    ) VALUES (
        v_test_id, 'SX888', 'Purge Test', 'Male', 2001, null, null, null,
        '4th Year', 'Rajasthan', 180, 75.00, null, 'not_started',
        null, null, null, false,
        null, null, 'completed', 9,
        true, now() - INTERVAL '40 days', now() - INTERVAL '35 days', now() - INTERVAL '35 days'
    );

    -- 2. Call purge function for accounts older than 30 days
    v_res := public.purge_expired_deleted_accounts(30);
    RAISE NOTICE 'purge_expired_deleted_accounts result: %', v_res;

    -- 3. Verify it was purged
    SELECT count(*) INTO v_archive_count FROM public.deleted_accounts WHERE id = v_test_id;

    IF v_archive_count = 0 THEN
        RAISE NOTICE '>>> TEST PASSED: Expired deleted account was successfully purged! <<<';
    ELSE
        RAISE EXCEPTION 'TEST FAILED: Expired account was not purged';
    END IF;
END;
$$;
