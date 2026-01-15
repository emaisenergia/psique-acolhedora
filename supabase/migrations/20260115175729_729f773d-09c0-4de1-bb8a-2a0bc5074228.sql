-- Add response_history column to activities table to track edits
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS response_history JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.activities.response_history IS 'Array of historical response snapshots with timestamps';