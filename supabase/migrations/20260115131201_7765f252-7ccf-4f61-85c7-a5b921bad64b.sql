-- Add new columns to treatment_plans for goal completion tracking and improvements
ALTER TABLE public.treatment_plans
ADD COLUMN IF NOT EXISTS goal_results JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS improvements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS current_status TEXT DEFAULT 'em_andamento',
ADD COLUMN IF NOT EXISTS current_status_notes TEXT,
ADD COLUMN IF NOT EXISTS last_review_date DATE,
ADD COLUMN IF NOT EXISTS next_review_date DATE;