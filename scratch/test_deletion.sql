DO $$
DECLARE
    v_test_id UUID := gen_random_uuid();
    v_archive_count INT;
    v_profile_count INT;
    v_auth_count INT;
    v_res jsonb;
BEGIN
    -- 1. Insert test user into auth.users (trigger handle_new_user automatically creates profiles row)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        v_test_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'test_delete_eval@gmail.com', 'dummy_hash', now(),
        '{}'::jsonb, '{"full_name":"Archive Tester"}'::jsonb, now(), now()
    );

    -- 2. Populate profile data
    UPDATE public.profiles
    SET 
        full_name = 'Archive Tester',
        gender = 'Female',
        birth_year = 2002,
        height_cm = 165,
        weight_kg = 52.00,
        home_state = 'Maharashtra',
        study_year = '2nd Year',
        face_verification_path = v_test_id::text || '/selfie.jpg',
        verification_status = 'pending'
    WHERE id = v_test_id;

    -- 3. Simulate authenticated session for v_test_id
    PERFORM set_config('request.jwt.claim.sub', v_test_id::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    -- 4. Call delete_user_account() RPC
    v_res := public.delete_user_account();
    RAISE NOTICE 'delete_user_account RPC result: %', v_res;

    -- 5. Verify counts
    SELECT count(*) INTO v_archive_count FROM public.deleted_accounts WHERE id = v_test_id;
    SELECT count(*) INTO v_profile_count FROM public.profiles WHERE id = v_test_id;
    SELECT count(*) INTO v_auth_count FROM auth.users WHERE id = v_test_id;

    RAISE NOTICE 'Archive count: %, Profile count: %, Auth count: %', v_archive_count, v_profile_count, v_auth_count;

    IF v_archive_count = 1 AND v_profile_count = 0 AND v_auth_count = 0 THEN
        RAISE NOTICE '>>> TEST PASSED: Account successfully archived and deleted from auth.users and profiles! <<<';
    ELSE
        RAISE EXCEPTION 'TEST FAILED: Counts did not match expected values';
    END IF;

    -- 6. Clean up test record from archive
    DELETE FROM public.deleted_accounts WHERE id = v_test_id;
END;
$$;
