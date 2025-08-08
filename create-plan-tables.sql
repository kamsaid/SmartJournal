-- Create plan_intents table for storing clarified goals
CREATE TABLE IF NOT EXISTS public.plan_intents (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    intent_text TEXT NOT NULL, -- Original text from morning check-in
    clarified_text TEXT NOT NULL, -- AI-clarified version
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- One intent per user per date (can have multiple intents)
    UNIQUE(user_id, date, intent_text)
);

-- Create plan_tasks table for atomic actions
CREATE TABLE IF NOT EXISTS public.plan_tasks (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    intent_id UUID NOT NULL REFERENCES public.plan_intents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    est_minutes INTEGER NOT NULL CHECK (est_minutes > 0 AND est_minutes <= 30),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_plan_intents_user_date ON public.plan_intents(user_id, date);
CREATE INDEX idx_plan_tasks_intent ON public.plan_tasks(intent_id);
CREATE INDEX idx_plan_tasks_status ON public.plan_tasks(status);

-- Add RLS policies for plan_intents
ALTER TABLE public.plan_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan intents" ON public.plan_intents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plan intents" ON public.plan_intents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan intents" ON public.plan_intents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan intents" ON public.plan_intents
    FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for plan_tasks
ALTER TABLE public.plan_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan tasks" ON public.plan_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.plan_intents
            WHERE plan_intents.id = plan_tasks.intent_id
            AND plan_intents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own plan tasks" ON public.plan_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.plan_intents
            WHERE plan_intents.id = plan_tasks.intent_id
            AND plan_intents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own plan tasks" ON public.plan_tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.plan_intents
            WHERE plan_intents.id = plan_tasks.intent_id
            AND plan_intents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own plan tasks" ON public.plan_tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.plan_intents
            WHERE plan_intents.id = plan_tasks.intent_id
            AND plan_intents.user_id = auth.uid()
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plan_tasks_updated_at BEFORE UPDATE ON public.plan_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 