-- Add feedback_thread column to store conversation between patient and psychologist
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS feedback_thread jsonb DEFAULT '[]'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN public.activities.feedback_thread IS 'Array of comments: [{id, author: "psychologist"|"patient", content, created_at}]';