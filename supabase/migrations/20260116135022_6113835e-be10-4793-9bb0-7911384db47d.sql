-- Add appointment_type column to distinguish between session, blocked, and personal
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'session';

-- Add check constraint for appointment_type
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_appointment_type_check 
CHECK (appointment_type IN ('session', 'blocked', 'personal'));

-- Add block_reason column for storing the reason for blocks/personal appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Make patient_id nullable to allow blocks without a patient
ALTER TABLE public.appointments 
ALTER COLUMN patient_id DROP NOT NULL;