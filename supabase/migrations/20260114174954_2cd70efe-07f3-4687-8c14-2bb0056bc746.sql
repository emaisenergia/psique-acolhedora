-- Add confirmed status to appointments if it doesn't exist
-- The status column already accepts text, so we just need to ensure the app can use 'confirmed'

-- Create an index for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON public.appointments(date_time);

-- Create an index for patient lookups
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);