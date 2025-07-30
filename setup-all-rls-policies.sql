-- SmartJournal RLS Policies Setup
-- This file sets up Row Level Security policies for all tables
-- Execute this AFTER running database-migration-2024.sql

-- =====================================================
-- 1. DROP EXISTING POLICIES (Clean slate approach)
-- =====================================================

-- Drop existing policies that are too permissive
DROP POLICY IF EXISTS "Allow all authenticated users - morning check-ins" ON public.morning_check_ins;
DROP POLICY IF EXISTS "Allow anon users - morning check-ins" ON public.morning_check_ins;
DROP POLICY IF EXISTS "Allow all authenticated users - nightly check-ins" ON public.nightly_check_ins;
DROP POLICY IF EXISTS "Allow anon users - nightly check-ins" ON public.nightly_check_ins;

-- Drop any other existing policies to ensure clean state
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- =====================================================
-- 2. CREATE RLS POLICIES FOR USERS TABLE
-- =====================================================

-- Users can view their own profile
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 3. CREATE RLS POLICIES FOR PHASES TABLE
-- =====================================================

CREATE POLICY "phases_select_own" ON public.phases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "phases_insert_own" ON public.phases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "phases_update_own" ON public.phases
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "phases_delete_own" ON public.phases
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. CREATE RLS POLICIES FOR LIFE_SYSTEMS TABLE
-- =====================================================

CREATE POLICY "life_systems_select_own" ON public.life_systems
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "life_systems_insert_own" ON public.life_systems
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "life_systems_update_own" ON public.life_systems
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "life_systems_delete_own" ON public.life_systems
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. CREATE RLS POLICIES FOR PATTERNS TABLE
-- =====================================================

CREATE POLICY "patterns_select_own" ON public.patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "patterns_insert_own" ON public.patterns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "patterns_update_own" ON public.patterns
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "patterns_delete_own" ON public.patterns
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. CREATE RLS POLICIES FOR LEVERAGE_POINTS TABLE
-- =====================================================

CREATE POLICY "leverage_points_select_own" ON public.leverage_points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "leverage_points_insert_own" ON public.leverage_points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leverage_points_update_own" ON public.leverage_points
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leverage_points_delete_own" ON public.leverage_points
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. CREATE RLS POLICIES FOR ARCHITECTURAL_DESIGNS TABLE
-- =====================================================

CREATE POLICY "architectural_designs_select_own" ON public.architectural_designs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "architectural_designs_insert_own" ON public.architectural_designs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "architectural_designs_update_own" ON public.architectural_designs
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "architectural_designs_delete_own" ON public.architectural_designs
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 8. CREATE RLS POLICIES FOR MORNING_CHECK_INS TABLE
-- =====================================================

CREATE POLICY "morning_check_ins_select_own" ON public.morning_check_ins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "morning_check_ins_insert_own" ON public.morning_check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "morning_check_ins_update_own" ON public.morning_check_ins
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "morning_check_ins_delete_own" ON public.morning_check_ins
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 9. CREATE RLS POLICIES FOR NIGHTLY_CHECK_INS TABLE
-- =====================================================

CREATE POLICY "nightly_check_ins_select_own" ON public.nightly_check_ins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "nightly_check_ins_insert_own" ON public.nightly_check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "nightly_check_ins_update_own" ON public.nightly_check_ins
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "nightly_check_ins_delete_own" ON public.nightly_check_ins
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 10. CREATE RLS POLICIES FOR DAILY_CHECK_INS TABLE
-- =====================================================

CREATE POLICY "daily_check_ins_select_own" ON public.daily_check_ins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_check_ins_insert_own" ON public.daily_check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_check_ins_update_own" ON public.daily_check_ins
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_check_ins_delete_own" ON public.daily_check_ins
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 11. CREATE RLS POLICIES FOR DAILY_CHALLENGES TABLE
-- =====================================================

