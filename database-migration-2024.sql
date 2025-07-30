-- SmartJournal Database Migration
-- This file contains all necessary updates to align the Supabase database with the codebase
-- Execute this in your Supabase SQL editor

-- =====================================================
-- 1. CREATE MISSING TABLES
-- =====================================================

-- Create leverage_points table
CREATE TABLE IF NOT EXISTS public.leverage_points (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    intervention TEXT NOT NULL,
    potential_impact INTEGER NOT NULL CHECK (potential_impact >= 0 AND potential_impact <= 10),
    implementation_status TEXT NOT NULL DEFAULT 'identified' CHECK (implementation_status IN ('identified', 'planned', 'in_progress', 'completed')),
    system_connections life_system_type[] DEFAULT ARRAY[]::life_system_type[],
    effort_required INTEGER NOT NULL CHECK (effort_required >= 0 AND effort_required <= 10),
    timeline_estimate TEXT,
    dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
    risks TEXT[] DEFAULT ARRAY[]::TEXT[],
    success_indicators TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create architectural_designs table
CREATE TABLE IF NOT EXISTS public.architectural_designs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    life_area life_system_type NOT NULL,
    current_design JSONB NOT NULL DEFAULT '{}'::jsonb,
    proposed_design JSONB NOT NULL DEFAULT '{}'::jsonb,
    implementation_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'drafted' CHECK (status IN ('drafted', 'in_progress', 'completed', 'needs_revision')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create morning_check_ins table
CREATE TABLE IF NOT EXISTS public.morning_check_ins (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    thoughts_anxieties TEXT NOT NULL,
    great_day_vision TEXT NOT NULL,
    affirmations TEXT NOT NULL,
    gratitude TEXT NOT NULL,
    challenge_generated UUID, -- Reference to generated challenge
    duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0 AND duration_minutes <= 720),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date) -- One morning check-in per day per user
);

-- Create nightly_check_ins table
CREATE TABLE IF NOT EXISTS public.nightly_check_ins (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    improvements TEXT NOT NULL,
    amazing_things TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    accomplishments TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    emotions TEXT NOT NULL,
    morning_checkin_id UUID REFERENCES public.morning_check_ins(id) ON DELETE SET NULL,
    great_day_reflection JSONB, -- AI analysis of how morning vision compared to reality
    duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0 AND duration_minutes <= 720),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date) -- One nightly check-in per day per user
);

-- Create calendar_insights table
CREATE TABLE IF NOT EXISTS public.calendar_insights (
    id TEXT PRIMARY KEY, -- Format: "user_id-YYYY-MM"
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: "2024-01"
    total_checkins INTEGER NOT NULL DEFAULT 0,
    morning_checkins INTEGER NOT NULL DEFAULT 0,
    nightly_checkins INTEGER NOT NULL DEFAULT 0,
    journal_entries INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    monthly_patterns TEXT[] DEFAULT ARRAY[]::TEXT[],
    ai_monthly_summary TEXT NOT NULL DEFAULT '',
    growth_indicators TEXT[] DEFAULT ARRAY[]::TEXT[],
    recommended_focus_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_year) -- One insight record per month per user
);

-- =====================================================
-- 2. ADD CONSTRAINTS TO EXISTING TABLES (IF THEY EXIST)
-- =====================================================

-- Add duration constraints to existing check-in tables if they exist
DO $$
BEGIN
    -- Add constraint to morning_check_ins if table exists and constraint doesn't exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'morning_check_ins') THEN
        IF NOT EXISTS (SELECT FROM information_schema.check_constraints WHERE constraint_name = 'morning_check_ins_duration_minutes_check') THEN
            ALTER TABLE public.morning_check_ins ADD CONSTRAINT morning_check_ins_duration_minutes_check CHECK (duration_minutes >= 0 AND duration_minutes <= 720);
        END IF;
    END IF;

    -- Add constraint to nightly_check_ins if table exists and constraint doesn't exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nightly_check_ins') THEN
        IF NOT EXISTS (SELECT FROM information_schema.check_constraints WHERE constraint_name = 'nightly_check_ins_duration_minutes_check') THEN
            ALTER TABLE public.nightly_check_ins ADD CONSTRAINT nightly_check_ins_duration_minutes_check CHECK (duration_minutes >= 0 AND duration_minutes <= 720);
        END IF;
    END IF;
END $$;

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for leverage_points
CREATE INDEX IF NOT EXISTS idx_leverage_points_user_id ON public.leverage_points(user_id);
CREATE INDEX IF NOT EXISTS idx_leverage_points_status ON public.leverage_points(implementation_status);

-- Indexes for architectural_designs
CREATE INDEX IF NOT EXISTS idx_architectural_designs_user_id ON public.architectural_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_architectural_designs_life_area ON public.architectural_designs(life_area);

-- Additional indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_morning_check_ins_user_date ON public.morning_check_ins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_nightly_check_ins_user_date ON public.nightly_check_ins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_date ON public.daily_check_ins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON public.journal_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON public.user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON public.patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_life_systems_user_system ON public.life_systems(user_id, system_type);

-- =====================================================
-- 4. REMOVE OR RENAME OBSOLETE TABLES
-- =====================================================

-- Drop socratic_conversations if it exists (replaced by wisdom_conversations)
DROP TABLE IF EXISTS public.socratic_conversations CASCADE;

-- =====================================================
-- 5. CREATE UPDATE TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. ADD UPDATE TRIGGERS TO ALL TABLES
-- =====================================================

-- Add triggers for automatic updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phases_updated_at BEFORE UPDATE ON public.phases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_life_systems_updated_at BEFORE UPDATE ON public.life_systems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON public.patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leverage_points_updated_at BEFORE UPDATE ON public.leverage_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_architectural_designs_updated_at BEFORE UPDATE ON public.architectural_designs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wisdom_conversations_updated_at BEFORE UPDATE ON public.wisdom_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enhanced_check_ins_updated_at BEFORE UPDATE ON public.enhanced_check_ins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_insights_updated_at BEFORE UPDATE ON public.calendar_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reflections_updated_at BEFORE UPDATE ON public.daily_reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE public.leverage_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architectural_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.morning_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nightly_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wisdom_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callback_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. VERIFY ALL TABLES ARE CREATED
-- =====================================================

-- This query will show all tables and their RLS status
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename; 