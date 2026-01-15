-- Add psychologist_feedback column to activities table
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS psychologist_feedback TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.activities.psychologist_feedback IS 'Feedback or comments from the psychologist on patient responses';
COMMENT ON COLUMN public.activities.feedback_at IS 'Timestamp when feedback was added or last updated';