CREATE POLICY "daily_challenges_select_own" ON public.daily_challenges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_challenges_insert_own" ON public.daily_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_challenges_update_own" ON public.daily_challenges
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_challenges_delete_own" ON public.daily_challenges
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 12. CREATE RLS POLICIES FOR JOURNAL_ENTRIES TABLE
-- =====================================================

CREATE POLICY "journal_entries_select_own" ON public.journal_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "journal_entries_insert_own" ON public.journal_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_entries_update_own" ON public.journal_entries
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_entries_delete_own" ON public.journal_entries
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 13. CREATE RLS POLICIES FOR WISDOM_CONVERSATIONS TABLE
-- =====================================================

CREATE POLICY "wisdom_conversations_select_own" ON public.wisdom_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wisdom_conversations_insert_own" ON public.wisdom_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wisdom_conversations_update_own" ON public.wisdom_conversations
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wisdom_conversations_delete_own" ON public.wisdom_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 14. CREATE RLS POLICIES FOR SYSTEM_ANALYSES TABLE
-- =====================================================

CREATE POLICY "system_analyses_select_own" ON public.system_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "system_analyses_insert_own" ON public.system_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "system_analyses_update_own" ON public.system_analyses
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "system_analyses_delete_own" ON public.system_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 15. CREATE RLS POLICIES FOR USER_MEMORIES TABLE
-- =====================================================

CREATE POLICY "user_memories_select_own" ON public.user_memories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_memories_insert_own" ON public.user_memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_memories_update_own" ON public.user_memories
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_memories_delete_own" ON public.user_memories
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 16. CREATE RLS POLICIES FOR USER_PROGRESS TABLE
-- =====================================================

CREATE POLICY "user_progress_select_own" ON public.user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_progress_insert_own" ON public.user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress_update_own" ON public.user_progress
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress_delete_own" ON public.user_progress
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 17. CREATE RLS POLICIES FOR ENHANCED_CHECK_INS TABLE
-- =====================================================

CREATE POLICY "enhanced_check_ins_select_own" ON public.enhanced_check_ins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "enhanced_check_ins_insert_own" ON public.enhanced_check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enhanced_check_ins_update_own" ON public.enhanced_check_ins
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enhanced_check_ins_delete_own" ON public.enhanced_check_ins
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 18. CREATE RLS POLICIES FOR CALENDAR_INSIGHTS TABLE
-- =====================================================

CREATE POLICY "calendar_insights_select_own" ON public.calendar_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "calendar_insights_insert_own" ON public.calendar_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_insights_update_own" ON public.calendar_insights
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_insights_delete_own" ON public.calendar_insights
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 19. CREATE RLS POLICIES FOR CALLBACK_QUESTIONS TABLE
-- =====================================================

CREATE POLICY "callback_questions_select_own" ON public.callback_questions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "callback_questions_insert_own" ON public.callback_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "callback_questions_update_own" ON public.callback_questions
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "callback_questions_delete_own" ON public.callback_questions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 20. CREATE RLS POLICIES FOR DAILY_REFLECTIONS TABLE
-- =====================================================

CREATE POLICY "daily_reflections_select_own" ON public.daily_reflections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_reflections_insert_own" ON public.daily_reflections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_reflections_update_own" ON public.daily_reflections
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_reflections_delete_own" ON public.daily_reflections
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 21. CREATE RLS POLICIES FOR QUESTION_TEMPLATES TABLE
-- =====================================================

-- Question templates are read-only for all authenticated users
CREATE POLICY "question_templates_select_all" ON public.question_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify question templates (optional - adjust as needed)
-- CREATE POLICY "question_templates_admin_all" ON public.question_templates
--     FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- 22. GRANT PERMISSIONS TO ROLES
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant limited permissions to anon users (only for signup)
GRANT INSERT ON public.users TO anon;

-- =====================================================
-- 23. VERIFY RLS IS ENABLED AND POLICIES ARE CREATED
-- =====================================================

-- Check RLS status
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd; 