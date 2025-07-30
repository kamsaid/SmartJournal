-- Fix Duration Constraints for Existing SmartJournal Databases
-- This file fixes existing databases that already have check-in tables but are missing duration constraints
-- Execute this in your Supabase SQL editor if you're getting duration_minutes_check constraint violations

-- =====================================================
-- 1. IDENTIFY AND FIX INVALID DURATION VALUES
-- =====================================================

-- Update any existing records with invalid durations (set to 1 minute minimum)
UPDATE public.morning_check_ins 
SET duration_minutes = GREATEST(1, LEAST(duration_minutes, 720))
WHERE duration_minutes < 1 OR duration_minutes > 720;

UPDATE public.nightly_check_ins 
SET duration_minutes = GREATEST(1, LEAST(duration_minutes, 720))
WHERE duration_minutes < 1 OR duration_minutes > 720;

-- =====================================================
-- 2. ADD MISSING DURATION CONSTRAINTS
-- =====================================================

-- Add duration constraint to morning_check_ins if it doesn't exist
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'morning_check_ins_duration_minutes_check'
        AND constraint_schema = 'public'
    ) THEN
        -- Add the constraint
        ALTER TABLE public.morning_check_ins 
        ADD CONSTRAINT morning_check_ins_duration_minutes_check 
        CHECK (duration_minutes >= 1 AND duration_minutes <= 720);
        
        RAISE NOTICE 'Added duration constraint to morning_check_ins table';
    ELSE
        RAISE NOTICE 'Duration constraint already exists for morning_check_ins table';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding constraint to morning_check_ins: %', SQLERRM;
END $$;

-- Add duration constraint to nightly_check_ins if it doesn't exist
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'nightly_check_ins_duration_minutes_check'
        AND constraint_schema = 'public'
    ) THEN
        -- Add the constraint
        ALTER TABLE public.nightly_check_ins 
        ADD CONSTRAINT nightly_check_ins_duration_minutes_check 
        CHECK (duration_minutes >= 1 AND duration_minutes <= 720);
        
        RAISE NOTICE 'Added duration constraint to nightly_check_ins table';
    ELSE
        RAISE NOTICE 'Duration constraint already exists for nightly_check_ins table';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding constraint to nightly_check_ins: %', SQLERRM;
END $$;

-- =====================================================
-- 3. VERIFY CONSTRAINTS ARE ACTIVE
-- =====================================================

-- Query to verify constraints are in place
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.constraint_name LIKE '%duration_minutes_check'
ORDER BY tc.table_name;

-- =====================================================
-- 4. VALIDATE DATA AFTER CONSTRAINT ADDITION
-- =====================================================

-- Check for any remaining invalid duration values
SELECT 
    'morning_check_ins' as table_name,
    COUNT(*) as invalid_count,
    MIN(duration_minutes) as min_duration,
    MAX(duration_minutes) as max_duration
FROM public.morning_check_ins 
WHERE duration_minutes < 1 OR duration_minutes > 720

UNION ALL

SELECT 
    'nightly_check_ins' as table_name,
    COUNT(*) as invalid_count,
    MIN(duration_minutes) as min_duration,
    MAX(duration_minutes) as max_duration
FROM public.nightly_check_ins 
WHERE duration_minutes < 1 OR duration_minutes > 720; 