-- Add columns for customizable activity fields, attachments, and patient responses
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS attachment_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS attachment_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS patient_responses JSONB DEFAULT NULL;