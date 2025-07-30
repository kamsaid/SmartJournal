-- EMERGENCY FIX: Disable email confirmation entirely
-- Run this in your Supabase SQL Editor

-- 1. Manually confirm all existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Create a function to manually confirm users (callable from app)
CREATE OR REPLACE FUNCTION confirm_user_manually(user_email TEXT)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    user_record auth.users%ROWTYPE;
    result JSON;
BEGIN
    -- Find the user by email
    SELECT * INTO user_record 
    FROM auth.users 
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User not found with email: ' || user_email
        );
    END IF;
    
    -- Check if already confirmed
    IF user_record.email_confirmed_at IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'message', 'User already confirmed'
        );
    END IF;
    
    -- Confirm the user
    UPDATE auth.users 
    SET email_confirmed_at = NOW(),
        confirmed_at = NOW()
    WHERE email = user_email;
    
    RETURN json_build_object(
        'success', true,
        'message', 'User confirmed successfully'
    );
END;
$$;

-- 3. Grant permissions for the function
GRANT EXECUTE ON FUNCTION confirm_user_manually(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_user_manually(TEXT) TO anon;

-- 4. Verify the users are now confirmed
SELECT 
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users 
WHERE email IN ('test@smartjournal.com', 'dev@smartjournal.com', 'sssadev@smartjournal.com')
ORDER BY created_at DESC;

-- 5. If you have users in your public.users table, make sure they exist
-- This query will show if there are auth users without corresponding public users
SELECT 
    au.email,
    au.id as auth_id,
    au.email_confirmed_at,
    pu.id as profile_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email IN ('test@smartjournal.com', 'dev@smartjournal.com', 'sssadev@smartjournal.com'); 